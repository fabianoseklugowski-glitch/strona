(function() {
    // 1. Style CSS - dopasowane ciemne tło okna, idealna czytelność
    const style = document.createElement('style');
    style.innerHTML = `
        .fati-chat-toggle-btn { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-color: #3b82f6; color: white; border: none; border-radius: 50%; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 9999; font-weight: bold; font-size: 16px; }
        .fati-chat-container { position: fixed; bottom: 90px; right: 20px; width: 340px; height: 480px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: none; flex-direction: column; overflow: hidden; z-index: 9998; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .fati-chat-container.open { display: flex; }
        .fati-chat-header { background: #0f172a; color: #f8fafc; padding: 15px; font-weight: bold; border-bottom: 1px solid #334155; font-size: 14px; }
        .fati-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; font-size: 13px; background: #0f172a; }
        .fati-message { padding: 10px 14px; border-radius: 8px; max-width: 85%; line-height: 1.4; }
        
        /* WIADOMOŚCI BOTA: Ciemne, wyraźne tło i ŚNIEŻNOBIAŁY, POGRUBIONY TEKST */
        .fati-message.bot { background: #334151 !important; color: #ffffff !important; align-self: flex-start; font-weight: 600 !important; border: 1px solid #475569; }
        
        /* WIADOMOŚCI UŻYTKOWNIKA: Niebieskie, wyraziste */
        .fati-message.user { background: #3b82f6 !important; color: #ffffff !important; align-self: flex-end; font-weight: 600 !important; }
        
        .fati-chat-input-area { padding: 12px; background: #1e293b; border-top: 1px solid #334155; display: flex; gap: 8px; }
        .fati-chat-input-area input { flex: 1; background: #0f172a; border: 1px solid #475569; color: #ffffff; padding: 9px 12px; border-radius: 6px; outline: none; font-size: 13px; }
        .fati-chat-input-area input::placeholder { color: #94a3b8; }
        .fati-chat-input-area button { background: #3b82f6; color: white; border: none; padding: 9px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .fati-chat-input-area button:hover { background: #2563eb; }
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