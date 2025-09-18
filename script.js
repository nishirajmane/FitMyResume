// script.js - Resume Tailor App Logic

// ====== CONFIGURATION ======
// API configuration - will use environment variables for deployment
let GEMINI_API_KEY = '';
let GROQ_API_KEY = '';
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Groq models configuration (current supported models as of 2025)
const GROQ_MODELS = {
    'llama-3.3-70b-versatile': 'Llama 3.3 70B (Versatile)',
    'llama-3.1-8b-instant': 'Llama 3.1 8B (Fast)',
    'qwen/qwen3-32b': 'Qwen 3 32B',
    'meta-llama/llama-guard-4-12b': 'Llama Guard 4 12B'
};

// Default Groq model
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

// ====== DOM ELEMENTS ======
const resumeInput = document.getElementById('resume-upload');
const jdInput = document.getElementById('jd-input');
const tailorBtn = document.getElementById('tailor-btn');
const previewBox = document.getElementById('resume-preview');
const downloadBtn = document.getElementById('download-btn');

// Model Selection DOM Elements
const modelSelect = document.getElementById('model-select');

// Cover Letter DOM Elements
const generateCoverLetterCheckbox = document.getElementById('generate-cover-letter');
const coverLetterOptions = document.getElementById('cover-letter-options');
const hiringManagerInput = document.getElementById('hiring-manager');
const contactInfoInput = document.getElementById('contact-info');
const coverLetterPreviewSection = document.getElementById('cover-letter-preview-section');
const coverLetterPreview = document.getElementById('cover-letter-preview');

// Copy Button DOM Elements
const copyResumeBtn = document.getElementById('copy-resume-btn');
const copyCoverLetterBtn = document.getElementById('copy-cover-letter-btn');

// Download Button DOM Elements
const downloadResumeBtn = document.getElementById('download-resume-btn');
const downloadCoverLetterBtn = document.getElementById('download-cover-letter-btn');



// ====== COVER LETTER TOGGLE LOGIC ======
generateCoverLetterCheckbox.addEventListener('change', () => {
    if (generateCoverLetterCheckbox.checked) {
        coverLetterOptions.style.display = 'block';
        coverLetterPreviewSection.style.display = 'block';
    } else {
        coverLetterOptions.style.display = 'none';
        coverLetterPreviewSection.style.display = 'none';
        coverLetterPreview.innerHTML = '';
    }
});

