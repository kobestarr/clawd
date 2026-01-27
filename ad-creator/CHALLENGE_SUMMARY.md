# Reddit Ad Creator - Challenge Summary

## The Goal

Build a tool that:
1. Reads ad copy from Google Sheets
2. Generates all permutations (headlines × body × CTAs × URLs × images)
3. Creates Reddit posts with custom copy
4. Creates Reddit ads promoting those posts
5. Fully automated - no manual steps in Reddit UI

---

## The Challenge

### Problem 1: Ad Created Didn't Use Our Test Data

When we ran the API to create an ad with this data:
```
Headline: "Test Headline"
Body: "Test body copy Lorem Ipsum..."
CTA: DOWNLOAD
URL: https://bluprintx.com/agentforce-360-min/...
```

**What Reddit Created:**
```
Headline: "Your boss want AI in Salesforce. Here are 7 Agentforce lessons..."
CTA: Download
URL: https://bluprintx.com/agentforce-360/... (old URL)
```

**Root Cause:** Reddit's Ads API works by **promoting existing posts**, not creating new ad creative. The `post_id` field is required, and the ad shows the post's headline/body/CTA, not what we sent in the API call.

**Evidence:**
- Reddit Ads API requires `post_id` for all ad creation
- Our API calls with `headline`, `body`, `call_to_action` were rejected or ignored
- The ad shows whatever content exists on the promoted post

**Docs:** https://ads-api.reddit.com/docs/v3/

---

### Problem 2: Duplicate Ads Created

We ran the API twice and got:
1. Ad ID: `2424190189158029151` - "Claude Test Ad"
2. Ad ID: `2424190631497941857` - "Test Headline Ad"

**Root Cause:** No duplicate detection. Each API call created a new ad promoting the same `post_id`.

**Evidence:** Both ads reference `post_id: t3_1qniqlu`

---

### Problem 3: Freeform (Text) Ads Require post_id

We tried creating a freeform ad with:
```json
{
  "creative_type": "freeform",
  "headline": "Your boss want AI in Salesforce...",
  "body": "Here are 7 Agentforce lessons...",
  "call_to_action": "DOWNLOAD"
}
```

**Response:** `post_id is required`

**Docs:** Reddit freeform ads still need to reference a post.

---

## The Solution Path

### Option A: Reddit Native API (for post creation)

Reddit has TWO separate APIs:

| API | Purpose | Can Create Posts? |
|-----|---------|------------------|
| Ads API | Ad management | ❌ No |
| Native API | Content creation | ✅ Yes |

To create posts with custom copy, we need Reddit's Native API with user OAuth.

**Native API Docs:** https://www.reddit.com/dev/api/

**Challenge:** Native API requires separate OAuth flow and commercial approval.

**Commercial Approval Form:** https://support.reddithelp.com/hc/en-us/requests/new?ticket_form_id=14868593862164

---

### Option B: Devvit (Reddit's App Platform)

We explored Devvit as an alternative.

**Devvit Web Overview:** https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview

**Devvit API Reference:** https://developers.reddit.com/docs/next/api/public-api/classes/Devvit

**Finding:** Devvit is for creating interactive apps that live INSIDE Reddit posts. It cannot:
- Create standalone posts on subreddits
- Create ads
- Automate marketing content

**Conclusion:** Devvit is NOT the solution for our use case.

---

## Current Architecture (What We've Built)

```
GitHub: https://github.com/kobestarr/ad-creator

Files:
├── lib/
│   ├── reddit-api.js          # Ads API integration (working)
│   ├── reddit-native-oauth.js # Native API OAuth (ready)
│   └── reddit-native-posts.js # Post creation (ready)
├── create-post-and-ad.js      # CLI tool (ready)
├── test-performance.js        # Performance reporting
└── .env.example               # Environment config
```

---

## What's Working

| Capability | Status | Notes |
|------------|--------|-------|
| OAuth with Reddit Ads API | ✅ Working | `test-reddit-api.js` passes |
| List ads | ✅ Working | 7 ads listed |
| Create ads promoting existing posts | ✅ Working | But shows post content, not our data |
| List user's posts | ✅ Working | Via profiles/{id}/posts |
| Native API OAuth scaffolding | ✅ Ready | Needs credentials |
| Post creation function | ✅ Ready | Needs Native API access |

---

## What's NOT Working

| Capability | Status | Blocker |
|------------|--------|---------|
| Create posts with custom copy | ❌ Blocked | Needs Native API |
| Freeform ads with custom headline/body | ❌ Blocked | Requires post_id |
| Duplicate detection | ❌ Not implemented | Feature gap |
| Preview before publish | ❌ Not implemented | Feature gap |
| Google Sheets integration | ❌ Not started | Future |

---

## Required Next Steps

### 1. Submit Commercial Approval Form

**URL:** https://support.reddithelp.com/hc/en-us/requests/new?ticket_form_id=14868593862164

**Information to provide:**
- Use case: "Marketing automation for client campaigns"
- API endpoints: Ads API + Native API
- Volume: Estimate posts/ads per month

### 2. Create Reddit Native API App

**URL:** https://www.reddit.com/prefs/apps

**Settings:**
- Type: `script`
- Redirect URI: `https://bluprintx.com/privacy`
- Scopes: `identity`, `submit`, `mysubreddits`

### 3. Add Native API Credentials

Add to `.env`:
```
REDDIT_NATIVE_CLIENT_ID=...
REDDIT_NATIVE_CLIENT_SECRET=...
```

### 4. Run OAuth Setup

```bash
node create-post-and-ad.js --setup --client bluprintx
```

### 5. Implement Features

- Duplicate detection (check if post_id already has ad)
- Preview page (see ad before publishing)
- Google Sheets integration
- Permutation generator

---

## Key Documentation Links

| Topic | Link |
|-------|------|
| Reddit Ads API v3 | https://ads-api.reddit.com/docs/v3/ |
| Reddit Native API | https://www.reddit.com/dev/api/ |
| Commercial Approval Form | https://support.reddithelp.com/hc/en-us/requests/new?ticket_form_id=14868593862164 |
| Devvit Platform | https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview |
| Devvit API Reference | https://developers.reddit.com/docs/next/api/public-api/classes/Devvit |
| Ads API Terms | https://business.reddithelp.com/s/article/Reddit-Ads-API-Terms |

---

## GitHub Repository

**URL:** https://github.com/kobestarr/ad-creator

**Latest Commit:** `a371cbb` - Add Reddit Native API support for post creation

---

## Open Questions for Reviewers

1. **Is there a way to create freeform ads WITHOUT a post_id?**
2. **Can we use Reddit's native posting API without commercial approval for non-promotional content?**
3. **Is there an alternative approach to creating ads with custom headlines that we've missed?**

---

*Last Updated: 2026-01-27*
*Author: AI Development Team*
