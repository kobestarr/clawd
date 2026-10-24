# Product Requirements Document: Ad Creator

**Version:** 1.0
**Date:** February 16, 2026
**Owner:** Bluprintx
**Status:** In Development

---

## 1. Product Vision

**One-liner:** Turn a Google Sheet of ad copy and a Drive folder of images into hundreds of live Reddit ads — without touching the Reddit UI.

Ad Creator is a command-line automation tool that eliminates the manual grind of launching Reddit ad campaigns. Marketing teams write copy in Google Sheets, upload images to Google Drive, and the tool generates every permutation, creates Reddit posts, and promotes them as paid ads — all programmatically.

### Why This Exists

Running Reddit ad campaigns at scale is painful. For every campaign, a marketer has to:
1. Write headline/CTA/description variations
2. Upload images one by one
3. Manually create each ad combination in Reddit's UI
4. Set up A/B tests for landing pages
5. Repeat across campaigns and clients

A single campaign with 3 images, 4 headlines, 3 CTAs, and 2 landing page variants = **72 manual ad setups**. That's a full day of clicking. Ad Creator does it in seconds.

---

## 2. Target Users

| User | Need |
|------|------|
| **Bluprintx marketing team** | Launch Reddit campaigns for Salesforce/AI content at scale |
| **Campaign managers** | A/B test creative variations without manual setup |
| **Future: Agency clients** | Self-serve ad generation via shared Drive/Sheets |

---

## 3. What's Built Today

### Working

| Capability | How It Works |
|------------|-------------|
| **Ad combination engine** | Generates all permutations of images × headlines × CTAs × descriptions × LP variants |
| **Google Drive integration** | Fetches images from organized folder structure (OAuth) |
| **Google Sheets integration** | Reads ad copy from spreadsheet tabs: Headlines, CTAs, Themes |
| **Landing page A/B testing** | Auto-generates Full LP and Mini LP (`-min` suffix) variants |
| **Output generation** | Creates manifest.json, summary.txt, and individual ad JSON files |
| **Reddit Ads API** | OAuth, token management, list/create ads, account management |
| **Reddit Native API OAuth** | Token flow ready for post creation |
| **Post creation functions** | Link posts and text posts via Native API |
| **Multi-client support** | Credential isolation per client (bluprintx, etc.) |
| **Interactive CLI** | Guided prompts for ad group, URL, sub-theme, folder, sheet ID |
| **Security hardening** | Input validation, keychain token storage, path safety, UUID IDs |

### Not Working / Blocked

| Capability | Blocker |
|------------|---------|
| **Create posts with custom copy** | Requires Reddit Native API commercial approval |
| **End-to-end automation** (Sheet → Post → Ad) | Blocked by above |
| **Image upload to Reddit** | Needs `form-data` library integration |
| **Duplicate detection** | Not implemented |
| **Preview before publish** | Not implemented |

### Key Technical Discovery

Reddit's Ads API **cannot create ads with custom copy**. It can only promote existing posts. This means the pipeline must be:

```
Google Sheets/Drive → Generate Combinations → Create Reddit Post (Native API) → Promote as Ad (Ads API)
```

Not:

```
Google Sheets/Drive → Generate Combinations → Create Ad directly (Ads API)
```

This is documented in detail in CHALLENGE_SUMMARY.md.

---

## 4. Architecture

```
┌──────────────┐     ┌──────────────┐
│ Google Sheets │     │ Google Drive  │
│  (ad copy)   │     │  (images)    │
└──────┬───────┘     └──────┬───────┘
       │                    │
       └────────┬───────────┘
                │
                ▼
     ┌─────────────────────┐
     │   Ad Combination    │
     │      Engine         │
     │                     │
     │  headlines × CTAs   │
     │  × images × LPs    │
     │  = N variations     │
     └─────────┬───────────┘
               │
               ▼
     ┌─────────────────────┐
     │  Reddit Native API  │  ← BLOCKED (needs commercial approval)
     │  (create posts)     │
     └─────────┬───────────┘
               │
               ▼
     ┌─────────────────────┐
     │   Reddit Ads API    │  ← WORKING
     │  (promote as ads)   │
     └─────────┬───────────┘
               │
               ▼
     ┌─────────────────────┐
     │   Live Reddit Ads   │
     │  with A/B variants  │
     └─────────────────────┘
```

### File Structure

