from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="AI Chatbot SaaS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class WebsiteRequest(BaseModel):
    url: str

class ChatRequest(BaseModel):
    company_context: str
    question: str

# Serwowanie nowego pliku widget-v3.js (omija cache przeglądarki)
@app.get("/widget-v3.js")
async def get_widget_v3():
    return FileResponse("widget-v3.js", media_type="application/javascript")

# (Opcjonalnie zostawiamy też stary, gdyby był gdzieś używany)
@app.get("/widget.js")
async def get_widget():
    return FileResponse("widget.js", media_type="application/javascript")

@app.post("/analyze-website")
async def analyze_website(data: WebsiteRequest):
    url = data.url
    if not url.startswith("http"):
        url = "https://" + url
    
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client_http:
            response = await client_http.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
            soup = BeautifulSoup(response.text, "html.parser")
            
            for s in soup(["script", "style", "nav", "footer", "iframe", "noscript"]):
                s.decompose()
                
            text = " ".join(soup.get_text(separator=" ", strip=True).split())
            return {"status": "success", "company_context": text[:12000]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd analizy strony: {str(e)}")

@app.post("/chat")
async def chat_with_bot(data: ChatRequest):
    try:
        prompt = f"Jesteś profesjonalnym asystentem firmy. Odpowiadaj wyczerpująco i uprzejmie, bazując WYŁĄCZNIE na poniższych informacjach o firmie:\n{data.company_context}"
        res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": data.question}],
            temperature=0.3
        )
        return {"reply": res.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
