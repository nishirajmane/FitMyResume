# FitMyResume - AI Resume Tailor

An AI-powered resume tailoring application that uses Google's Gemini API to customize resumes for specific job descriptions.

## Features

- Upload resume files (PDF, DOCX)
- Paste job descriptions
- AI-powered resume tailoring using Gemini API
- Cover letter generation
- Copy functionality for easy sharing
- Responsive design

## Setup

### Development

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start a local server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to `http://localhost:3000`

### API Key Configuration

#### Option 1: Manual Input (Default)
- Users can manually enter their Gemini API key in the application interface
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Option 2: Environment Variable (For Deployment)
For production deployment, you can set the API key as an environment variable:

1. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Add your actual API key:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. During deployment, inject the environment variable into the HTML:
   ```javascript
   // Replace this line in index.html during build:
   window.GEMINI_API_KEY = window.GEMINI_API_KEY || '';
   // With:
   window.GEMINI_API_KEY = 'your_actual_api_key';
   ```

### Deployment Options

#### Static Hosting (Netlify, Vercel, GitHub Pages)

1. **Netlify:**
   - Add environment variable `GEMINI_API_KEY` in Netlify dashboard
   - Use build command to inject the variable:
     ```bash
     sed -i "s/window.GEMINI_API_KEY || ''/process.env.GEMINI_API_KEY || ''/g" index.html
     ```

2. **Vercel:**
   - Add environment variable in Vercel dashboard
   - Create `vercel.json` for build configuration

3. **GitHub Pages:**
   - Use GitHub Secrets to store the API key
   - Use GitHub Actions to build and deploy with the injected key

#### Example GitHub Actions Workflow

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Inject API Key
      run: |
        sed -i "s/window.GEMINI_API_KEY || ''/window.GEMINI_API_KEY || '${{ secrets.GEMINI_API_KEY }}'/g" index.html
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## Technology Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **AI Integration:** Google Gemini API
- **File Processing:** PDF.js, Mammoth.js
- **Development Server:** http-server

## Usage

1. Upload your resume (PDF or DOCX format)
2. Paste the job description you want to tailor for
3. Enter your Gemini API key (if not configured via environment)
4. Optionally enable cover letter generation
5. Click "Tailor Resume" to generate customized content
6. Copy the results or download as needed

## Security Notes

- Never commit API keys to version control
- Use environment variables for production deployments
- Keep your API keys secure and never share them publicly
- Consider implementing rate limiting for production use

## License

This project is open source and available under the MIT License.