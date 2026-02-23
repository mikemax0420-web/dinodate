async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // UI Updates
    addMessageToUI(text, 'user');
    inputField.value = '';
    btnSend.disabled = true;
    chatHistory.push({ role: 'user', content: text });
    
    const loadingId = addLoadingIndicator();

    try {
        // This fetches /api/chat. 
        // On Cloudflare Pages, this automatically routes to functions/api/chat.js
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
            addMessageToUI("*Confused roar*", 'dino');
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