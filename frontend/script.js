// API Endpoint base URL helper
const API_BASE = window.location.origin.startsWith('file') ? 'http://localhost:5000' : '';

// State management
let currentProfile = null;
let chatHistory = [];
let isGenerating = false;

// DOM Elements
const form = document.getElementById('futureForm');
const generateBtn = document.getElementById('generate-btn');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const resultContainer = document.getElementById('result-container');
const errorMsg = document.getElementById('formError');

// Result Elements
const resultMessage = document.getElementById('resultMessage');
const resultIdentity = document.getElementById('resultIdentity');
const resultMoves = document.getElementById('resultMoves');
const resultHabit = document.getElementById('resultHabit');
const resultWarning = document.getElementById('resultWarning');
const resultMantra = document.getElementById('resultMantra');

// Buttons
const copyBtn = document.getElementById('copy-btn');
const startChatBtn = document.getElementById('start-chat-btn');
const regenerateBtn = document.getElementById('regenerate-btn');

// Chat Elements
const chatLockOverlay = document.getElementById('chat-lock-overlay');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');
const chatTyping = document.getElementById('chat-typing');

// Smooth Scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Scroll Reveal Animation with IntersectionObserver
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

revealElements.forEach(el => revealObserver.observe(el));

// Toast Notification Helper
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Generate FutureMe Action
generateBtn.addEventListener('click', () => {
    triggerGeneration();
});

// Regenerate Action
regenerateBtn.addEventListener('click', () => {
    if (currentProfile) {
        triggerGeneration(currentProfile);
    }
});

// Main generator execution
async function triggerGeneration(customProfile = null) {
    if (isGenerating) return;

    // Get input values
    const name = document.getElementById('userName').value.trim();
    const age = document.getElementById('userAge').value.trim();
    const goal = document.getElementById('userGoal').value.trim();
    const struggle = document.getElementById('userStruggle').value.trim();
    const oneYearVision = document.getElementById('userTimeline').value.trim();
    const tone = document.getElementById('userTone').value;

    // Validate if generating fresh
    if (!customProfile && (!name || !age || !goal || !struggle || !oneYearVision)) {
        errorMsg.style.display = 'block';
        showToast("Please fill in all fields to proceed.");
        return;
    }
    errorMsg.style.display = 'none';

    // Build profile object
    const profile = customProfile || {
        name,
        age,
        goal,
        struggle,
        oneYearVision,
        tone
    };

    // Update UI State
    isGenerating = true;
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
    form.style.display = 'none';
    resultContainer.style.display = 'none';
    loader.style.display = 'block';
    
    // Smooth loading texts
    const loadingTexts = [
        "Synthesizing your goals & ambitions...",
        "Evaluating current struggles...",
        "Mapping your one-year vision trajectory...",
        "Connecting with your future self..."
    ];
    let textIndex = 0;
    loaderText.innerText = loadingTexts[0];
    const textInterval = setInterval(() => {
        textIndex = (textIndex + 1) % loadingTexts.length;
        loaderText.innerText = loadingTexts[textIndex];
    }, 1500);

    try {
        const response = await fetch(`${API_BASE}/api/generate-futureme`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });

        const result = await response.json();
        clearInterval(textInterval);

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Generation failed");
        }

        // Save current profile to state
        currentProfile = profile;
        
        // Display result card
        displayResult(result.data);
        
        // Initialize chat with new profile context
        initializeChat(profile);

    } catch (err) {
        console.error(err);
        clearInterval(textInterval);
        loader.style.display = 'none';
        form.style.display = 'block';
        errorMsg.innerText = "FutureMe could not respond right now. Try again.";
        errorMsg.style.display = 'block';
        showToast("Connection error. Please try again.");
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        regenerateBtn.disabled = false;
    }
}

// Display Result Card
function displayResult(data) {
    loader.style.display = 'none';
    
    // Set text contents safely
    resultMessage.innerText = `"${data.message}"`;
    resultIdentity.innerText = data.futureIdentity;
    resultHabit.innerHTML = `<strong>${data.habit}</strong>`;
    resultWarning.innerText = data.warning;
    resultMantra.innerText = data.mantra;

    // Build moves list
    resultMoves.innerHTML = '';
    if (data.nextMoves && Array.isArray(data.nextMoves)) {
        data.nextMoves.forEach(move => {
            const li = document.createElement('li');
            li.innerText = move;
            resultMoves.appendChild(li);
        });
    }

    // Display container
    resultContainer.style.display = 'block';
    
    // Scroll container into view
    document.getElementById('create').scrollIntoView({ behavior: 'smooth' });
    showToast("Your FutureMe has arrived.");
}

// Reset form
function resetForm() {
    resultContainer.style.display = 'none';
    form.reset();
    form.style.display = 'block';
    currentProfile = null;
    
    // Lock chat again
    lockChat();
}

