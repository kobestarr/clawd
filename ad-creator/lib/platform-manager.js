/**
 * Platform Manager - Multi-Platform, Multi-Client Ad System
 * 
 * Handles credential management and account switching for:
 * - LinkedIn
 * - Reddit  
 * - Meta (Facebook/Instagram)
 * 
 * Usage:
 *   const platform = require('./lib/platform-manager');
 *   
 *   // Load platform + client
 *   const reddit = platform.load('reddit', 'kobestarr-digital');
 *   
 *   // Get credentials
 *   const credentials = reddit.getCredentials();
 *   
 *   // Check if authenticated
 *   if (!reddit.isAuthenticated()) {
 *     await reddit.authenticate();
 *   }
 *   
 *   // Use platform API
 *   const result = await reddit.uploadAd(adDefinition);
 */

const fs = require('fs');
const path = require('path');

// Base path for all platform configs
const BASE_PATH = process.env.CLADBOT_PLATFORMS_PATH || path.join(process.env.HOME, '.clawdbot', 'platforms');

// Supported platforms
const PLATFORMS = ['linkedin', 'reddit', 'meta'];

/**
 * Platform Manager Class
 */
class PlatformManager {
  constructor(platform, client) {
    this.platform = platform.toLowerCase();
    this.client = client.toLowerCase().replace(/\s+/g, '-');
    this.platformPath = path.join(BASE_PATH, this.platform);
    this.clientPath = path.join(this.platformPath, 'clients', this.client);
    
    this._validatePaths();
  }
  
  /**
   * Validate that required paths exist
   */
  _validatePaths() {
    if (!fs.existsSync(this.platformPath)) {
      throw new Error(`Platform not found: ${this.platform}\nRun: mkdir -p ${this.platformPath}/clients/{kobestarr-digital,stripped-media}`);
    }
    
    if (!fs.existsSync(this.clientPath)) {
      throw new Error(`Client not found: ${this.client}\nPath: ${this.clientPath}`);
    }
  }
  
  /**
   * Load app-level credentials (shared across all clients)
   */
  getAppCredentials() {
    const appCredPath = path.join(this.platformPath, 'app-credentials.json');
    
    if (!fs.existsSync(appCredPath)) {
      throw new Error(`App credentials not found for ${this.platform}\nCreate: ${appCredPath}`);
    }
    
    return JSON.parse(fs.readFileSync(appCredPath, 'utf8'));
  }
  
  /**
   * Load client-specific credentials
   */
  getClientCredentials() {
    const clientCredPath = path.join(this.clientPath, 'credentials.json');
    
    if (!fs.existsSync(clientCredPath)) {
      throw new Error(`Client credentials not found\nPath: ${clientCredPath}`);
    }
    
    return JSON.parse(fs.readFileSync(clientCredPath, 'utf8'));
  }
  
  /**
   * Get OAuth token
   */
  getToken() {
    const tokenPath = path.join(this.clientPath, 'token.json');
    
    if (!fs.existsSync(tokenPath)) {
      return null;
    }
    
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    
    // Check if expired
    if (token.expires_at && Date.now() > token.expires_at) {
      return null; // Token expired
    }
    
    return token;
  }
  
  /**
   * Check if authenticated (valid token exists)
   */
  isAuthenticated() {
    return this.getToken() !== null;
  }
  
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state = 'default') {
    const appCred = this.getAppCredentials();
    const redirectUri = appCred.redirect_uri || 'http://localhost:8080/callback';
    
    const baseUrls = {
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      reddit: 'https://www.reddit.com/api/v1/authorize',
      meta: 'https://www.facebook.com/v18.0/dialog/oauth'
    };
    
    const scopes = {
      linkedin: 'r_ads rw_ads r_ads_reporting',
      reddit: 'adsread adsedit adsconversions history read',
      meta: 'ads_management,ads_read,business_management,pages_read_engagement'
    };
    
    const baseUrl = baseUrls[this.platform];
    const scope = scopes[this.platform];
    
    const params = new URLSearchParams({
      client_id: appCred.client_id,
      redirect_uri: redirectUri,
      scope: scope,
      state: state,
      response_type: 'code'
    });
    
    // Platform-specific tweaks
    if (this.platform === 'reddit') {
      params.set('duration', 'permanent');
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Save token after OAuth
   */
  async saveToken(tokenData) {
    // Calculate expiration
    const token = {
      ...tokenData,
      obtained: new Date().toISOString(),
      expires_at: tokenData.expires_in 
        ? Date.now() + (tokenData.expires_in * 1000)
        : null
    };
    
    const tokenPath = path.join(this.clientPath, 'token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
    
    console.log(`✅ Token saved: ${tokenPath}`);
    return token;
  }
  
  /**
   * Get all configured clients for a platform
   */
  static getClients(platform) {
    const platformPath = path.join(BASE_PATH, platform, 'clients');
    
    if (!fs.existsSync(platformPath)) {
      return [];
    }
    
    return fs.readdirSync(platformPath)
      .filter(name => fs.statSync(path.join(platformPath, name)).isDirectory());
  }
  
  /**
   * Get all configured platforms
   */
  static getPlatforms() {
    if (!fs.existsSync(BASE_PATH)) {
      return [];
    }
    
    return fs.readdirSync(BASE_PATH)
      .filter(name => fs.statSync(path.join(BASE_PATH, name)).isDirectory());
  }
  
  /**
   * Initialize platform folder structure
   */
  static async initializePlatform(platform, clients = []) {
    const platformPath = path.join(BASE_PATH, platform);
    
    // Create platform directory
    fs.mkdirSync(platformPath, { recursive: true });
    fs.mkdirSync(path.join(platformPath, 'clients'), { recursive: true });
    
    // Create README
    const readmePath = path.join(platformPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, `# ${platform.charAt(0).toUpperCase() + platform.slice(1)} Platform Setup\n\nSee parent directory for documentation.\n`);
    }
    
    // Create client directories
    for (const client of clients) {
      const clientPath = path.join(platformPath, 'clients', client.toLowerCase().replace(/\s+/g, '-'));
      fs.mkdirSync(clientPath, { recursive: true });
    }
    
    console.log(`✅ Initialized ${platform} with ${clients.length} clients`);
    return { platform, clients, path: platformPath };
  }
}

/**
 * Factory function to load platform
 */
function load(platform, client) {
  return new PlatformManager(platform, client);
}

/**
 * Get status of all platforms and clients
 */
function status() {
  const platforms = PlatformManager.getPlatforms();
  
  console.log('\n📊 Platform Status\n');
  console.log('═'.repeat(60));
  
  for (const platform of platforms) {
    const clients = PlatformManager.getClients(platform);
    
    console.log(`\n🔹 ${platform.toUpperCase()}`);
    
    for (const client of clients) {
      const pm = new PlatformManager(platform, client);
      const authenticated = pm.isAuthenticated();
      
      console.log(`   ${authenticated ? '✅' : '⚠️ '} ${client}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\nTo set up a platform/client, run:');
  console.log('  node lib/platform-manager.js init --platform reddit --client kobestarr-digital\n');
}

module.exports = {
  PlatformManager,
  load,
  status,
  PLATFORMS
};
