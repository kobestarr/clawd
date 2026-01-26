# Ad Creative Generation Engine

Generates all combinations of ad creatives from Google Drive images and Google Sheets text.

## Overview

```
Input                          Processing              Output
┌─────────────────┐           ┌─────────────────┐     ┌─────────────────┐
│  Google Drive   │ ───────►  │  Combination    │ ──► │  Ad Variations  │
│  Images Folder  │           │  Engine         │     │  Ready for Upload│
└─────────────────┘           └─────────────────┘     └─────────────────┘
        ▲                            │
        │                            ▼
        │                    ┌─────────────────┐
        │                    │  Google Sheets  │
        │                    │  Text Variants  │
        │                    └─────────────────┘
```

## Setup

### 1. Google Drive Setup

Create a folder for your ad images:
```
Bluprintx/
└── Ads/
    └── Images/
        ├── hero-1.png
        ├── hero-2.png
        ├── product-1.jpg
        └── ...
```

### 2. Google Sheets Setup

Create a spreadsheet with tabs for each text type:

**Sheet: "Headlines"**
| A |
|---|
| Boost your sales with AI |
| Automate your workflow |
| Scale faster with Bluprintx |

**Sheet: "CTAs"**
| A |
|---|
| Learn More |
| Book a Demo |
| Get Started |

**Sheet: "Descriptions"**
| A |
|---|
| AI agents that actually work for enterprise teams |
| Transform your sales process in 30 days |
| Built on Salesforce, trusted by Fortune 500 |

## Usage

```bash
npm install

# Run with your folder and sheet
node ad-creator.js \
  --drive-folder "Bluprintx/Ads/Images" \
  --sheet-id "YOUR_SPREADSHEET_ID"
```

## Output

The tool generates:

```
output/
├── manifest.json      # All combinations with metadata
├── summary.txt        # Human-readable summary
└── ads/
    ├── ad_1234567890.json
    ├── ad_1234567891.json
    └── ...
```

### Manifest Format

```json
{
  "total": 45,
  "generated": "2026-01-26T21:00:00.000Z",
  "combinations": [
    {
      "id": "ad_1234567890",
      "image": {
        "name": "hero-1.png",
        "url": "https://drive.google.com/..."
      },
      "headline": "Boost your sales with AI",
      "cta": "Learn More",
      "description": "AI agents that actually work...",
      "platform": "reddit"
    }
  ]
}
```

## Example Combinations

With 3 images × 5 headlines × 3 CTAs × 2 descriptions = **90 variations**

| Image | Headline | CTA | Description |
|-------|----------|-----|-------------|
| hero-1.png | Boost your sales... | Learn More | AI agents that... |
| hero-1.png | Boost your sales... | Book a Demo | AI agents that... |
| hero-1.png | Boost your sales... | Get Started | AI agents that... |
| ... | ... | ... | ... |

## Reddit Ad Format

The generated ads are formatted for Reddit Ads API:

```json
{
  "name": "Ad Name",
  "campaign_id": "CAMPAIGN_ID",
  "ad_group_id": "AD_GROUP_ID",
  "creative": {
    "title": "Boost your sales with AI",
    "image_id": "MEDIA_ID",
    "call_to_action": {
      "id": "CALL_TO_ACTION_ID"
    },
    "body": "AI agents that actually work..."
  }
}
```

## Next Steps

1. ✅ Generate all combinations
2. ⏳ Review and approve variations
3. ⏳ Upload to Reddit Ads API (when ready)
4. ⏳ Set budgets and launch

## Files

- `ad-creator.js` - Main engine
- `package.json` - Dependencies
- `README.md` - This file