// ====== COPY FUNCTIONALITY ======
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        // Visual feedback
        const originalText = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            Copied!
        `;

        // Reset after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalText;
        }, 2000);

    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        // Visual feedback for fallback
        const originalText = button.innerHTML;
        button.classList.add('copied');
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalText;
        }, 2000);
    }
}

// Copy Resume Button
copyResumeBtn.addEventListener('click', () => {
    const resumeText = previewBox.textContent || previewBox.innerText;
    if (resumeText && resumeText.trim() && !resumeText.includes('Please upload') && !resumeText.includes('Please paste') && !resumeText.includes('Please enter')) {
        copyToClipboard(resumeText, copyResumeBtn);
    }
});

// Copy Cover Letter Button
copyCoverLetterBtn.addEventListener('click', () => {
    const coverLetterText = coverLetterPreview.textContent || coverLetterPreview.innerText;
    if (coverLetterText && coverLetterText.trim() && !coverLetterText.includes('Cover letter generation failed')) {
        copyToClipboard(coverLetterText, copyCoverLetterBtn);
    }
});

// ====== HELPERS ======
function showMessage(msg, isError = false) {
    previewBox.innerHTML = `<span style="color:${isError ? '#ff6b6b' : '#b3e283'};">${msg}</span>`;
}

function showSpinner() {
    previewBox.innerHTML = '<div class="spinner"></div>';
}

function typewriterEffect(text, element, speed = 18) {
    element.classList.add('typewriter');
    element.innerHTML = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text[i] === '\n' ? '<br>' : text[i];
            i++;
            setTimeout(type, speed);
        } else {
            element.classList.remove('typewriter');
        }
    }
    type();
}

function getApiToken() {
    // Only use environment variable (set during deployment)
    return window.GEMINI_API_KEY || '';
}

function getGroqApiToken() {
    // Only use environment variable (set during deployment)
    return window.GROQ_API_KEY || '';
}

function getSelectedModel() {
    return modelSelect.value;
}

// ====== UNIFIED API CALLING FUNCTIONS ======
async function callSelectedModelChat(resumeText, jdText) {
    const selectedModel = getSelectedModel();
    
    if (selectedModel === 'gemini') {
        const apiKey = getApiToken();
        if (!apiKey) {
            throw new Error('Gemini API key not configured. Please contact support.');
        }
        return await callGeminiChat(resumeText, jdText, apiKey);
    } else {
        const apiKey = getGroqApiToken();
        if (!apiKey) {
            throw new Error('Groq API key not configured. Please contact support.');
        }
        return await callGroqChat(resumeText, jdText, apiKey);
    }
}

async function generateSelectedModelCoverLetter(resumeText, jdText, managerName, contactInfo) {
    const selectedModel = getSelectedModel();
    
    if (selectedModel === 'gemini') {
        const apiKey = getApiToken();
        if (!apiKey) {
            throw new Error('Gemini API key not configured. Please contact support.');
        }
        return await generateCoverLetter(resumeText, jdText, managerName, contactInfo, apiKey);
    } else {
        const apiKey = getGroqApiToken();
        if (!apiKey) {
            throw new Error('Groq API key not configured. Please contact support.');
        }
        return await generateGroqCoverLetter(resumeText, jdText, managerName, contactInfo, apiKey);
    }
}

// ====== RESUME STYLE EXTRACTION FOR PDFKIT ======
let originalResumeStyle = {
    fontSize: 11,
    fontFamily: 'Helvetica', // PDFKit built-in font
    lineHeight: 1.4,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    textColor: '#000000',
    backgroundColor: '#ffffff'
};

// Enhanced font mapping for foliojs-fork PDFKit with additional styling options
const fontMapping = {
    'times': 'Times-Roman',
    'times new roman': 'Times-Roman',
    'arial': 'Helvetica',
    'helvetica': 'Helvetica',
    'courier': 'Courier',
    'georgia': 'Times-Roman',
    'calibri': 'Helvetica',
    'default': 'Helvetica'
};

// Enhanced styling options for foliojs-fork
const enhancedStyles = {
    header: {
        fontSize: 16,
        font: 'Helvetica-Bold',
        color: '#2c3e50',
        lineSpacing: 1.2
    },
    subheader: {
        fontSize: 13,
        font: 'Helvetica-Bold',
        color: '#34495e',
        lineSpacing: 1.1
    },
    body: {
        fontSize: 11,
        font: 'Helvetica',
        color: '#2c3e50',
        lineSpacing: 1.4
    },
    bullet: {
        fontSize: 10,
        font: 'Helvetica',
        color: '#555',
        lineSpacing: 1.3
    }
};

function mapFontToPDFKit(fontFamily) {
    if (!fontFamily) return 'Helvetica';
    
    const normalizedFont = fontFamily.toLowerCase().replace(/["']/g, '').trim();
    
    for (const [key, value] of Object.entries(fontMapping)) {
        if (normalizedFont.includes(key)) {
            return value;
        }
    }
    
    return 'Helvetica'; // Default fallback
}

async function extractResumeStyle(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (ext === 'pdf') {
        try {
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = async function () {
                    try {
                        const typedarray = new Uint8Array(reader.result);
                        const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
                        const page = await pdf.getPage(1);
                        const viewport = page.getViewport({ scale: 1.0 });
                        
                        // Extract basic style information
                        const style = {
                            fontSize: 11, // Default for PDF extraction
                            fontFamily: mapFontToPDFKit('Times'),
                            lineHeight: 1.4,
                            margins: { 
                                top: Math.max(40, viewport.height * 0.08), 
                                bottom: Math.max(40, viewport.height * 0.08), 
                                left: Math.max(40, viewport.width * 0.08), 
                                right: Math.max(40, viewport.width * 0.08) 
                            },
                            textColor: '#000000',
                            backgroundColor: '#ffffff',
                            pageWidth: viewport.width,
                            pageHeight: viewport.height
                        };
                        
                        originalResumeStyle = style;
                        resolve(style);
                    } catch (err) {
                        resolve(originalResumeStyle); // Fallback to default
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        } catch (err) {
            return originalResumeStyle;
        }
    } else if (ext === 'docx') {
        try {
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = async function (event) {
                    try {
                        const result = await window.mammoth.convertToHtml({ arrayBuffer: event.target.result });
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = result.value;
                        
                        // Try to extract basic styling from DOCX HTML
                        const firstParagraph = tempDiv.querySelector('p');
                        const style = {
                            fontSize: 11,
                            fontFamily: 'Times',
                            lineHeight: 1.4,
                            margins: { top: 40, bottom: 40, left: 40, right: 40 },
                            textColor: '#000000',
                            backgroundColor: '#ffffff'
                        };
                        
                        if (firstParagraph) {
                            const computedStyle = window.getComputedStyle(firstParagraph);
                            if (computedStyle.fontSize) {
                                style.fontSize = parseInt(computedStyle.fontSize) || 11;
                            }
                            if (computedStyle.fontFamily) {
                                style.fontFamily = mapFontToPDFKit(computedStyle.fontFamily) || 'Helvetica';
                            }
                        }
                        
                        originalResumeStyle = style;
                        resolve(style);
                    } catch (err) {
                        resolve(originalResumeStyle);
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        } catch (err) {
            return originalResumeStyle;
        }
    }
    
    return originalResumeStyle;
}
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const typedarray = new Uint8Array(reader.result);
                const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ') + '\n';
                }
                resolve(text.trim());
            } catch (err) {
                reject('Failed to parse PDF.');
            }
        };
        reader.onerror = () => reject('Could not read PDF file.');
        reader.readAsArrayBuffer(file);
    });
}

async function extractTextFromDOCX(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function (event) {
            try {
                window.mammoth.convertToHtml({ arrayBuffer: event.target.result })
                    .then(result => {
                        // Strip HTML tags, keep line breaks
                        const html = result.value;
                        const text = html.replace(/<[^>]+>/g, '').replace(/\n{2,}/g, '\n').trim();
                        resolve(text);
                    })
                    .catch(() => reject('Failed to parse DOCX.'));
            } catch (err) {
                reject('Failed to parse DOCX.');
            }
        };
        reader.onerror = () => reject('Could not read DOCX file.');
        reader.readAsArrayBuffer(file);
    });
}

// ====== GROQ API INTEGRATION ======
async function callGroqChat(resumeText, jdText, apiKey) {
    const prompt = `Tailor this resume for the job.

