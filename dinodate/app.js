// --- DATA: DINO PROFILES ---
const dinos = [
    {
        id: "rex1",
        name: "Rexy",
        species: "T-Rex",
        age: "68M",
        img: "https://images.unsplash.com/photo-1565056779536-e8d9755f18cb?auto=format&fit=crop&w=600&q=80",
        bio: "Short arms, big heart. Looking for someone to help me reach the top shelf. Carnivore but vegan-curious.",
        style: "Aggressive all caps sometimes, makes jokes about arms, very hungry, mentions meat often.",
        opener: "RAWR! *cough* sorry. Hey there. You look like a snack. I mean... nice to meet you."
    },
    {
        id: "bronto1",
        name: "Littlefoot",
        species: "Brontosaurus",
        age: "150M",
        img: "https://images.unsplash.com/photo-1550543666-414eb1d49012?auto=format&fit=crop&w=600&q=80", 
        bio: "I'm a vegan. I love long walks on Pangea and eating leaves from the tops of trees.",
        style: "Slow talker, very gentle, uses words like 'leaf', 'peace', and 'high up'.",
        opener: "Hello... down... there... The weather is great up here."
    },
    {
        id: "raptor1",
        name: "Clever Girl",
        species: "Velociraptor",
        age: "24",
        img: "https://images.unsplash.com/photo-1627449275172-b7b5c879482f?auto=format&fit=crop&w=600&q=80",
        bio: "Fast, intelligent, and I know how to open doors. Swipe right if you can keep up.",
        style: "Cunning, sharp, suspicious, uses *clicking noises*, extremely smart.",
        opener: "*Click click*... I've been watching you. In a romantic way, of course."
    }
];

// --- STATE ---
let currentCardIndex = 0;
let currentChatDino = null;
let chatHistory = []; 

// --- DOM ELEMENTS ---
const container = document.getElementById('card-container');
const matchOverlay = document.getElementById('match-overlay');
const chatScreen = document.getElementById('chat-screen');
const msgContainer = document.getElementById('messages-container');
const btnSend = document.getElementById('btn-send');
const inputField = document.getElementById('chat-input');

// --- INITIALIZATION ---
function init() {
    renderCards();
    setupListeners();
}

// --- CARD LOGIC ---
function renderCards() {
    container.innerHTML = '';
    dinos.forEach((dino, index) => {
        if (index < currentCardIndex) return;

        const card = document.createElement('div');
        card.className = 'card bg-gray-200';
        card.style.backgroundImage = `url(${dino.img})`;
        card.style.zIndex = dinos.length - index;
        
        card.innerHTML = `
            <div class="card-content">
                <h2 class="text-3xl font-bold drop-shadow-md">${dino.name}, <span class="text-xl font-normal opacity-90">${dino.age}</span></h2>
                <p class="text-sm font-semibold uppercase tracking-wider mb-2 text-pink-300">${dino.species}</p>
                <p class="drop-shadow-sm text-gray-100 leading-relaxed">${dino.bio}</p>
            </div>
        `;
        container.appendChild(card);
    });

    if (currentCardIndex >= dinos.length) {
        document.getElementById('placeholder-msg').classList.remove('hidden');
    }
}

function handleSwipe(direction) {
    if (currentCardIndex >= dinos.length) return;

    const cards = document.querySelectorAll('.card');
    const currentCard = cards[0];

    if (direction === 'like') {
        currentCard.classList.add('swipe-right');
        setTimeout(() => triggerMatch(dinos[currentCardIndex]), 300);
    } else {
        currentCard.classList.add('swipe-left');
        setTimeout(() => currentCard.remove(), 300);
        currentCardIndex++;
    }
}

function triggerMatch(dino) {
    currentChatDino = dino;
    document.getElementById('match-name').innerText = dino.name;
    matchOverlay.classList.remove('hidden');
    chatHistory = []; 
    msgContainer.innerHTML = '';
}

// --- CHAT LOGIC ---
function startChat() {
    matchOverlay.classList.add('hidden');
    document.getElementById('swipe-screen').classList.add('hidden');
    chatScreen.classList.remove('hidden');
    document.getElementById('chat-name').innerText = currentChatDino.name;
    document.getElementById('chat-avatar').src = currentChatDino.img;
    
    addMessageToUI(currentChatDino.opener, 'dino');
    chatHistory.push({ role: 'assistant', content: currentChatDino.opener });
}

function exitChat() {
    chatScreen.classList.add('hidden');
    document.getElementById('swipe-screen').classList.remove('hidden');
    currentChatDino = null;
    currentCardIndex++;
    renderCards();
}

async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    addMessageToUI(text, 'user');
    inputField.value = '';
    btnSend.disabled = true;
    chatHistory.push({ role: 'user', content: text });
    const loadingId = addLoadingIndicator();

    // Call the backend API
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
            addMessageToUI("*Roar?* (AI Error)", 'dino');
        }

    } catch (e) {
        removeMessage(loadingId);
        addMessageToUI("Lost connection to the Jurassic Era.", 'dino');
        console.error(e);
    } finally {
        btnSend.disabled = false;
        inputField.focus();
    }
}

// --- HELPERS ---
function addMessageToUI(text, sender) {
    const div = document.createElement('div');
    div.className = sender === 'user' ? 'msg-user' : 'msg-dino';
    div.innerText = text;
    msgContainer.appendChild(div);
    scrollToBottom();
}

function addLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'msg-dino text-gray-400 italic text-sm';
    div.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Dino is typing...';
    msgContainer.appendChild(div);
    scrollToBottom();
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollToBottom() {
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

function setupListeners() {
    document.getElementById('btn-nope').addEventListener('click', () => handleSwipe('nope'));
    document.getElementById('btn-like').addEventListener('click', () => handleSwipe('like'));
    document.getElementById('btn-start-chat').addEventListener('click', startChat);
    document.getElementById('btn-back').addEventListener('click', exitChat);
    btnSend.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

init();