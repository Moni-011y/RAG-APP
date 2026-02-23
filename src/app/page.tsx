"use client"
// Build Version: 1.0.3 - Fixed unsafe .replace calls in streaming

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatInterface } from "@/components/ChatInterface"
import { Toaster, toast } from "sonner"
import { ChatMessage, ChatSession } from "@/types"

export default function Home() {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [fileName, setFileName] = useState<string | null>(null)
    const [isDocumentLoaded, setIsDocumentLoaded] = useState(false)
    const [pdfText, setPdfText] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [deviceId, setDeviceId] = useState<string>("")

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""

    // Load history and sessions
    useEffect(() => {
        const savedMessages = localStorage.getItem("lumina_history")
        const savedFile = localStorage.getItem("lumina_filename")
        const savedDocStatus = localStorage.getItem("lumina_doc_status")
        const savedPdfText = localStorage.getItem("lumina_pdf_text")
        const savedSessions = localStorage.getItem("lumina_sessions")
        let savedDeviceId = localStorage.getItem("lumina_device_id")

        if (!savedDeviceId) {
            savedDeviceId = Math.random().toString(36).substring(7)
            localStorage.setItem("lumina_device_id", savedDeviceId)
        }
        setDeviceId(savedDeviceId)

        if (savedMessages) setMessages(JSON.parse(savedMessages))
        if (savedFile) setFileName(savedFile)
        if (savedDocStatus) setIsDocumentLoaded(JSON.parse(savedDocStatus))
        if (savedPdfText) setPdfText(savedPdfText)
        if (savedSessions) setSessions(JSON.parse(savedSessions))

        // Open sidebar by default on large screens
        if (window.innerWidth > 1024) {
            setIsSidebarOpen(true)
        }
    }, [])

    // Sync history
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem("lumina_history", JSON.stringify(messages))
        }
        if (sessions.length > 0) {
            localStorage.setItem("lumina_sessions", JSON.stringify(sessions))
        }
        if (fileName) localStorage.setItem("lumina_filename", fileName)
        if (isDocumentLoaded) localStorage.setItem("lumina_doc_status", JSON.stringify(isDocumentLoaded))
        if (pdfText) localStorage.setItem("lumina_pdf_text", pdfText)
    }, [messages, fileName, isDocumentLoaded, sessions, pdfText])

    const getApiBaseUrl = () => {
        if (typeof window !== "undefined") return window.location.origin
        return ""
    }

    const handleFileUpload = async (file: File | null) => {
        if (!file) return
        setIsLoading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("api_key", apiKey)
        formData.append("user_id", deviceId)

        try {
            const apiBaseUrl = getApiBaseUrl()
            const response = await fetch(`${apiBaseUrl}/api/upload`, {
                method: "POST",
                body: formData,
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Upload failed with status ${response.status}`)
            }
            const data = await response.json()
            setFileName(file.name)
            setPdfText(data.text || null)
            setIsDocumentLoaded(true)
            toast.success("Document analyzed")
        } catch (err: any) {
            console.error("Upload Error:", err)
            toast.error(err.message || "Upload failed: Connection error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegenerate = (index: number) => {
        if (index <= 0) return
        const previousUserQuery = messages[index - 1].content
        setMessages(prev => prev.slice(0, index))
        handleSend(previousUserQuery, true)
    }

    const handleEdit = (index: number, newQuery: string) => {
        setMessages(prev => prev.slice(0, index))
        handleSend(newQuery)
    }

    const handleSend = async (query: string, isRegenerate = false) => {
        const assistantId = Math.random().toString(36)

        if (!isRegenerate) {
            const userMsg: ChatMessage = { id: Math.random().toString(36), role: "user", content: query }
            setMessages(prev => [...prev, userMsg])
        }

        setIsLoading(true)

        try {
            const apiBaseUrl = getApiBaseUrl()
            const response = await fetch(`${apiBaseUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    api_key: apiKey,
                    groq_api_key: groqApiKey,
                    user_id: deviceId,
                    pdf_text: pdfText
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || `Server error: ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) return

            setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }])
            let content = ""
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split("\n\n")

                for (const line of lines) {
                    try {
                        const trimmedLine = line?.trim();
                        if (!trimmedLine || typeof trimmedLine !== 'string' || !trimmedLine.startsWith("data: ")) continue;

                        const dataStr = trimmedLine.slice(6).trim();
                        if (dataStr === "[DONE]") break;

                        try {
                            const data = JSON.parse(dataStr)
                            if (data.type === "content" && data.content) {
                                content += data.content
                                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content } : m))
                            } else if (data.type === "error") {
                                toast.error(data.detail || "AI Error")
                            }
                        } catch (e) {
                            // JSON split across chunks
                        }
                    } catch (e) {
                        console.error("Error processing line:", e);
                    }
                }
            }
        } catch (err: any) {
            console.error("Chat Error:", err)
            toast.error(err.message || "Connection failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleNewChat = () => {
        if (messages.length > 0) {
            const newSession: ChatSession = {
                id: Math.random().toString(36),
                date: new Date().toLocaleDateString(),
                preview: messages[0].content.substring(0, 100),
                messages: messages
            }
            setSessions(prev => [newSession, ...prev])
            localStorage.setItem("lumina_sessions", JSON.stringify([newSession, ...sessions]))
        }

        setMessages([])
        setFileName(null)
        setPdfText(null)
        setIsDocumentLoaded(false)
        localStorage.removeItem("lumina_history")
        localStorage.removeItem("lumina_filename")
        localStorage.removeItem("lumina_doc_status")
        localStorage.removeItem("lumina_pdf_text")
    }

    return (
        <main className="flex h-dvh w-full overflow-hidden p-0 md:p-4 bg-transparent relative overscroll-none">
            <Toaster position="top-right" theme="light" richColors />

            {/* Sidebar with absolute positioning for better control */}
            <div className={`fixed inset-y-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 overflow-hidden'}`}>
                <Sidebar
                    onNewChat={handleNewChat}
                    onToggle={() => setIsSidebarOpen(false)}
                    messages={messages}
                    fileName={fileName}
                    sessions={sessions}
                    onLoadSession={(s: ChatSession) => {
                        setMessages(s.messages)
                        if (window.innerWidth < 1024) setIsSidebarOpen(false)
                    }}
                    onDeleteSession={(id: string, e: React.MouseEvent) => {
                        e.stopPropagation()
                        const updated = sessions.filter(s => s.id !== id)
                        setSessions(updated)
                        localStorage.setItem("lumina_sessions", JSON.stringify(updated))
                    }}
                />
            </div>

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                />
            )}

            <div className="flex-1 flex justify-center items-center h-full relative overflow-hidden">
                <div className="w-full h-full max-w-7xl">
                    <ChatInterface
                        isDocumentLoaded={isDocumentLoaded}
                        fileName={fileName}
                        messages={messages}
                        onSend={handleSend}
                        onNewChat={handleNewChat}
                        onFileUpload={handleFileUpload}
                        isLoading={isLoading}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        isSidebarOpen={isSidebarOpen}
                        onRegenerate={handleRegenerate}
                        onEdit={handleEdit}
                    />
                </div>
            </div>
        </main>
    )
}
