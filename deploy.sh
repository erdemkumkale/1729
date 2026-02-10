#!/bin/bash

# 1729 Teaming Ecosystem - Quick Deploy Script
# This script deploys your app to Netlify using CLI

echo "🚀 Starting deployment to Netlify..."
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null
then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if build folder exists
if [ ! -d "build" ]; then
    echo "❌ Build folder not found. Running build..."
    npm run build
fi

echo ""
echo "📦 Build folder ready!"
echo ""
echo "🔐 Logging in to Netlify..."
netlify login

echo ""
echo "🚀 Deploying to production..."
netlify deploy --prod --dir=build

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your site: https://bucolic-daifuku-fdd7db.netlify.app"
echo ""
