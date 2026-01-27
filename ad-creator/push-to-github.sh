#!/usr/bin/env bash
# Create GitHub repo and push ad-creator

set -e

echo "🔐 Creating GitHub repository for ad-creator..."
echo ""
echo "Step 1: Generate a GitHub Personal Access Token"
echo "   Go to: https://github.com/settings/tokens"
echo "   Select: 'repo' scope"
echo "   Copy the token"
echo ""
echo "Step 2: Run these commands:"
echo ""
echo "   # Set your token"
echo "   export GITHUB_TOKEN=your_token_here"
echo ""
echo "   # Create repo and push"
echo "   cd /root/clawd"
echo "   curl -s -X POST \"https://api.github.com/user/repos\" \\"
echo "     -H \"Authorization: token \$GITHUB_TOKEN\" \\"
echo "     -d '{\"name\":\"ad-creator\",\"description\":\"Ad Creative Generation Engine - Generates ad variations from Drive images + Sheets text\",\"private\":false}'"
echo ""
echo "   # Add remote and push"
echo "   git remote add origin https://github.com/kobestarr/ad-creator.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "Done! Your repo will be at: https://github.com/kobestarr/ad-creator"
