#!/bin/bash

# Build script for Netlify deployment
# This script injects the environment variable into the HTML file

echo "Starting build process..."

# Check if GEMINI_API_KEY environment variable is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Warning: GEMINI_API_KEY environment variable is not set"
    exit 1
fi

echo "Environment variable found, injecting into HTML..."

# Replace the placeholder with the actual API key
sed -i "s/window\.GEMINI_API_KEY = window\.GEMINI_API_KEY || '';/window.GEMINI_API_KEY = '$GEMINI_API_KEY';/g" index.html

echo "✅ API key injected successfully"
echo "Build complete!"