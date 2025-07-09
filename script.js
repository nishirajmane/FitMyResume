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
    const prompt = `\nYou are a professional career coach and resume writer.\nYour task: Given a resume and a job description, output ONLY the revised, tailored resume in a clean, professional, and well-organized format suitable for direct use.\n- Do NOT include any \"thinking\", steps, or commentary.\n- Use clear section headers (e.g., Professional Summary, Skills, Experience, Projects, Education, Certifications).\n- Use bullet points and concise, formal language.\n- Remove personal details (DOB, marital status, etc.).\n- Focus on the job requirements and highlight relevant skills and experience.\n- Output ONLY the final resume, nothing else.\n\nHere is the resume: ${resumeText}\n\nHere is the job description: ${jdText}\n`;

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
            temperature: 0.5,
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
    // downloadBtn.style.display = 'none'; // Download button removed
    const file = resumeInput.files[0];
    const jdText = jdInput.value.trim();
    const apiToken = getApiToken();

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
        // downloadBtn.style.display = 'inline-block'; // Download button removed
    } catch (err) {
        showMessage(err.toString(), true);
    }
});

// ====== PDF DOWNLOAD REMOVED ======
// ====== UX: Clear preview on new upload or JD change ======
resumeInput.addEventListener('change', () => {
    previewBox.innerHTML = '';
    // downloadBtn.style.display = 'none'; // Download button removed
});
jdInput.addEventListener('input', () => {
    previewBox.innerHTML = '';
    // downloadBtn.style.display = 'none'; // Download button removed
});
apiKeyInput.addEventListener('input', () => {
    previewBox.innerHTML = '';
    // downloadBtn.style.display = 'none'; // Download button removed
}); 