/**
 * Reddit Ads API Integration
 *
 * Multi-client Reddit API authentication and campaign management
 * Base URL: https://ads-api.reddit.com/api/v2.0
 *
 * Supports multiple clients with separate credentials
 */

const https = require('https');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

const BASE_URL = 'ads-api.reddit.com';
const API_PATH = '/api/v2.0';

/**
 * Find client credentials
 * @param {string} clientName - Client name (e.g., "bluprintx")
 * @returns {Promise<string|null>} - Path to credentials file
 */
async function findCredentials(clientName) {
  const possiblePaths = [
    // Project config directory
    path.join(__dirname, `../config/reddit-${clientName}.json`),
    // User home directory
    path.join(os.homedir(), '.ad-creator', `reddit-${clientName}.json`),
    // Environment variable
    process.env[`REDDIT_CREDENTIALS_${clientName.toUpperCase()}`]
  ];

  for (const credPath of possiblePaths) {
    if (credPath && fsSync.existsSync(credPath)) {
      try {
        const content = await fs.readFile(credPath, 'utf8');
        JSON.parse(content); // Validate JSON
        return credPath;
      } catch (error) {
        // Invalid JSON, continue
      }
    }
  }

  return null;
}

/**
 * Load client credentials
 * @param {string} clientName - Client name
 * @returns {Promise<object>} - Credentials object
 */