RESUME: ${resumeText}
JOB: ${jdText}

OUTPUT RESUME ONLY. NO THINKING.`;

    const requestBody = {
        model: DEFAULT_GROQ_MODEL,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.7,
        stream: false
    };

    const response = await fetch(GROQ_API_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errorMsg = "Groq API error: " + response.status;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg += " - " + errorData.error.message;
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
    } else {
        throw new Error("Unexpected response format from Groq API.");
    }
}

async function generateGroqCoverLetter(resumeText, jdText, managerName, contactInfo, apiKey) {
    const prompt = `Write a professional cover letter.

FORMAT: Business letter format
ADDRESS TO: ${managerName}
SIGNATURE: ${contactInfo}

RESUME: ${resumeText}
JOB: ${jdText}

OUTPUT THE LETTER ONLY. NO THINKING. NO EXPLANATIONS.`;

    const requestBody = {
        model: DEFAULT_GROQ_MODEL,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.7,
        stream: false
    };

    const response = await fetch(GROQ_API_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errorMsg = "Groq API error: " + response.status;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg += " - " + errorData.error.message;
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
    } else {
        throw new Error("Unexpected response format from Groq API.");
    }
}

// ====== FILE PARSING ======
async function extractResumeText(file) {
    if (!file) throw 'No file selected.';
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
        return await extractTextFromPDF(file);
    } else if (ext === 'docx') {
        return await extractTextFromDOCX(file);
    } else {
        throw 'Unsupported file type. Please upload a PDF or DOCX.';
    }
}

// ====== PDF GENERATION WITH PDFKIT ======
async function generateStyledPDF(content, filename, isResume = true) {
    try {
        // Show downloading state
        const btn = isResume ? downloadResumeBtn : downloadCoverLetterBtn;
        const originalText = btn.innerHTML;
        btn.classList.add('downloading');
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Generating...
        `;
        btn.disabled = true;

        // Create PDF document with PDFKit (compact margins like second image)
        const doc = new window.PDFDocument({
            size: 'LETTER',
            margins: {
                top: 30,
                bottom: 30, 
                left: 30,
                right: 30
            }
        });

        // Collect PDF data
        const chunks = [];
        doc.on('data', function(chunk) {
            chunks.push(chunk);
        });

        doc.on('end', function() {
            try {
                const blob = new Blob(chunks, { type: 'application/pdf' });
                
                // Download using FileSaver.js if available, otherwise fallback
                if (window.saveAs) {
                    window.saveAs(blob, filename);
                } else {
                    // Fallback download method
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                
                // Reset button state
                setTimeout(() => {
                    btn.classList.remove('downloading');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1000);
                
            } catch (error) {
                console.error('Error creating PDF blob:', error);
                throw error;
            }
        });

// Enhanced content parser for better resume formatting based on HTML template
function parseResumeContent(content) {
    // Split content into lines and clean up
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const parsedSections = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1] || '';
        const prevLine = lines[i - 1] || '';
        
        // Enhanced parsing based on HTML resume format
        if (i === 0 && isName(line)) {
            parsedSections.push({ type: 'name', content: line });
        } else if (isJobTitleLine(line)) {
            parsedSections.push({ type: 'job-title-line', content: line });
        } else if (isContactInfo(line)) {
            parsedSections.push({ type: 'contact', content: line });
        } else if (isSectionHeader(line, nextLine)) {
            parsedSections.push({ type: 'header', content: line });
        } else if (isProjectTitle(line)) {
            parsedSections.push({ type: 'project-title', content: line });
        } else if (isJobTitle(line, prevLine)) {
            parsedSections.push({ type: 'job-title', content: line });
        } else if (isCompanyDate(line)) {
            parsedSections.push({ type: 'company-date', content: line });
        } else if (isEducationTitle(line)) {
            parsedSections.push({ type: 'education-title', content: line });
        } else if (isSkillCategory(line)) {
            parsedSections.push({ type: 'skill-category', content: line });
        } else if (isBulletPoint(line)) {
            parsedSections.push({ type: 'bullet', content: line.replace(/^[\u2022\-\*]\s*/, '') });
        } else if (line.length > 10) {
            parsedSections.push({ type: 'text', content: line });
        }
    }
    
    return parsedSections;
}

