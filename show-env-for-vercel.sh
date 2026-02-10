#!/bin/bash

echo "📋 Environment Variables for Vercel"
echo "===================================="
echo ""
echo "Copy these values from your .env file to Vercel:"
echo ""

if [ -f .env ]; then
    echo "✅ .env file found"
    echo ""
    
    # Check if variables exist
    if grep -q "REACT_APP_SUPABASE_URL" .env; then
        URL=$(grep "REACT_APP_SUPABASE_URL" .env | cut -d '=' -f2)
        echo "1. REACT_APP_SUPABASE_URL"
        echo "   Value: ${URL:0:30}... (found in .env)"
        echo ""
    else
        echo "⚠️  REACT_APP_SUPABASE_URL not found in .env"
        echo ""
    fi
    
    if grep -q "REACT_APP_SUPABASE_ANON_KEY" .env; then
        KEY=$(grep "REACT_APP_SUPABASE_ANON_KEY" .env | cut -d '=' -f2)
        echo "2. REACT_APP_SUPABASE_ANON_KEY"
        echo "   Value: ${KEY:0:30}... (found in .env)"
        echo ""
    else
        echo "⚠️  REACT_APP_SUPABASE_ANON_KEY not found in .env"
        echo ""
    fi
    
    echo "===================================="
    echo ""
    echo "📝 To add these to Vercel:"
    echo "1. Go to your project in Vercel"
    echo "2. Settings → Environment Variables"
    echo "3. Add each variable with its full value"
    echo "4. Make sure to select all environments (Production, Preview, Development)"
    echo ""
    echo "⚠️  Important: Copy the FULL values from .env file!"
    
else
    echo "❌ .env file not found!"
    echo ""
    echo "Please create .env file with:"
    echo "REACT_APP_SUPABASE_URL=your_supabase_url"
    echo "REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key"
fi
