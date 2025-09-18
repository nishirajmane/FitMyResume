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

// Font mapping for PDFKit (using built-in fonts)
const fontMapping = {
    'times': 'Times-Roman',
    'times new roman': 'Times-Roman',
    'arial': 'Helvetica',
    'helvetica': 'Helvetica',
    'courier': 'Courier',
    'default': 'Helvetica'
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

        // Create PDF document with PDFKit
        const doc = new window.PDFDocument({
            size: 'LETTER',
            margins: {
                top: originalResumeStyle.margins.top || 40,
                bottom: originalResumeStyle.margins.bottom || 40,
                left: originalResumeStyle.margins.left || 40,
                right: originalResumeStyle.margins.right || 40
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

        // Set up document styling based on extracted resume style
        const fontSize = originalResumeStyle.fontSize || 11;
        const fontFamily = mapFontToPDFKit(originalResumeStyle.fontFamily) || 'Helvetica';
        const lineHeight = originalResumeStyle.lineHeight || 1.4;
        const textColor = originalResumeStyle.textColor || '#000000';

        // Process content for PDF
        const lines = content.split('\n');
        let yPosition = doc.page.margins.top;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

        doc.font(fontFamily)
           .fontSize(fontSize)
           .fillColor(textColor);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines but add some spacing
            if (!line) {
                yPosition += fontSize * 0.5;
                continue;
            }

            // Check if we need a new page
            if (yPosition + (fontSize * lineHeight) > pageHeight) {
                doc.addPage();
                yPosition = doc.page.margins.top;
            }

            // Detect headers (lines that are likely section headers)
            const isHeader = line.length < 50 && 
                            (line.toUpperCase() === line || 
                             line.includes(':') || 
                             /^[A-Z][A-Za-z\s]+$/.test(line));

            if (isHeader && line.length > 2) {
                // Style headers differently
                doc.fontSize(fontSize + 2)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50');
                
                yPosition += fontSize * 0.5; // Add space before header
                doc.text(line, doc.page.margins.left, yPosition, {
                    width: pageWidth,
                    align: 'left'
                });
                yPosition += (fontSize + 2) * lineHeight + 5;
                
                // Reset to normal text style
                doc.fontSize(fontSize)
                   .font(fontFamily)
                   .fillColor(textColor);
            } else {
                // Regular text with word wrapping
                const textHeight = doc.heightOfString(line, {
                    width: pageWidth,
                    lineGap: fontSize * (lineHeight - 1)
                });
                
                // Check if text fits on current page
                if (yPosition + textHeight > pageHeight) {
                    doc.addPage();
                    yPosition = doc.page.margins.top;
                }
                
                doc.text(line, doc.page.margins.left, yPosition, {
                    width: pageWidth,
                    align: 'left',
                    lineGap: fontSize * (lineHeight - 1)
                });
                
                yPosition += textHeight + 3;
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