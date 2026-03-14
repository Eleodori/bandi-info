# Bandi Info

Web app per la gestione dei bandi di finanziamento con AI assistant.

## Funzionalità
- Upload e indicizzazione PDF dei bandi
- Lista e gestione dei bandi caricati
- Chat AI per domande sui bandi (RAG con Pinecone)
- Supporto multi-tenant predisposto

## Stack
- Frontend: HTML/CSS/JS vanilla
- Backend: n8n workflows (webhook API)
- Vector DB: Pinecone
- AI: OpenAI GPT-4o-mini + text-embedding-3-small
- Hosting: Netlify