function isName(line) {
    // Usually the first line, all caps or title case, no special characters
    return line.length < 50 && /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) && !line.includes('@') && !line.includes('|');
}

function isContactInfo(line) {
    return line.includes('@') || 
           line.includes('|') || 
           /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(line) ||
           line.toLowerCase().includes('linkedin') ||
           line.toLowerCase().includes('github') ||
           line.toLowerCase().includes('portfolio');
}

function isSectionHeader(line, nextLine) {
    const commonHeaders = [
        'professional summary', 'summary', 'experience', 'work experience', 
        'education', 'skills', 'projects', 'certifications', 'personal details',
        'languages', 'achievements', 'awards', 'publications', 'gpa', 
        'backend/database', 'frontend', 'testing', 'devops/tools', 'others'
    ];
    
    // Check for exact matches (case insensitive)
    const lowerLine = line.toLowerCase().trim();
    if (commonHeaders.includes(lowerLine)) {
        return true;
    }
    
    // Check for partial matches
    if (commonHeaders.some(header => lowerLine.includes(header))) {
        return true;
    }
    
    return line.length < 60 && 
           (line.toUpperCase() === line && !line.includes('@') && !line.includes('|')) ||
           (line.endsWith(':') && line.length < 40);
}

function isJobTitle(line, prevLine) {
    // Job titles often follow company names or are standalone
    return line.length < 80 && 
           !line.includes('@') && 
           !line.includes('|') &&
           (line.includes(' - ') || 
            line.includes('Engineer') || 
            line.includes('Developer') || 
            line.includes('Manager') || 
            line.includes('Lead') ||
            line.includes('Analyst') ||
            line.includes('Specialist'));
}

function isCompanyDate(line) {
    // Company names with dates
    return line.includes('(') && line.includes(')') && 
           (/\d{4}/.test(line) || line.includes('Current') || line.includes('Present'));
}