```
ad-creator/
├── ad-creator.js              # Main engine (interactive CLI)
├── create-post-and-ad.js      # Post + ad creation CLI
├── ad-creator-scale.js        # Multi-platform scaffold (incomplete)
├── example.js                 # Demo with hardcoded data
├── lib/
│   ├── reddit-api.js          # Ads API (14 functions, tested)
│   ├── reddit-native-oauth.js # Native API OAuth (ready)
│   ├── reddit-native-posts.js # Post creation (ready)
│   └── platform-manager.js    # Multi-platform credential mgmt (framework)
├── src/
│   ├── setup-google-drive.js  # Google Drive OAuth wizard
│   ├── setup-reddit.js        # Reddit Ads API setup wizard
│   └── utils/google-drive.js  # Drive/Sheets utility library
├── config/                    # Client credentials
├── test/                      # Unit tests
└── output/                    # Generated ad files
```

---

## 5. Roadmap

### Phase 1: Unblock the Pipeline (Priority: Critical)

The entire product hinges on being able to create Reddit posts programmatically.

| # | Task | Why | Effort |
|---|------|-----|--------|
| 1.1 | **Submit Reddit Commercial API approval request** | Can't create posts without it. Template is ready in REDDIT_COMMERCIAL_API_REQUEST.md | 30 min |
| 1.2 | **Create separate Reddit Native API app** | Ads API app ≠ Native API app. Need a "script" type app at reddit.com/prefs/apps with `identity`, `submit`, `mysubreddits` scopes | 15 min |
| 1.3 | **Test Native API post creation** | Once approved, verify `createLinkPost()` and `createTextPost()` work end-to-end | 1-2 hrs |
| 1.4 | **Wire up the full pipeline** | Sheet → combinations → create post → promote as ad. This is the core product loop | 3-4 hrs |

**Exit criteria:** Run one command, get a live Reddit ad with copy from your Google Sheet.

---

### Phase 2: Make It Reliable (Priority: High)

Before running real campaigns, the tool needs guard rails.

| # | Task | Why | Effort |
|---|------|-----|--------|
| 2.1 | **Duplicate detection** | Prevent creating the same ad twice. Check if a post_id already has an active ad before creating another | 2 hrs |
| 2.2 | **Preview before publish** | Show what will be created (post title, body, URL, ad config) and require confirmation. Nobody wants 72 accidental ads | 2 hrs |
| 2.3 | **Dry run mode** | `--dry-run` flag that generates output files but doesn't hit Reddit's API. Essential for testing | 1 hr |
| 2.4 | **Rate limiting & retry** | Reddit's API has rate limits. Add exponential backoff and respect `X-Ratelimit-*` headers | 2 hrs |
| 2.5 | **Image upload support** | Add `form-data` library to enable uploading images to Reddit (currently stubbed) | 2-3 hrs |
| 2.6 | **Error recovery** | If ad #37 of 72 fails, resume from #37 instead of starting over. Track progress in a state file | 3 hrs |

**Exit criteria:** Confidently run a 50+ ad campaign without surprises.

---

### Phase 3: Make It Useful (Priority: Medium)

Features that make this a real product vs. a script.

| # | Task | Why | Effort |
|---|------|-----|--------|
| 3.1 | **Performance dashboard** | Pull Reddit ad metrics (impressions, clicks, CTR, CPC, conversions) and generate reports. `test-performance.js` exists but has hardcoded dates — make it dynamic with date range args | 3 hrs |
| 3.2 | **Campaign management** | Pause, resume, and stop ads by campaign/ad-group. Right now you'd have to use the Reddit UI | 3 hrs |
| 3.3 | **Dynamic landing page variants** | Make LP variant generation configurable instead of hardcoded `-min` suffix. Support arbitrary A/B URL patterns | 1 hr |
| 3.4 | **Configurable combination limits** | Allow filtering: "only first 20 combinations" or "only combinations with image V1". The current `SUMMARY_PREVIEW_LIMIT = 20` is hardcoded | 1 hr |
| 3.5 | **Google Sheets write-back** | After creating ads, write the ad IDs and URLs back to the source Sheet for tracking | 3 hrs |
| 3.6 | **Subreddit targeting config** | Specify target subreddits per campaign in the Sheet or a config file, not just CLI args | 1 hr |

**Exit criteria:** Run campaigns, track results, iterate — all from the CLI.

---

### Phase 4: Scale It (Priority: Low — Future)

Multi-client, multi-platform, team-ready.

