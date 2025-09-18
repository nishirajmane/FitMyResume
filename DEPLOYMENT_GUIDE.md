# Netlify Deployment Fix for Gemini API Key

## The Problem
Client-side JavaScript applications cannot directly access server-side environment variables in static hosting platforms like Netlify. The environment variable `GEMINI_API_KEY` needs to be injected into the HTML during the build process.

## The Solution
We've created a build process that injects the environment variable into your HTML file during deployment.

## Files Added/Modified:

### 1. `netlify.toml` - Netlify Configuration
```toml
[build]
  command = "npm run build"
  publish = "."

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. `build.sh` - Build Script
This script injects the environment variable into the HTML file.

### 3. `package.json` - Updated Scripts
Added build command that runs the injection script.

## Deployment Steps:

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Add Netlify deployment configuration"
git push origin main
```

### Step 2: Verify Environment Variable in Netlify
1. Go to your Netlify project dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Ensure `GEMINI_API_KEY` is set with your actual API key

### Step 3: Trigger New Deploy
1. Go to "Deploys" tab in Netlify
2. Click "Trigger deploy" → "Deploy site"
3. Or push a new commit to trigger automatic deployment

### Step 4: Verify Deployment
1. Check the deploy logs to ensure the build script runs successfully
2. Look for the message "✅ API key injected successfully"
3. Test your deployed site

## Troubleshooting:

### If you still see "API key not found" error:
1. **Check Environment Variable**: Ensure `GEMINI_API_KEY` is properly set in Netlify dashboard
2. **Check Build Logs**: Look for any errors in the deployment logs
3. **Verify Build Command**: Ensure `netlify.toml` is in your repository root
4. **Clear Cache**: Try clearing Netlify's build cache and redeploy

### Common Issues:
- **Permission Error**: The build script might need executable permissions (handled by `chmod +x`)
- **Environment Variable Not Set**: Ensure the variable name matches exactly: `GEMINI_API_KEY`
- **Escaping Issues**: Special characters in the API key might cause issues

### Alternative Method (Manual):
If the build script doesn't work, you can manually replace the placeholder:

1. In your `index.html`, find this line:
```javascript
window.GEMINI_API_KEY = window.GEMINI_API_KEY || '';
```

2. Replace it with:
```javascript
window.GEMINI_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

**⚠️ Warning**: Never commit your actual API key to version control!

## Verification
After successful deployment, your app should:
1. Load without showing "API key not found" error
2. Successfully process resume tailoring requests
3. Generate and download PDFs properly

## Support
If you continue to experience issues, check:
1. Netlify deploy logs for detailed error messages
2. Browser console for JavaScript errors
3. Network tab to see if API calls are being made with the correct key