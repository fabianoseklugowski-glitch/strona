(function() {
    // 1. Style CSS - wymuszone kontrastowe kolory i pełna czytelność
    const style = document.createElement('style');
    style.innerHTML = `
        .fati-chat-toggle-btn { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-color: #374151; color: white; border: none; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 9999; }
        .fati-chat-container { position: fixed; bottom: 90px; right: 20px; width: 320px; height: 450px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; z-index: 9998; font-family: sans-serif; }
        .fati-chat-container.open { display: flex; }
        .fati-chat-header { background: #374151; color: white; padding: 15px; font-weight: bold; }
        .fati-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
        .fati-message { padding: 8px 12px; border-radius: 8px; max-width: 85%; line-height: 1.4; }
        
        /* POPRAWKA: Mocne, kontrastowe tło i czarny, gruby tekst */
        .fati-message.bot { background: #cbd5e1 !important; color: #000000 !important; align-self: flex-start; font-weight: 600 !important; }
        
        .fati-message.user { background: #374151; color: white; align-self: flex-end; }
        .fati-chat-input-area { padding: 10px; border-top: 1px solid #eee; display: flex; gap: 5px; }
        .fati-chat-input-area input { flex: 1; border: 1px solid #ddd; padding: 8px; border-radius: 4px; outline: none; }
        .fati-chat-input-area button { background: #374151; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
    `;
    document.head.appendChild(style);

    // 2. Struktura HTML
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="fati-chat-container" id="fatiChatContainer">
            <div class="fati-chat-header">fati AI Asystent</div>
            <div class="fati-chat-messages" id="fatiMessages">
                <div class="fati-message bot">Analizuję stronę... chwila cierpliwości.</div>
            </div>
            <div class="fati-chat-input-area">
                <input type="text" id="fatiUserInput" placeholder="Zapytaj o coś..." onkeypress="if(event.key === 'Enter') fatiSendMessage()">
                <button onclick="fatiSendMessage()">Wyślij</button>
            </div>
        </div>
        <button class="fati-chat-toggle-btn" onclick="fatiToggleChat()">AI</button>
    `;
    document.body.appendChild(container);

    let companyContext = "";
    
    // Adres Twojego serwera na Renderze
    const backendUrl = "https://moj-chatbot-serwer.onrender.com";

    // 3. Automatyczna analiza
    async function fatiInitContext() {
        try {
            const response = await fetch(`${backendUrl}/analyze-website`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: window.location.href })
            });
            const data = await response.json();
            if (response.ok) {
                companyContext = data.company_context;
                document.getElementById('fatiMessages').innerHTML = '<div class="fati-message bot">Cześć! Poznałem już tę stronę. W czym mogę pomóc?</div>';
            } else {
                document.getElementById('fatiMessages').innerHTML = '<div class="fati-message bot">Błąd analizy strony przez serwer.</div>';
            }
        } catch (e) {
            document.getElementById('fatiMessages').innerHTML = '<div class="fati-message bot">Błąd połączenia z serwerem.</div>';
        }
    }

    fatiInitContext();

    window.fatiToggleChat = () => document.getElementById('fatiChatContainer').classList.toggle('open');

    window.fatiSendMessage = async () => {
        const input = document.getElementById('fatiUserInput');
        if (!input.value.trim()) return;
        
        const msgBox = document.getElementById('fatiMessages');
        msgBox.innerHTML += `<div class="fati-message user">${input.value}</div>`;
        const question = input.value;
        input.value = '';

        try {
            const response = await fetch(`${backendUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_context: companyContext, question: question })
            });
            const data = await response.json();
            msgBox.innerHTML += `<div class="fati-message bot">${data.reply}</div>`;
        } catch (e) {
            msgBox.innerHTML += `<div class="fati-message bot">Błąd połączenia z czatem.</div>`;
        }
        msgBox.scrollTop = msgBox.scrollHeight;
    };
})();
