// script.js - Resume Tailor App Logic

// ====== CONFIGURATION ======
// Gemini API configuration - will use environment variable for deployment
let GEMINI_API_KEY = '';
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// ====== DOM ELEMENTS ======
const resumeInput = document.getElementById('resume-upload');
const jdInput = document.getElementById('jd-input');
const tailorBtn = document.getElementById('tailor-btn');
const previewBox = document.getElementById('resume-preview');
const downloadBtn = document.getElementById('download-btn');

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

// ====== RESUME STYLE EXTRACTION ======
let originalResumeStyle = {
    fontSize: 12,
    fontFamily: 'Times',
    lineHeight: 1.5,
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    textColor: '#000000',
    backgroundColor: '#ffffff'
};

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
                            fontFamily: 'Times',
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
                                style.fontFamily = computedStyle.fontFamily.replace(/["']/g, '') || 'Times';
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

// ====== PDF GENERATION ======
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

        // Use html2pdf for better formatting preservation
        const options = {
            margin: [
                originalResumeStyle.margins.top / 72, // Convert px to inches
                originalResumeStyle.margins.right / 72,
                originalResumeStyle.margins.bottom / 72,
                originalResumeStyle.margins.left / 72
            ],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                letterRendering: true,
                logging: false
            },
            jsPDF: { 
                unit: 'in', 
                format: 'letter', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Create a temporary container with proper styling
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            font-family: ${originalResumeStyle.fontFamily}, 'Times New Roman', serif;
            font-size: ${originalResumeStyle.fontSize}pt;
            line-height: ${originalResumeStyle.lineHeight};
            color: ${originalResumeStyle.textColor};
            background-color: ${originalResumeStyle.backgroundColor};
            width: 8.5in;
            min-height: 11in;
            padding: 0.5in;
            margin: 0;
            box-sizing: border-box;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
        `;
        
        // Format content for better PDF layout
        const formattedContent = content.trim();
            
        tempContainer.textContent = formattedContent;
        
        // Add to DOM temporarily
        document.body.appendChild(tempContainer);
        
        // Generate PDF
        await html2pdf().set(options).from(tempContainer).save();
        
        // Clean up
        document.body.removeChild(tempContainer);
        
        // Reset button state
        setTimeout(() => {
            btn.classList.remove('downloading');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1000);
        
    } catch (error) {
        console.error('PDF generation failed:', error);
        
        // Reset button on error
        const btn = isResume ? downloadResumeBtn : downloadCoverLetterBtn;
        btn.classList.remove('downloading');
        btn.innerHTML = btn.dataset.originalText || 'Download PDF';
        btn.disabled = false;
        
        // Show error message
        alert('Failed to generate PDF. Please try again.');
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
    const apiToken = getApiToken();
    const shouldGenerateCoverLetter = generateCoverLetterCheckbox.checked;
    const managerName = hiringManagerInput.value.trim() || 'Hiring Manager';
    const contactInfo = contactInfoInput.value.trim();

    if (!file) {
        showMessage('Please upload your resume file.', true);
        return;
    }
    if (!jdText) {
        showMessage('Please paste the job description.', true);
        return;
    }
    if (!apiToken) {
        showMessage('Application configuration error: Gemini API key not found. Please contact support.', true);
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
        const tailoredResume = await callGeminiChat(resumeText, jdText, apiToken);
        previewBox.innerHTML = '';
        typewriterEffect(tailoredResume, previewBox, 14);

        // Generate cover letter if requested
        if (shouldGenerateCoverLetter) {
            showSpinner();
            try {
                const coverLetter = await generateCoverLetter(resumeText, jdText, managerName, contactInfo, apiToken);
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