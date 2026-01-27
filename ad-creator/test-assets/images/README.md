# Test Images for Ad Creator

This folder contains sample images for testing the ad creator engine.

## Structure

```
images/
├── kobestarr-digital/
│   └── agentforce-7-lessons/
│       ├── Img-V1.png   # Hero banner
│       ├── Img-V2.png   # Product screenshot
│       └── Img-V3.png   # Team/office photo
│
└── stripped-media/
    └── boss-wants-ai/
        ├── Img-V1.png   # AI/robot illustration
        ├── Img-V2.png   # Graph/chart
        └── Img-V3.png   # Customer testimonial
```

## For Local Testing

Copy your actual images here:
```bash
cp /path/to/your/image.png images/kobestarr-digital/agentforce-7-lessons/Img-V1.png
```

## For GitHub Peer Review

These are placeholder files — the structure shows how images should be organized.

## Image Requirements by Platform

| Platform | Format | Size | Aspect Ratio |
|----------|--------|------|--------------|
| LinkedIn | PNG, JPG | 1200×627 px | 1.91:1 |
| Reddit   | PNG, JPG | 1200×1200 px | 1:1 (recommended) |
| Meta     | PNG, JPG | 1200×628 px | 1.91:1 |

## Notes

- Images are NOT pushed to GitHub (see .gitignore)
- Use actual files for testing
- The engine will fetch from Google Drive in production
