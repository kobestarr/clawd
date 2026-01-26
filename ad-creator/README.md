# Ad Creative Generation Engine v2.0

Generates all combinations of ad creatives from Google Drive images and Google Sheets text — siloed by ad group with A/B testing for landing pages.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Drive Folder Structure                   │
└─────────────────────────────────────────────────────────────┘

Bluprintx/
└── Ads/
    └── Images/
        ├── Agentforce-7-Lessons/
        │   ├── Salesforce-Communities/
        │   │   ├── Img-V1.png
        │   │   ├── Img-V2.png
        │   │   └── Img-V3.png
        │   └── Boss-Wants-AI/
        │       ├── Img-V1.png
        │       └── Img-V2.png
        └── Another-Campaign/
            └── Img-V1.png
```

## Quick Start

```bash
cd /root/clawd/ad-creator
npm install

# Run interactively
node ad-creator.js

# Or with arguments
node ad-creator.js --ad-group "Agentforce-7-Lessons" --url "https://bluprintx.com/agentforce-360/?utm_source=Reddit..."
```

## Interactive Prompts

```
Ad Group Name (e.g., Agentforce-7-Lessons): Agentforce-7-Lessons
Full Landing Page URL: https://bluprintx.com/agentforce-360/?utm_source=Reddit...
Sub-theme (optional): Salesforce-Communities
Drive Folder: Bluprintx/Ads/Images
Google Sheet ID: YOUR_SHEET_ID
```

## Ad Title Format

```
{AdGroup} | {SubTheme} | {Img-Variant}_{LP-Type}
```

**Example:**
```
Agentforce-7-Lessons | Salesforce-Communities | Img-V1_FULL_LP
Agentforce-7-Lessons | Salesforce-Communities | Img-V1_Mini_LP
Agentforce-7-Lessons | Boss-Wants-AI | Img-V1_FULL_LP
```

## Landing Page A/B Testing

The engine automatically creates two URL variants:

| Variant | URL Pattern | Example |
|---------|-------------|---------|
| **FULL_LP** | Original URL | `.../agentforce-360/?utm_source=Reddit...` |
| **Mini_LP** | `-min` suffix | `.../agentforce-360-min/?utm_source=Reddit...` |

## Google Sheets Format

Create a spreadsheet with these tabs:

### Tab: "Headlines"
| A |
|---|
| 7 Lessons from Agentforce Pioneers |
| Why Your Boss Wants AI Agents |
| Enterprise AI That Actually Works |

### Tab: "CTAs"
| A |
|---|
| Download Guide |
| Learn More |
| Get Started |

### Tab: "Themes" (Optional)
| A |
|---|
| Salesforce-Communities |
| Boss-Wants-AI |
| Enterprise-Ready |

## Output Structure

```
output/
└── {AdGroup}/
    ├── manifest.json      # All combinations + metadata
    ├── summary.txt        # Human-readable summary
    └── ads/
        ├── ad_123.json    # Individual ad
        └── ad_124.json
```

### Manifest Format

```json
{
  "config": {
    "ad_group": "Agentforce-7-Lessons",
    "sub_theme": "Salesforce-Communities",
    "landing_pages": {
      "full": "https://bluprintx.com/agentforce-360/?utm_source=Reddit...",
      "mini": "https://bluprintx.com/agentforce-360-min/?utm_source=Reddit..."
    },
    "total_variations": 216
  },
  "combinations": [
    {
      "id": "ad_123",
      "ad_title": "Agentforce-7-Lessons | Salesforce-Communities | Img-V1_FULL_LP",
      "headline": "7 Lessons from Agentforce Pioneers",
      "cta": "Download Guide",
      "lp_variant": "FULL_LP"
    }
  ]
}
```

## Example Combinations

**Input:**
- 3 images (Img-V1, Img-V2, Img-V3)
- 4 headlines
- 3 CTAs
- 2 landing page variants

**Result:** 3 × 4 × 3 × 2 = **72 variations**

## Command Line Options

```bash
node ad-creator.js \
  --ad-group "Campaign-Name" \
  --url "https://..." \
  --drive-folder "Folder/Path" \
  --sheet-id "SPREADSHEET_ID" \
  --output "./output"
```

## Files

- `ad-creator.js` - Main engine (interactive + CLI)
- `package.json` - Dependencies
- `README.md` - This file
- `output/` - Generated ads (gitignored)

## Dependencies

- `googleapis` - For Drive/Sheets integration

## Next Steps

1. ✅ Create Drive folder: `Bluprintx/Ads/Images/{AdGroup}/{SubTheme}`
2. ✅ Upload images with names like `Img-V1.png`
3. ✅ Create Google Sheet with Headlines, CTAs, Themes tabs
4. ✅ Run: `node ad-creator.js`
5. ⏳ Upload generated ads to Reddit Ads API (when approved)