function isBulletPoint(line) {
    return line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || 
           line.startsWith('\u2022') || /^[\s]*[\u2022\-\*]/.test(line);
}

function isJobTitleLine(line) {
    // Matches the subtitle line under the name (e.g., "AI Engineer | Full Stack Developer | Automation Tester")
    return line.includes('|') && 
           (line.toLowerCase().includes('engineer') || 
            line.toLowerCase().includes('developer') || 
            line.toLowerCase().includes('analyst') || 
            line.toLowerCase().includes('manager') || 
            line.toLowerCase().includes('tester') ||
            line.toLowerCase().includes('lead'));
}

function isProjectTitle(line) {
    // Project titles often have dashes or specific patterns
    return (line.includes(' – ') || line.includes(' - ')) &&
           !line.includes('(') && !line.includes('@') &&
           line.length < 100;
}

function isEducationTitle(line) {
    // Education institution names
    return (line.toLowerCase().includes('university') ||
            line.toLowerCase().includes('institute') ||
            line.toLowerCase().includes('college') ||
            line.toLowerCase().includes('school')) &&
           !line.includes('(') && !line.includes('@');
}

function isSkillCategory(line) {
    // Skill category headers like "Languages:", "Frontend:", etc.
    return line.endsWith(':') && 
           line.length < 50 &&
           (line.toLowerCase().includes('language') ||
            line.toLowerCase().includes('frontend') ||
            line.toLowerCase().includes('backend') ||
            line.toLowerCase().includes('database') ||
            line.toLowerCase().includes('testing') ||
            line.toLowerCase().includes('devops') ||
            line.toLowerCase().includes('tools') ||
            line.toLowerCase().includes('others') ||
            line.toLowerCase().includes('skills'));
}
        // Enhanced document styling with foliojs-fork capabilities
        const fontSize = originalResumeStyle.fontSize || 11;
        const fontFamily = mapFontToPDFKit(originalResumeStyle.fontFamily) || 'Helvetica';
        const lineHeight = originalResumeStyle.lineHeight || 1.4;
        const textColor = originalResumeStyle.textColor || '#2c3e50';

        // Parse content using enhanced parser
        const parsedContent = parseResumeContent(content);
        let yPosition = doc.page.margins.top;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

        // Set default styling
        doc.font(fontFamily)
           .fontSize(fontSize)
           .fillColor(textColor);

        for (let i = 0; i < parsedContent.length; i++) {
            const section = parsedContent[i];
            const content = section.content;
            
            // Check if we need a new page
            if (yPosition + (fontSize * lineHeight * 2) > pageHeight) {
                doc.addPage();
                yPosition = doc.page.margins.top;
            }

            switch (section.type) {
                case 'name':
                    // Name styling - large, centered, bold
                    yPosition += 10;
                    doc.fontSize(18)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'center'
                    });
                    yPosition += 25;
                    break;

                case 'job-title-line':
                    // Job title line under name (AI Engineer | Full Stack Developer)
                    doc.fontSize(11)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'center'
                    });
                    yPosition += 18;
                    break;

                case 'contact':
                    // Contact info - smaller, centered
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor('#333');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'center'
                    });
                    yPosition += 15;
                    break;

                case 'header':
                    // Section headers - bold, with underline
                    yPosition += 12;
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'left'
                    });
                    
                    // Add underline
                    yPosition += 16;
                    doc.moveTo(doc.page.margins.left, yPosition)
                       .lineTo(doc.page.margins.left + pageWidth, yPosition)
                       .strokeColor('#000000')
                       .lineWidth(0.5)
                       .stroke();
                    
                    yPosition += 8;
                    break;

                case 'project-title':
                    // Project titles - bold, slightly larger
                    yPosition += 6;
                    doc.fontSize(11)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'left'
                    });
                    yPosition += 15;
                    break;

                case 'education-title':
                    // Education institution names - bold
                    yPosition += 5;
                    doc.fontSize(11)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'left'
                    });
                    yPosition += 15;
                    break;

                case 'skill-category':
                    // Skill categories - bold, inline with content
                    yPosition += 4;
                    doc.fontSize(10)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'left'
                    });
                    yPosition += 14;
                    break;

                case 'job-title':
                    // Job titles - bold
                    yPosition += 5;
                    doc.fontSize(11)
                       .font('Helvetica-Bold')
                       .fillColor('#000000');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'left'
                    });
                    yPosition += 15;
                    break;

                case 'company-date':
                    // Company and date info - italic
                    doc.fontSize(10)
                       .font('Helvetica-Oblique')
                       .fillColor('#555');
                    
                    doc.text(content, doc.page.margins.left, yPosition, {
                        width: pageWidth,
                        align: 'left'
                    });
                    yPosition += 14;
                    break;

                case 'bullet':
                    // Bullet points - with proper indentation and spacing
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor('#333');
                    
                    // Add bullet character with better positioning
                    doc.text('•', doc.page.margins.left + 10, yPosition);
                    
                    // Split long content into multiple lines if needed
                    const bulletMaxWidth = pageWidth - 25;
                    const bulletWords = content.split(' ');
                    let bulletCurrentLine = '';
                    let bulletLines = [];
                    
                    for (let word of bulletWords) {
                        const testLine = bulletCurrentLine + (bulletCurrentLine ? ' ' : '') + word;
                        const testWidth = doc.widthOfString(testLine);
                        
                        if (testWidth > bulletMaxWidth && bulletCurrentLine) {
                            bulletLines.push(bulletCurrentLine);
                            bulletCurrentLine = word;
                        } else {
                            bulletCurrentLine = testLine;
                        }
                    }
                    if (bulletCurrentLine) bulletLines.push(bulletCurrentLine);
                    
                    // Render each line with proper spacing
                    let bulletLineY = yPosition;
                    for (let i = 0; i < bulletLines.length; i++) {
                        doc.text(bulletLines[i], doc.page.margins.left + 25, bulletLineY);
                        if (i < bulletLines.length - 1) bulletLineY += 12; // Line spacing within bullet
                    }
                    
                    yPosition = bulletLineY + 18; // Space after bullet point
                    break;

                case 'text':
                default:
                    // Regular text - standard formatting with proper spacing
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor('#333');
                    
                    // Handle long text with proper line wrapping
                    const textMaxWidth = pageWidth;
                    const textWords = content.split(' ');
                    let textCurrentLine = '';
                    let textLines = [];
                    
                    for (let word of textWords) {
                        const testLine = textCurrentLine + (textCurrentLine ? ' ' : '') + word;
                        const testWidth = doc.widthOfString(testLine);
                        
                        if (testWidth > textMaxWidth && textCurrentLine) {
                            textLines.push(textCurrentLine);
                            textCurrentLine = word;
                        } else {
                            textCurrentLine = testLine;
                        }
                    }
                    if (textCurrentLine) textLines.push(textCurrentLine);
                    
                    // Render each line with proper spacing
                    let textLineY = yPosition;
                    for (let i = 0; i < textLines.length; i++) {
                        doc.text(textLines[i], doc.page.margins.left, textLineY);
                        if (i < textLines.length - 1) textLineY += 12; // Line spacing within paragraph
                    }
                    
                    yPosition = textLineY + 15; // Space after paragraph
                    break;
            }
        }

        // Finalize the PDF
        doc.end();
        
    } catch (error) {
        console.error('PDF generation failed:', error);
        
        // Reset button on error
        const btn = isResume ? downloadResumeBtn : downloadCoverLetterBtn;
        btn.classList.remove('downloading');
        btn.innerHTML = btn.dataset.originalText || 'Download PDF';
        btn.disabled = false;
        
        // Show user-friendly error message
        alert('Failed to generate PDF. Please try again or contact support if the issue persists.');
    }
}

