#!/bin/bash

echo "🚀 Preparing to push to GitHub..."
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    echo "✅ Git remote 'origin' already exists"
    git remote -v
else
    echo "⚠️  No git remote found."
    echo ""
    echo "Please add your GitHub repository URL:"
    echo "Example: https://github.com/YOUR_USERNAME/1729-teaming-ecosystem.git"
    echo ""
    read -p "Enter GitHub repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ No URL provided. Exiting."
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo "✅ Remote added: $REPO_URL"
fi

echo ""
echo "📦 Adding files to git..."
git add .

echo ""
echo "💾 Creating commit..."
git commit -m "Deploy to Vercel - 1729 Teaming Ecosystem

- Complete onboarding flow with 4 questions
- Automatic gift card creation from Q4
- Dashboard with 5 main pages
- Trust team management
- Promo code system
- Payment integration
- Supabase backend
"

echo ""
echo "🌿 Renaming branch to main..."
git branch -M main

echo ""
echo "⬆️  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to https://vercel.com/new"
    echo "2. Import your GitHub repository"
    echo "3. Add environment variables from .env file"
    echo "4. Click Deploy!"
    echo ""
    echo "📖 Full guide: See VERCEL_DEPLOYMENT.md"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "- GitHub repository exists"
    echo "- You have push access"
    echo "- Repository URL is correct"
    echo ""
    echo "Run: git remote -v"
    echo "To verify your remote URL"
fi
