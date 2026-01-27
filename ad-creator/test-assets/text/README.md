# Test Text Variations for Ad Creator

Sample text variations for testing and peer review.

## Files

| File | Description |
|------|-------------|
| `headlines.csv` | Headline variations (one per line) |
| `ctas.csv` | Call-to-action variations |
| `themes.csv` | Theme/angle variations |
| `sample-manifest.json` | Expected output format |

## Usage

```javascript
const headlines = fs.readFileSync(__dirname + '/headlines.csv', 'utf8')
  .split('\n')
  .filter(line => line.trim());

const combinations = generate(headlines, ctas, themes);
```

## Sample Data

### headlines.csv
```
7 Lessons from Agentforce Pioneers
Why Your Boss Wants AI Agents
Enterprise AI That Actually Works
Drive ROI with Agentforce
Transform Your Sales Process
Stop Hiring, Start Automating
The Future of Sales is Here
```

### ctas.csv
```
Download Guide
Learn More
Get Started
Book a Demo
Try Free
```

### themes.csv
```
Salesforce-Communities
Boss-Wants-AI
Enterprise-Ready
ROI-Driven
```

## Expected Output

See `sample-manifest.json` for the expected output format when combining these with images.