// Download button event listeners
downloadResumeBtn.addEventListener('click', async () => {
    const resumeText = previewBox.textContent || previewBox.innerText;
    if (resumeText && resumeText.trim() && !resumeText.includes('Please upload') && !resumeText.includes('Please paste')) {
        await generateStyledPDF(resumeText, 'tailored-resume.pdf', true);
    }
});

downloadCoverLetterBtn.addEventListener('click', async () => {
    const coverLetterText = coverLetterPreview.textContent || coverLetterPreview.innerText;
    if (coverLetterText && coverLetterText.trim() && !coverLetterText.includes('Cover letter generation failed')) {
        await generateStyledPDF(coverLetterText, 'cover-letter.pdf', false);
    }
});

// ====== GEMINI API INTEGRATION ======
async function callGeminiChat(resumeText, jdText, apiKey) {
    const prompt = `Tailor this resume for the job.

RESUME: ${resumeText}
JOB: ${jdText}

OUTPUT RESUME ONLY. NO THINKING.`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.2,
            topP: 0.7,
            maxOutputTokens: 2048
        }
    };

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errorMsg = "Gemini API error: " + response.status;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg += " - " + errorData.error.message;
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Unexpected response format from Gemini API.");
    }
}

async function generateCoverLetter(resumeText, jdText, managerName, contactInfo, apiKey) {
    const prompt = `Write a professional cover letter.

FORMAT: Business letter format
ADDRESS TO: ${managerName}
SIGNATURE: ${contactInfo}

RESUME: ${resumeText}
JOB: ${jdText}

OUTPUT THE LETTER ONLY. NO THINKING. NO EXPLANATIONS.`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.2,
            topP: 0.7,
            maxOutputTokens: 2048
        }
    };

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        let errorMsg = "Gemini API error: " + response.status;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg += " - " + errorData.error.message;
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error("Unexpected response format from Gemini API.");
    }
}

