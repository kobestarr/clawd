# MEMORY.md - Durable Knowledge

## About the Human

- Works with a Gary Vee-style founder (energetic, B2B thought leader)
- Company: Bluprintx (Salesforce partner, AI/consultancy)
- Based: NYC area
- Timezone: EST (UTC-5)

## About the Projects

### Ad Intelligence Tool
- GitHub: https://github.com/kobestarr/ad-intel
- Scrapes LinkedIn ads for competitor research
- Stores data in Google Drive: `Ad Intelligence/Projects/Bluprintx/`
- Captures screenshots of ads
- Multi-keyword, date range, company exclusion supported

### Google Drive Skill
- Location: `/usr/lib/node_modules/clawdbot/skills/google-drive/`
- Supports: upload, list, download, delete, switch accounts
- OAuth 2.0 with 11 Google APIs enabled

## Technical Notes

### LinkedIn Ad Library
- URL: https://www.linkedin.com/ad-library/search
- Only shows company logos, not full ad creatives
- Screenshot capture implemented for visual content
- Date filtering works with `&date=YYYY-MM-DD,YYYY-MM-DD`

### Reddit Ads API
- Docs: https://ads-api.reddit.com/docs/v3/
- Credentials portal: https://business.reddithelp.com/s/article/authenticate-your-developer-application
- Still needs credential testing

## Preferences

- Prefers testing credentials before building features
- Uses WhatsApp for communication
- Values systematic, step-by-step approach
- Likes organized folder structures with clear naming

## Key Files

- `/root/clawd/memory/YYYY-MM-DD.md` - Daily logs
- `/root/clawd/IDENTITY.md` - My identity (Robyn 🦊)
- `/root/clawd/SOUL.md` - My personality
- `/root/clawd/USER.md` - User preferences

## Commands

```bash
# Run ad intelligence scraper
cd /root/clawd/ad-intel
docker compose run --rm linkedin-search sh -c "node src/cli/index.js search 'keyword' -c US --limit 10"

# Google Drive skill
cd /usr/lib/node_modules/clawdbot/skills/google-drive
node src/index.js upload <file> --folder "Bluprintx"
```
