// script.js - Resume Tailor App Logic

// ====== CONFIGURATION ======
// No hardcoded API key. User must enter their Hugging Face API token in the input field.
let HF_API_TOKEN = '';

// ====== DOM ELEMENTS ======
const resumeInput = document.getElementById('resume-upload');
const jdInput = document.getElementById('jd-input');
const tailorBtn = document.getElementById('tailor-btn');
const previewBox = document.getElementById('resume-preview');
const downloadBtn = document.getElementById('download-btn');
const apiKeyInput = document.getElementById('api-key');

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

// ====== MODAL LOGIC FOR API KEY HELP ======
const howToApiBtn = document.getElementById('how-to-api-btn');
const apiModal = document.getElementById('api-modal');
const closeModalBtn = document.getElementById('close-modal');

howToApiBtn.addEventListener('click', () => {
    apiModal.style.display = 'flex';
});
closeModalBtn.addEventListener('click', () => {
    apiModal.style.display = 'none';
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') apiModal.style.display = 'none';
});
apiModal.addEventListener('click', (e) => {
    if (e.target === apiModal) apiModal.style.display = 'none';
});

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
    // Always use the value from the input field
    return apiKeyInput.value.trim();
}

// ====== FILE PARSING ======
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

// ====== HUGGING FACE API INTEGRATION ======
async function callDeepSeekChat(resumeText, jdText, apiToken) {
    const endpoint = "https://router.huggingface.co/hyperbolic/v1/chat/completions";
    const prompt = `Tailor this resume for the job.

RESUME: ${resumeText}
JOB: ${jdText}

OUTPUT RESUME ONLY. NO THINKING.`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-R1-0528",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            top_p: 0.7,
            stream: false
        })
    });

    if (!response.ok) {
        let errorMsg = "Hyperbolic API error: " + response.status;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg += " - " + errorData.error;
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
    } else {
        throw new Error("Unexpected response format from Hyperbolic API.");
    }
}

async function generateCoverLetter(resumeText, jdText, managerName, contactInfo, apiToken) {
    const endpoint = "https://router.huggingface.co/hyperbolic/v1/chat/completions";
    const prompt = `Write a professional cover letter.

FORMAT: Business letter format
ADDRESS TO: ${managerName}
SIGNATURE: ${contactInfo}

RESUME: ${resumeText}
JOB: ${jdText}

OUTPUT THE LETTER ONLY. NO THINKING. NO EXPLANATIONS.`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-R1-0528",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            top_p: 0.7,
            stream: false
        })
    });

    if (!response.ok) {
        let errorMsg = "Hyperbolic API error: " + response.status;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMsg += " - " + errorData.error;
            }
        } catch (e) { }
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
    } else {
        throw new Error("Unexpected response format from Hyperbolic API.");
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
        showMessage('Please enter your Hugging Face API token.', true);
        return;
    }
    if (shouldGenerateCoverLetter && !contactInfo) {
        showMessage('Please enter your contact information for the cover letter signature.', true);
        return;
    }

    showSpinner();
    let resumeText = '';
    try {
        resumeText = await extractResumeText(file);
    } catch (err) {
        showMessage(err.toString(), true);
        return;
    }

    showSpinner();
    try {
        const tailoredResume = await callDeepSeekChat(resumeText, jdText, apiToken);
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
apiKeyInput.addEventListener('input', () => {
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