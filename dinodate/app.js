// --- DATA ---
const dinos = [
    {
        id: 1,
        name: "Rexy",
        species: "T-Rex",
        age: 66,
        img: "https://images.unsplash.com/photo-1560155016-bd4879ae8f21?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Alpha predator looking for a snack... I mean, a snack-sized partner. 🦖"
    },
    {
        id: 2,
        name: "Sarah",
        species: "Triceratops",
        age: 64,
        img: "https://images.unsplash.com/photo-1559999127-b8b7f927d642?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Vegetarian. I have 3 horns so I'm basically a unicorn but heavier."
    },
    {
        id: 3,
        name: "Blue",
        species: "Velociraptor",
        age: 24,
        img: "https://images.unsplash.com/photo-1628147610738-4e8979146fb7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        bio: "Clever girl. Fast runner. If you can't keep up, swipe left."
    }
];

// --- STATE ---
let cardIndex = 0;
let currentChatDino = null;
let chatHistory = [];

// --- DOM ELEMENTS ---
const cardContainer = document.getElementById('card-container');
const btnNope = document.getElementById('btn-nope');
const btnLike = document.getElementById('btn-like');
const matchOverlay = document.getElementById('match-overlay');
const matchName = document.getElementById('match-name');
const btnStartChat = document.getElementById('btn-start-chat');
const chatScreen = document.getElementById('chat-screen');
const swipeScreen = document.getElementById('swipe-screen');
const btnBack = document.getElementById('btn-back');
const messagesContainer = document.getElementById('messages-container');
const inputField = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const chatAvatar = document.getElementById('chat-avatar');
const chatNameDisplay = document.getElementById('chat-name');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderCard();
});

// --- CARD FUNCTIONS ---
function renderCard() {
    cardContainer.innerHTML = ''; // Clear previous
    
    if (cardIndex >= dinos.length) {
        document.getElementById('placeholder-msg').classList.remove('hidden');
        return;
    }

    const dino = dinos[cardIndex];
    const card = document.createElement('div');
    card.className = 'card';
    card.style.backgroundImage = `url('${dino.img}')`;
    
    card.innerHTML = `
        <div class="card-content">
            <h2 class="text-3xl font-bold mb-1">${dino.name}, ${dino.age}</h2>
            <p class="text-pink-300 font-semibold mb-2">${dino.species}</p>
            <p class="text-gray-200">${dino.bio}</p>
        </div>
    `;
    
    cardContainer.appendChild(card);
}

function handleSwipe(action) {
    const card = document.querySelector('.card');
    if (!card) return;

    if (action === 'like') {
        card.classList.add('swipe-right');
        setTimeout(() => showMatch(dinos[cardIndex]), 300);
    } else {
        card.classList.add('swipe-left');
        setTimeout(() => {
            cardIndex++;
            renderCard();
        }, 300);
    }
}

function showMatch(dino) {
    currentChatDino = dino;
    matchName.innerText = dino.name;
    matchOverlay.classList.remove('hidden');
}

// --- EVENT LISTENERS (SWIPE) ---
btnLike.addEventListener('click', () => handleSwipe('like'));
btnNope.addEventListener('click', () => handleSwipe('nope'));

// --- EVENT LISTENERS (CHAT) ---
btnStartChat.addEventListener('click', () => {
    matchOverlay.classList.add('hidden');
    swipeScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    
    // Setup Chat UI
    chatAvatar.src = currentChatDino.img;
    chatNameDisplay.innerText = currentChatDino.name;
    messagesContainer.innerHTML = ''; // Clear old chat
    chatHistory = []; // Reset history
    
    // Initial Greeting from Dino
    const initialGreeting = `*Roar* Hey there! I'm ${currentChatDino.name}.`;
    addMessageToUI(initialGreeting, 'dino');
    chatHistory.push({ role: 'assistant', content: initialGreeting });
});

btnBack.addEventListener('click', () => {
    chatScreen.classList.add('hidden');
    swipeScreen.classList.remove('hidden');
    cardIndex++; // Move to next card after chat
    renderCard();
});

btnSend.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- CHAT LOGIC ---
async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // 1. Add User Message to UI
    addMessageToUI(text, 'user');
    inputField.value = '';
    btnSend.disabled = true;
    chatHistory.push({ role: 'user', content: text });
    
    // 2. Add Loading Indicator
    const loadingId = 'loading-' + Date.now();
    addLoadingIndicator(loadingId);

    try {
        // 3. Send to Cloudflare Function
        // This expects functions/api/chat.js to exist
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: chatHistory,
                dinoPersona: currentChatDino
            })
        });

        // 4. Debugging Error Handling
        if (!response.ok) {
            // Read the error text from the server
            const errorText = await response.text();
            
            if (response.status === 404) {
                throw new Error("404 Not Found: The /api/chat function is missing.");
            } else if (response.status === 500) {
                throw new Error("500 Server Error: The function crashed (Check logs).");
            } else {
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        }

        const data = await response.json();
        removeMessage(loadingId);

        if (data.reply) {
            addMessageToUI(data.reply, 'dino');
            chatHistory.push({ role: 'assistant', content: data.reply });
        } else {
            addMessageToUI("*Confused roar* (No reply data)", 'dino');
        }

    } catch (e) {
        removeMessage(loadingId);
        // Display the ACTUAL error in the chat bubble so you can fix it
        addMessageToUI(`Connection Error: ${e.message}`, 'dino');
        console.error("Full Error Details:", e);
    } finally {
        btnSend.disabled = false;
        inputField.focus();
    }
}

// --- UI HELPERS ---
function addMessageToUI(text, sender) {
    const div = document.createElement('div');
    div.classList.add(sender === 'user' ? 'msg-user' : 'msg-dino');
    div.innerText = text;
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function addLoadingIndicator(id) {
    const div = document.createElement('div');
    div.id = id;
    div.classList.add('msg-dino', 'italic', 'text-gray-400');
    div.innerText = "Thinking...";
    messagesContainer.appendChild(div);
    scrollToBottom();
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}