// Copy results to clipboard
copyBtn.addEventListener('click', () => {
    if (!currentProfile) return;

    const movesText = Array.from(resultMoves.children)
        .map((li, i) => `${i + 1}. ${li.innerText}`)
        .join('\n');

    const copyText = `FutureMe Reflection - Prepared for ${currentProfile.name}
--------------------------------------------------
Future Identity:
${resultIdentity.innerText}

Message from Future Self:
${resultMessage.innerText}

Next 3 Moves:
${movesText}

One Habit to Start Today:
${resultHabit.innerText}

Mistake to Avoid:
${resultWarning.innerText}

Daily Mantra:
${resultMantra.innerText}
--------------------------------------------------
Generated at Nitish's Founder Labs`;

    navigator.clipboard.writeText(copyText)
        .then(() => {
            showToast("Advice copied to clipboard!");
        })
        .catch(err => {
            console.error("Copy failed", err);
            showToast("Failed to copy advice.");
        });
});

// Transition to Chat section
startChatBtn.addEventListener('click', () => {
    const chatSection = document.getElementById('chat');
    if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' });
    }
});

/* --- Chat Interface System --- */

// Lock chat setup
function lockChat() {
    chatLockOverlay.classList.remove('unlocked');
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    chatMessages.innerHTML = `
        <div class="chat-bubble chat-ai">
            <span class="chat-sender">FutureMe</span>
            <div class="chat-text">Generate your FutureMe identity above to open direct communication.</div>
        </div>
    `;
    chatHistory = [];
}

// Unlock and initialize chat
function initializeChat(profile) {
    // Unlock UI
    chatLockOverlay.classList.add('unlocked');
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    
    // Clear chat area
    chatMessages.innerHTML = '';
    chatHistory = [];

    // Formulate tone-specific greeting
    let greeting = "";
    if (profile.tone === "Brutally Honest") {
        greeting = `Alright, ${profile.name}. I'm here, and I've got no time for excuses. Ask your question, but be ready for the answer.`;
    } else if (profile.tone === "CEO Mode") {
        greeting = `Briefing active, ${profile.name}. The roadmap is set and the bottleneck from "${profile.struggle}" is solved. Let's optimize. What's on your mind?`;
    } else if (profile.tone === "Calm Mentor") {
        greeting = `Hello, ${profile.name}. I'm glad you're taking this moment to align with where we're going. Let's talk. What is on your mind?`;
    } else { // Motivational
        greeting = `Hey ${profile.name}! I'm the version of you who crossed the finish line and built "${profile.goal}". Ask me anything. We're in this together.`;
    }

    appendChatMessage('futureme', greeting);
}

// Append message bubble to UI
function appendChatMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'chat-user' : 'chat-ai'}`;
    
    const sender = document.createElement('span');
    sender.className = 'chat-sender';
    sender.innerText = role === 'user' ? 'You' : 'FutureMe';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'chat-text';
    
    // Parse response into paragraphs if needed
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    if (paragraphs.length > 1) {
        paragraphs.forEach(p => {
            const pe = document.createElement('p');
            pe.innerText = p.trim();
            textDiv.appendChild(pe);
        });
    } else {
        textDiv.innerText = text;
    }
    
    bubble.appendChild(sender);
    bubble.appendChild(textDiv);
    chatMessages.appendChild(bubble);
    
    // Auto Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send Message handler
async function sendChatMessage() {
    if (!currentProfile || isGenerating) return;

    const question = chatInput.value.trim();
    if (!question) return;

    // Append user message
    appendChatMessage('user', question);
    chatInput.value = '';
    
    // Disable inputs
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    chatTyping.style.display = 'block';
    
    // Auto Scroll typing indicator
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_BASE}/api/chat-futureme`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userProfile: currentProfile,
                chatHistory: chatHistory,
                question: question
            })
        });

        const result = await response.json();
        chatTyping.style.display = 'none';

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Chat failed");
        }

        // Add user exchange to memory
        chatHistory.push({ role: 'user', message: question });
        chatHistory.push({ role: 'futureme', message: result.reply });

        // Append AI Response
        appendChatMessage('futureme', result.reply);

    } catch (err) {
        console.error(err);
        chatTyping.style.display = 'none';
        appendChatMessage('futureme', "FutureMe could not respond right now. Try again.");
        showToast("Chat response failed.");
    } finally {
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    }
}

// Bind chat submit handlers
chatSendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// Share FutureMe mock trigger
function shareFutureMe() {
    if (currentProfile) {
        showToast("Your FutureMe moment is ready to share!");
    } else {
        showToast("Create your FutureMe first before sharing.");
    }
}

// Navbar blur scroll controller
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(3, 3, 5, 0.85)';
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.5)';
    } else {
        nav.style.background = 'rgba(3, 3, 5, 0.7)';
        nav.style.boxShadow = 'none';
    }
});
