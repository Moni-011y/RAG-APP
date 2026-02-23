export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
}

export interface ChatSession {
    id: string
    date: string
    preview: string
    messages: ChatMessage[]
}
