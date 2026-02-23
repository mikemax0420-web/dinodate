// --- CONFIGURATION ---
// TODO: Replace with your Firebase Config
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DATA: DINO PROFILES ---
const dinos = [
    {
        id: "rex1",
        name: "Rexy",
        species: "T-Rex",
        age: 68000000,
        img: "https://images.unsplash.com/photo-1565056779536-e8d9755f18cb?auto=format&fit=crop&w=600&q=80", // Stock T-Rex
        bio: "Short arms, big heart. Looking for someone to help me reach the top shelf. Carnivore but vegan-curious.",
        style: "Aggressive all caps sometimes, makes jokes about arms, hungry.",
        opener: "RAWR! *cough* sorry. Hey there. You look like a snack. I mean... nice to meet you."
    },
    {
        id: "dodo1",
        name: "Dodo The Destroyer",
        species: "Dodo",
        age: 3,
        img: "https://ark.wiki.gg/images/thumb/7/77/Dodo.png/450px-Dodo.png", // Use a placeholder or reliable URL
        bio: "God of destruction. Fear me. I collect berries and beach stones.",
        style: "Clueless, confident, thinks they are an apex predator.",
        opener: "Did you see me take down that Bronto? No? Must have blinked. I'm dangerous."
    },
    {
        id: "raptor1",
        name: "Clever Girl",
        species: "Raptor",
        age: 24,
        img: "https://images.unsplash.com/photo-1627449275172-b7b5c879482f?auto=format&fit=crop&w=600&q=80",
        bio: "Fast, intelligent, and I open doors. Literally. Swipe right if you can keep up.",
        style: "Cunning, sharp, suspicious, uses clicky sounds.",
        opener: "*Click click*... I've been watching you from the bushes. In a romantic way."
    }
];

// --- STATE ---
let currentCardIndex = 0;
let currentChatDino = null;
let chatHistory = []; // Local state for context window

// --- DOM ELEMENTS ---
const container = document.getElementById('card-container');
const matchOverlay = document.getElementById('match-overlay');
const chatScreen = document.getElementById('chat-screen');
const msgContainer = document.getElementById('messages-container');

// --- INITIALIZATION ---
function init() {
    renderCards();
    setupListeners();
}

// --- CARD LOGIC ---
function renderCards() {
    container.innerHTML = '';
    dinos.forEach((dino, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.backgroundImage = `url(${dino.img})`;
        card.style.zIndex = dinos.length - index;
        
        // Hide cards already swiped (simple logic for MVP)
        if (index < currentCardIndex) card.style.display = 'none';

        card.innerHTML = `
            <div class="card-content">
                <h2 class="text-3xl font-bold drop-shadow-md">${dino.name}, <span class="text-xl font-normal">${dino.age}</span></h2>
                <p class="text-sm font-semibold uppercase tracking-wider mb-2 opacity-90">${dino.species}</p>
                <p class="drop-shadow-sm">${dino.bio}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function handleSwipe(direction) {
    if (currentCardIndex >= dinos.length) return;

    const cards = document.querySelectorAll('.card');
    const currentCard = cards[currentCardIndex];

    // Animation
    if (direction === 'like') {
        currentCard.classList.add('swipe-right');
        setTimeout(() => triggerMatch(dinos[currentCardIndex]), 300);
    } else {
        currentCard.classList.add('swipe-left');
    }

    currentCardIndex++;
}

function triggerMatch(dino) {
    currentChatDino = dino;
    document.getElementById('match-name').innerText = dino.name;
    matchOverlay.classList.remove('hidden');
    
    // Reset Chat
    chatHistory = []; 
    msgContainer.innerHTML = '';
}

// --- CHAT LOGIC ---
function startChat() {
    matchOverlay.classList.add('hidden');
    document.getElementById('swipe-screen').classList.add('hidden');
    chatScreen.classList.remove('hidden');
    
    // Setup Chat UI
    document.getElementById('chat-name').innerText = currentChatDino.name;
    document.getElementById('chat-avatar').src = currentChatDino.img;
    
    // Dino sends first message
    addMessageToUI(currentChatDino.opener, 'dino');
    chatHistory.push({ role: 'assistant', content: currentChatDino.opener });
}

function exitChat() {
    chatScreen.classList.add('hidden');
    document.getElementById('swipe-screen').classList.remove('hidden');
    currentChatDino = null;
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // 1. UI Update (User)
    addMessageToUI(text, 'user');
    input.value = '';
    
    // 2. Safety Check (Client Side Basic)
    const badWords = ['kill', 'blood', 'die']; // Add more for production
    if (badWords.some(word => text.toLowerCase().includes(word))) {
        setTimeout(() => {
            addMessageToUI("*Dino looked uncomfortable and ran away*", 'dino');
            setTimeout(exitChat, 2000);
        }, 1000);
        return;
    }

    chatHistory.push({ role: 'user', content: text });

    // 3. Save to Firebase (Fire and forget)
    // We create a new collection 'chats' just to log data
    db.collection('chats').add({
        dino: currentChatDino.name,
        message: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 4. Loading Indicator
    const loadingId = addLoadingIndicator();

    // 5. Call Cloudflare Function (AI)
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: chatHistory,
                dinoPersona: currentChatDino
            })
        });

        const data = await response.json();
        removeMessage(loadingId);

        if (data.reply) {
            addMessageToUI(data.reply, 'dino');
            chatHistory.push({ role: 'assistant', content: data.reply });
        } else {
            addMessageToUI("*Roars in confusion* (API Error)", 'dino');
        }

    } catch (e) {
        removeMessage(loadingId);
        addMessageToUI("Error connecting to dino brain.", 'dino');
        console.error(e);
    }
}

// --- HELPERS ---
function addMessageToUI(text, sender) {
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'msg-user' : 'msg-dino';
    div.innerText = text;
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function addLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'msg-dino text-gray-400 italic';
    div.innerText = 'Typing...';
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function resetApp() {
    location.reload();
}

function setupListeners() {
    document.getElementById('btn-nope').addEventListener('click', () => handleSwipe('nope'));
    document.getElementById('btn-like').addEventListener('click', () => handleSwipe('like'));
    document.getElementById('btn-start-chat').addEventListener('click', startChat);
    document.getElementById('btn-back').addEventListener('click', exitChat);
    document.getElementById('btn-send').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Start
init();