# Test Assets for Ad Creator

Sample data and files for testing and peer review.

## Why This Exists

- **Peer Review:** Reviewers can see the data structure without real credentials
- **CI/CD Testing:** Automated tests can run without API credentials
- **Documentation:** Examples show how the system works

## What's Inside

```
test-assets/
├── images/           # Folder structure (no real images)
│   ├── kobestarr-digital/
│   └── stripped-media/
├── text/             # Sample CSV files
│   ├── headlines.csv
│   ├── ctas.csv
│   └── themes.csv
├── sample-output/    # Example output format
│   └── sample-manifest.json
└── run.js            # Test runner
```

## Running Tests

```bash
cd ad-creator
node test/run.js
```

## Peer Review Checklist

When reviewing this project:

1. ✅ Check `sample-manifest.json` for output format
2. ✅ Review `text/*.csv` for data structure
3. ✅ Run `node test/run.js` to verify code works
4. ✅ Verify no secrets in git history

## Real vs Test Data

| Type | Location | GitHub |
|------|----------|--------|
| **Test data** | `test-assets/` | ✅ Yes |
| **Real credentials** | `~/.clawdbot/platforms/` | ❌ No |
| **Real images** | Google Drive | ❌ No |

## Adding Real Test Data

For local testing, copy real files:

```bash
# Images
cp /path/to/real-image.png test-assets/images/kobestarr-digital/agentforce-7-lessons/Img-V1.png

# Text (optional - create your own CSV)
# Edit test-assets/text/headlines.csv
```
