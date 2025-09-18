#!/bin/bash

# Build script for Netlify deployment
# This script injects the environment variables into the HTML file

echo "Starting build process..."

# Check if GEMINI_API_KEY environment variable is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Warning: GEMINI_API_KEY environment variable is not set"
else
    echo "Gemini API key found, injecting into HTML..."
    sed -i "s/window\.GEMINI_API_KEY = window\.GEMINI_API_KEY || '';/window.GEMINI_API_KEY = '$GEMINI_API_KEY';/g" index.html
    echo "✅ Gemini API key injected successfully"
fi

# Check if GROQ_API_KEY environment variable is set
if [ -z "$GROQ_API_KEY" ]; then
    echo "Warning: GROQ_API_KEY environment variable is not set"
else
    echo "Groq API key found, injecting into HTML..."
    sed -i "s/window\.GROQ_API_KEY = window\.GROQ_API_KEY || '';/window.GROQ_API_KEY = '$GROQ_API_KEY';/g" index.html
    echo "✅ Groq API key injected successfully"
fi

# Check if at least one API key is configured
if [ -z "$GEMINI_API_KEY" ] && [ -z "$GROQ_API_KEY" ]; then
    echo "❌ Error: No API keys configured. Please set either GEMINI_API_KEY or GROQ_API_KEY environment variable."
    exit 1
fi

echo "Build complete!"