async function loadCredentials(clientName) {
  const credPath = await findCredentials(clientName);

  if (!credPath) {
    throw new Error(`Credentials not found for client: ${clientName}. Run: npm run setup:reddit ${clientName}`);
  }

  const content = await fs.readFile(credPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Save client credentials
 * @param {string} clientName - Client name
 * @param {object} credentials - Credentials object
 */
async function saveCredentials(clientName, credentials) {
  const configDir = path.join(__dirname, '../config');

  if (!fsSync.existsSync(configDir)) {
    await fs.mkdir(configDir, { recursive: true });
  }

  const credPath = path.join(configDir, `reddit-${clientName}.json`);
  await fs.writeFile(credPath, JSON.stringify(credentials, null, 2));

  return credPath;
}

/**
 * Load tokens for a client
 * @param {string} clientName - Client name
 * @returns {Promise<object|null>} - Tokens object or null
 */
async function loadTokens(clientName) {
  const tokenPath = path.join(os.homedir(), '.ad-creator', `reddit-tokens-${clientName}.json`);

  if (!fsSync.existsSync(tokenPath)) {
    return null;
  }

  try {
    const content = await fs.readFile(tokenPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Save tokens for a client
 * @param {string} clientName - Client name
 * @param {object} tokens - Tokens object
 */
async function saveTokens(clientName, tokens) {
  const tokenDir = path.join(os.homedir(), '.ad-creator');

  if (!fsSync.existsSync(tokenDir)) {
    await fs.mkdir(tokenDir, { recursive: true });
  }

  const tokenPath = path.join(tokenDir, `reddit-tokens-${clientName}.json`);
  await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));

  return tokenPath;
}

/**
 * Generate authorization URL for user to visit
 * @param {object} credentials - Client credentials
 * @returns {string} - Authorization URL
 */
function getAuthorizationUrl(credentials) {
  const params = new URLSearchParams({
    client_id: credentials.client_id,
    response_type: 'code',
    state: Math.random().toString(36).substring(7),
    redirect_uri: credentials.redirect_uri,
    duration: 'permanent',
    scope: credentials.token_scopes ? credentials.token_scopes.join(',') : 'adsread,adsedit,history'
  });

  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {object} credentials - Client credentials
 * @param {string} code - Authorization code from redirect
 * @returns {Promise<object>} - Token response with access_token and refresh_token
 */
async function exchangeCodeForToken(credentials, code) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: credentials.redirect_uri
    });

    const postData = params.toString();
    const auth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');

    const req = https.request({
      hostname: 'www.reddit.com',
      path: '/api/v1/access_token',
      method: 'POST',
      headers: {
        'User-Agent': credentials.user_agent || 'ad-creator/2.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          try {
            const errorBody = JSON.parse(data);
            reject(new Error(`OAuth error: ${res.statusCode} - ${errorBody.error || errorBody.message || data}`));
          } catch (e) {
            reject(new Error(`OAuth error: ${res.statusCode} - ${data || 'Unknown error'}`));
          }
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`OAuth error: ${response.error} - ${response.message || ''}`));
          } else if (response.access_token) {
            resolve(response);
          } else {
            reject(new Error('No access token in response'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse OAuth response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Refresh access token using refresh token
 * @param {object} credentials - Client credentials
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<object>} - New token response
 */
async function refreshAccessToken(credentials, refreshToken) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const postData = params.toString();
    const auth = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');

    const req = https.request({
      hostname: 'www.reddit.com',
      path: '/api/v1/access_token',
      method: 'POST',
      headers: {
        'User-Agent': credentials.user_agent || 'ad-creator/2.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          try {
            const errorBody = JSON.parse(data);
            reject(new Error(`Refresh error: ${res.statusCode} - ${errorBody.error || errorBody.message || data}`));
          } catch (e) {
            reject(new Error(`Refresh error: ${res.statusCode} - ${data || 'Unknown error'}`));
          }
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`Refresh error: ${response.error} - ${response.message || ''}`));
          } else if (response.access_token) {
            resolve(response);
          } else {
            reject(new Error('No access token in refresh response'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse refresh response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Get OAuth access token (with auto-refresh)
 * @param {string} clientName - Client name
 * @returns {Promise<string>} - Access token
 */
async function getAccessToken(clientName) {
  const credentials = await loadCredentials(clientName);
  const tokens = await loadTokens(clientName);

  if (!tokens) {
    throw new Error(`No tokens found for client: ${clientName}. Run: npm run setup:reddit`);
  }

  // Check if token is expired (expires_at is set during save)
  const now = Date.now();
  if (tokens.expires_at && tokens.expires_at > now) {
    // Token still valid
    return tokens.access_token;
  }

  // Token expired, refresh it
  if (!tokens.refresh_token) {
    throw new Error(`Refresh token not found for client: ${clientName}. Re-run: npm run setup:reddit`);
  }

  try {
    const newTokens = await refreshAccessToken(credentials, tokens.refresh_token);

    // Save new tokens
    const tokenData = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token, // Keep old refresh token if not provided
      expires_in: newTokens.expires_in,
      expires_at: Date.now() + (newTokens.expires_in * 1000) - 60000, // Subtract 1 min buffer
      token_type: newTokens.token_type,
      scope: newTokens.scope
    };

    await saveTokens(clientName, tokenData);

    return newTokens.access_token;
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error.message}. Re-run: npm run setup:reddit`);
  }
}

/**
 * Make authenticated API request
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint path (e.g., "/ad_accounts")
 * @param {string} accessToken - OAuth access token
 * @param {object} options - Request options
 * @returns {Promise<object>} - API response
 */
async function apiRequest(method, endpoint, accessToken, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: BASE_URL,
      path: API_PATH + endpoint,
      method: method,
      headers: {
        'User-Agent': 'ad-creator/2.0',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = data ? JSON.parse(data) : {};

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API error ${res.statusCode}: ${response.message || data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Get ad account information
 * @param {string} clientName - Client name
 * @param {string} accountId - Ad account ID
 * @returns {Promise<object>} - Account info
 */
async function getAdAccount(clientName, accountId) {
  const accessToken = await getAccessToken(clientName);
  return await apiRequest('GET', `/accounts/${accountId}`, accessToken);
}

/**
 * List all accessible ad accounts
 * @param {string} clientName - Client name
 * @returns {Promise<Array>} - List of ad accounts
 */
async function listAdAccounts(clientName) {
  const accessToken = await getAccessToken(clientName);
  return await apiRequest('GET', '/accounts', accessToken);
}

/**
 * Create a campaign
 * @param {string} clientName - Client name
 * @param {string} accountId - Ad account ID
 * @param {object} campaign - Campaign data
 * @returns {Promise<object>} - Created campaign
 */
async function createCampaign(clientName, accountId, campaign) {
  const accessToken = await getAccessToken(clientName);
  return await apiRequest('POST', `/accounts/${accountId}/campaigns`, accessToken, {
    body: campaign
  });
}

/**
 * Upload image for ad creative
 * @param {string} clientName - Client name
 * @param {string} accountId - Ad account ID
 * @param {string} imagePath - Path to image file
 * @returns {Promise<object>} - Upload result
 */
async function uploadImage(clientName, accountId, imagePath) {
  const accessToken = await getAccessToken(clientName);

  // Note: Image upload typically requires multipart/form-data
  // This is a simplified version - may need to use form-data library
  const imageData = await fs.readFile(imagePath);

  return await apiRequest('POST', `/accounts/${accountId}/creatives`, accessToken, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    body: imageData
  });
}

/**
 * Create ad
 * @param {string} clientName - Client name
 * @param {string} accountId - Ad account ID
 * @param {string} adGroupId - Ad group ID
 * @param {object} ad - Ad data
 * @returns {Promise<object>} - Created ad
 */
async function createAd(clientName, accountId, adGroupId, ad) {
  const accessToken = await getAccessToken(clientName);
  return await apiRequest('POST', `/accounts/${accountId}/ad_groups/${adGroupId}/ads`, accessToken, {
    body: ad
  });
}

/**
 * Check if client is configured
 * @param {string} clientName - Client name
 * @returns {Promise<boolean>}
 */
async function checkConfiguration(clientName) {
  try {
    const credPath = await findCredentials(clientName);
    return credPath !== null;
  } catch (error) {
    return false;
  }
}

module.exports = {
  findCredentials,
  loadCredentials,
  saveCredentials,
  loadTokens,
  saveTokens,
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getAccessToken,
  apiRequest,
  getAdAccount,
  listAdAccounts,
  createCampaign,
  uploadImage,
  createAd,
  checkConfiguration
};
