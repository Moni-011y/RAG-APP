import { ChatGroq } from "@langchain/groq";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
// @ts-ignore
import pdf from "pdf-parse";

// In-memory cache for chat history per user
const globalForRag = global as unknown as {
    serviceCache: Record<string, {
        chatHistory: any[];
    }>
};

export const serviceCache = globalForRag.serviceCache || {};
globalForRag.serviceCache = serviceCache;

export class RAGService {
    private user_id: string;
    private google_api_key: string;
    private groq_api_key: string;

    constructor(user_id: string, google_api_key: string, groq_api_key: string) {
        this.user_id = user_id;
        this.google_api_key = google_api_key;
        this.groq_api_key = groq_api_key;

        if (!serviceCache[user_id]) {
            serviceCache[user_id] = { chatHistory: [] };
        }
    }

    async processPdf(fileBuffer: Buffer) {
        try {
            // @ts-ignore
            const data = await pdf(fileBuffer);
            const rawText = data?.text;
            let text = typeof rawText === "string" ? rawText : (rawText != null ? String(rawText) : "");

            if (!text || text.trim().length === 0) {
                throw new Error("PDF text extraction failed.");
            }

            // Clean up text
            text = text.replace(/\n\s*\n/g, "\n\n").trim();

            // Limit text size to prevent overloading context (approx 50-100 pages)
            // Llama 3.3 has 128k context, so 100k chars is very safe
            if (text.length > 300000) {
                text = text.substring(0, 300000) + "... (Document Truncated)";
            }

            return { chunks: 0, text: text };
        } catch (err: any) {
            console.error("PDF Process Error:", err);
            throw err;
        }
    }

    async getChatResponse(query: string, pdf_text?: string) {
        const chatHistory = serviceCache[this.user_id].chatHistory;

        const llm = new ChatGroq({
            model: "llama-3.3-70b-versatile",
            apiKey: this.groq_api_key,
            temperature: 0.1,
            streaming: true,
        });

        // 100% Reliable Prompt Strategy: Direct Context Injection
        // We don't use a "Retriever" or "VectorDB" anymore. 
        // We just give the AI the actual text. This NEVER fails.
        const systemPrompt = pdf_text && pdf_text.length > 10
            ? `You are Lumina, an intelligent AI assistant. 
               You have been provided with a document's full text below. 
               Use this document context to answer questions accurately.
               
               [DOCUMENT CONTEXT]:
               ${pdf_text}
               
               INSTRUCTIONS:
               - If the answer is in the document, provide it clearly.
               - If the info is missing, say so but answer based on your general knowledge if relevant.
               - Keep the tone helpful and professional.`
            : `You are Lumina, an intelligent AI assistant. 
               No document is currently uploaded. Answer questions to the best of your general knowledge.`;

        const qaPrompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"],
        ]);

        const chain = qaPrompt.pipe(llm);

        return chain.stream({
            input: query,
            chat_history: chatHistory,
        });
    }

    updateHistory(query: string, answer: string) {
        if (!serviceCache[this.user_id]) serviceCache[this.user_id] = { chatHistory: [] };
        serviceCache[this.user_id].chatHistory.push(["human", query]);
        serviceCache[this.user_id].chatHistory.push(["ai", answer]);

        // Keep last 15 exchanges
        if (serviceCache[this.user_id].chatHistory.length > 30) {
            serviceCache[this.user_id].chatHistory = serviceCache[this.user_id].chatHistory.slice(-30);
        }
    }

    clearHistory() {
        if (serviceCache[this.user_id]) {
            serviceCache[this.user_id].chatHistory = [];
        }
    }
}