// ====== MAIN LOGIC ======
tailorBtn.addEventListener('click', async () => {
    previewBox.innerHTML = '';
    coverLetterPreview.innerHTML = '';
    // downloadBtn.style.display = 'none'; // Download button removed
    const file = resumeInput.files[0];
    const jdText = jdInput.value.trim();
    const shouldGenerateCoverLetter = generateCoverLetterCheckbox.checked;
    const managerName = hiringManagerInput.value.trim() || 'Hiring Manager';
    const contactInfo = contactInfoInput.value.trim();
    const selectedModel = getSelectedModel();

    if (!file) {
        showMessage('Please upload your resume file.', true);
        return;
    }
    if (!jdText) {
        showMessage('Please paste the job description.', true);
        return;
    }
    
    // Check API key based on selected model
    const apiKey = selectedModel === 'gemini' ? getApiToken() : getGroqApiToken();
    if (!apiKey) {
        const modelName = selectedModel === 'gemini' ? 'Gemini' : 'Groq';
        showMessage(`${modelName} API key not configured. Please contact support.`, true);
        return;
    }
    
    if (shouldGenerateCoverLetter && !contactInfo) {
        showMessage('Please enter your contact information for the cover letter signature.', true);
        return;
    }

    showSpinner();
    let resumeText = '';
    try {
        // Extract resume text and style information
        resumeText = await extractResumeText(file);
        await extractResumeStyle(file); // Extract styling for PDF generation
    } catch (err) {
        showMessage(err.toString(), true);
        return;
    }

    showSpinner();
    try {
        const tailoredResume = await callSelectedModelChat(resumeText, jdText);
        previewBox.innerHTML = '';
        typewriterEffect(tailoredResume, previewBox, 14);

        // Generate cover letter if requested
        if (shouldGenerateCoverLetter) {
            showSpinner();
            try {
                const coverLetter = await generateSelectedModelCoverLetter(resumeText, jdText, managerName, contactInfo);
                coverLetterPreview.innerHTML = '';
                typewriterEffect(coverLetter, coverLetterPreview, 14);
            } catch (err) {
                coverLetterPreview.innerHTML = `<span style="color:#ff6b6b;">Cover letter generation failed: ${err.toString()}</span>`;
            }
        }
        // downloadBtn.style.display = 'inline-block'; // Download button removed
    } catch (err) {
        showMessage(err.toString(), true);
    }
});

// ====== UX: Clear preview on new upload or JD change ======
resumeInput.addEventListener('change', () => {
    previewBox.innerHTML = '';
    coverLetterPreview.innerHTML = '';
    // downloadBtn.style.display = 'none'; // Download button removed
});
jdInput.addEventListener('input', () => {
    previewBox.innerHTML = '';
    coverLetterPreview.innerHTML = '';
    // downloadBtn.style.display = 'none'; // Download button removed
});

// Clear previews when cover letter inputs change
hiringManagerInput.addEventListener('input', () => {
    coverLetterPreview.innerHTML = '';
});
contactInfoInput.addEventListener('input', () => {
    coverLetterPreview.innerHTML = '';
});