| # | Task | Why | Effort |
|---|------|-----|--------|
| 4.1 | **Multi-platform support** | `platform-manager.js` already has scaffolding for LinkedIn and Meta. Wire up LinkedIn Ads API and Meta Marketing API | 2-3 weeks |
| 4.2 | **Service account mode** | Replace personal OAuth with Google Service Account for team/automated use | 1 day |
| 4.3 | **Web UI** | Simple web interface instead of CLI. Upload sheets, preview combinations, launch campaigns | 1-2 weeks |
| 4.4 | **Scheduled campaigns** | Cron-based campaign launching. "Create these ads every Monday at 9am" | 2-3 days |
| 4.5 | **Auto-optimization** | Pull performance data and automatically pause underperforming ads, increase budget on winners | 1 week |
| 4.6 | **Client portal** | Let agency clients log in, connect their own Drive/Reddit, and launch campaigns | 2-3 weeks |

---

## 6. Immediate Next Actions

These are the literal next things to do, in order:

1. **Submit the commercial approval form** — The template is written ([REDDIT_COMMERCIAL_API_REQUEST.md](ad-creator/REDDIT_COMMERCIAL_API_REQUEST.md)). Go to [Reddit's form](https://support.reddithelp.com/hc/en-us/requests/new?ticket_form_id=14868593862164), fill it in, submit. This is the #1 blocker.

2. **Create a Reddit Native API app** — Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps), create a "script" type app. Add the client ID and secret to `.env` as `REDDIT_NATIVE_CLIENT_ID` and `REDDIT_NATIVE_CLIENT_SECRET`.

3. **Fix credentials in repo** — The `.env` file and `config/reddit-bluprintx.json` contain real API credentials that are checked into git. These need to be rotated and moved to `.gitignore` properly. The `.env` is gitignored but `config/reddit-bluprintx.json` is not.

4. **Install missing dependency** — `npm install form-data` to unblock Reddit image uploads.

5. **Test the full loop manually** — Once Native API is approved: create one post, promote it as an ad, verify it looks right. Then automate.

---

## 7. Technical Debt

| Issue | Severity | Location |
|-------|----------|----------|
| **Credentials in git** | Critical | `config/reddit-bluprintx.json` contains client_id and secret |
| **Hardcoded date range** in performance report | Medium | `test-performance.js` lines with `2026-01-20` |
| **Hardcoded currency (£)** in performance report | Low | `test-performance.js` |
| **Hardcoded base Drive folder** | Medium | `ad-creator.js` defaults to "Bluprintx/Ads/Images" |
| **No test infrastructure** | Medium | No test runner, no CI. `test/run.js` exists but isn't wired to npm test properly |
| **`ad-creator-scale.js` is a dead scaffold** | Low | Framework only, no functionality. Delete or finish |
| **Token storage paths inconsistent** | Low | Uses `~/.ad-creator/`, `~/.ad-intel/`, `~/.clawdbot/` depending on the file |
| **No `.env` validation** | Medium | App doesn't check for required env vars at startup |

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| **Time to launch a campaign** | Under 5 minutes (from Sheet-ready to live ads) |
| **Ad variations per campaign** | 50-200 per run |
| **Manual steps required** | Zero (after initial setup) |
| **API error rate** | Under 2% of ad creation attempts |
| **Campaigns per month** | 5-10 (scaling to 20+ with multiple clients) |

---

## 9. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Reddit denies commercial API approval | **Blocks the entire product** | Have approval request ready, follow up proactively. Fallback: manual post creation with automated ad promotion |
| Reddit API changes or rate limits tighten | Campaigns slow down or break | Abstract API calls, implement retry/backoff, monitor API changelog |
| Google Drive/Sheets OAuth token expires during large campaign | Partial campaign creation | Implement token refresh mid-run, add resume capability |
| Accidental mass-posting | Reputation damage, account ban | Preview mode, dry-run flag, confirmation prompts, duplicate detection |

---

## 10. Glossary

| Term | Meaning |
|------|---------|
| **Ad Group** | A named collection of ad variations for a single campaign theme (e.g., "Agentforce-7-Lessons") |
| **Sub-theme** | A variant within an ad group (e.g., "Salesforce-Communities", "Boss-Wants-AI") |
| **Full LP** | The original landing page URL |
| **Mini LP** | A shortened/simplified landing page variant (URL with `-min` suffix) |
| **Combination** | One specific permutation of image + headline + CTA + LP variant |
| **Manifest** | The JSON file containing all generated combinations and metadata |
| **Native API** | Reddit's content API (for creating posts) — separate from the Ads API |
| **Ads API** | Reddit's advertising API (for promoting posts as paid ads) |
