"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Upload, Paperclip, Copy, Check, Menu, Pencil, RotateCcw, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

import { ChatMessage } from "@/types"

interface ChatInterfaceProps {
    isDocumentLoaded: boolean
    fileName: string | null
    messages: ChatMessage[]
    onSend: (query: string) => void
    onNewChat: () => void
    onFileUpload: (file: File) => void
    isLoading: boolean
    onToggleSidebar: () => void
    isSidebarOpen: boolean
    onRegenerate: (index: number) => void
    onEdit: (index: number, content: string) => void
}

export function ChatInterface({
    isDocumentLoaded,
    fileName,
    messages,
    onSend,
    onFileUpload,
    isLoading,
    onToggleSidebar,
    isSidebarOpen,
    onRegenerate,
    onEdit
}: ChatInterfaceProps) {
    const [input, setInput] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editInput, setEditInput] = useState("")
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSend = () => {
        if (!input.trim() || isLoading) return
        onSend(input)
        setInput("")
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-linear-to-br from-white via-blue-100/60 to-blue-200/50 backdrop-blur-3xl relative overflow-hidden shadow-2xl rounded-none md:rounded-3xl border border-white/60">
            {/* Header - More compact for mobile */}
            <header className="px-3 py-2 md:px-10 md:py-6 flex items-center justify-between border-b border-white/20">
                <div className="flex items-center space-x-2 md:space-x-3">
                    <button
                        onClick={onToggleSidebar}
                        className="p-1 px-2 hover:bg-black/5 rounded-lg text-gray-700 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white/50 rounded-lg flex items-center justify-center border border-white/50 shadow-sm transition-transform hover:scale-105 overflow-hidden p-1.5">
                        <Image src="/lumina-logo.png" alt="Lumina Logo" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-xl font-black text-gray-900 tracking-tighter m-0">LUMINA</h1>
                        {isDocumentLoaded && (
                            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5 truncate max-w-[80px] md:max-w-[200px]">
                                {fileName}
                            </p>
                        )}
                    </div>
                </div>

                <label className="bg-linear-to-br from-blue-500 to-cyan-500 text-white py-1.5 px-3 md:py-3 md:px-6 rounded-full font-bold text-[10px] md:text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer">
                    <Upload className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline">Upload Source</span>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onFileUpload(file)
                    }} />
                </label>
            </header>

            {/* Main Viewport */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-8">
                <div className={cn(
                    "w-full max-w-3xl mx-auto py-6 md:py-12 flex flex-col",
                    messages.length === 0 ? "h-full justify-center" : "min-h-full justify-start"
                )}>
                    <AnimatePresence mode="wait">
                        {messages.length === 0 ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center text-center space-y-6 md:space-y-10"
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Image
                                        src="/bot-mascot-new.png"
                                        alt="Lumina Bot"
                                        width={200}
                                        height={200}
                                        className="w-40 h-40 md:w-64 md:h-64 object-contain pointer-events-none drop-shadow-xl"
                                        priority
                                    />
                                </motion.div>

                                <div className="space-y-3 px-4">
                                    <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">
                                        Let&apos;s analyze your documents.
                                    </h2>
                                    <p className="text-gray-500 font-medium text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
                                        Upload a PDF to get started with intelligent AI insights.
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-4 md:space-y-8">
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex items-start",
                                            message.role === "user" ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 md:w-10 md:h-10 flex items-center justify-center shrink-0",
                                            message.role === "user" ? "ml-1.5 md:ml-4" : "mr-1.5 md:mr-4"
                                        )}>
                                            <Image
                                                src={message.role === "user" ? "/user-avatar.png" : "/ai-avatar.png"}
                                                alt={message.role === "user" ? "User" : "AI"}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>

                                        <div className={cn(
                                            "flex flex-col space-y-1 max-w-[88%]",
                                            message.role === "user" ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn(
                                                "relative",
                                                message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                                            )}>
                                                {editingId === message.id ? (
                                                    <div className="flex flex-col space-y-2 min-w-[180px]">
                                                        <textarea
                                                            autoFocus
                                                            className="bg-black/10 text-inherit border-none rounded-lg p-2 text-xs outline-none resize-none"
                                                            value={editInput}
                                                            onChange={(e) => setEditInput(e.target.value)}
                                                            rows={2}
                                                        />
                                                        <div className="flex justify-end space-x-2">
                                                            <button onClick={() => setEditingId(null)} className="p-1"><X className="w-3 h-3" /></button>
                                                            <button onClick={() => {
                                                                const idx = messages.indexOf(message)
                                                                onEdit(idx, editInput)
                                                                setEditingId(null)
                                                            }} className="p-1"><Check className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={cn(
                                                        "prose prose-slate max-w-none text-[13px] md:text-[15px] font-medium leading-relaxed",
                                                        message.role === 'user' ? "prose-invert" : ""
                                                    )}>
                                                        <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tools */}
                                            <div className="flex items-center space-x-1 mt-0.5 opacity-60 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(message.content)
                                                        setCopiedId(message.id)
                                                        setTimeout(() => setCopiedId(null), 2000)
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-blue-500"
                                                >
                                                    {copiedId === message.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                                </button>
                                                {message.role === "assistant" && !isLoading && (
                                                    <button
                                                        onClick={() => onRegenerate(messages.indexOf(message))}
                                                        className="p-1 text-gray-500 hover:text-blue-500"
                                                    >
                                                        <RotateCcw className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                                {message.role === "user" && !isLoading && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(message.id)
                                                            setEditInput(message.content)
                                                        }}
                                                        className="p-1 text-gray-500 hover:text-blue-500"
                                                    >
                                                        <Pencil className="w-2.5 h-2.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex items-center space-x-2 animate-pulse pl-2">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animation-delay-200" />
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animation-delay-400" />
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                    <div ref={chatEndRef} className="h-4" />
                </div>
            </div>

            {/* Input - Neat for mobile */}
            <footer className="px-3 pb-3 md:px-8 md:pb-8 pt-2">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-1.5 md:p-3 flex items-end space-x-2 shadow-xl border border-white/50">
                        <textarea
                            rows={1}
                            placeholder="Ask anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            className="flex-1 no-input-border py-2.5 px-2 md:py-3 md:px-4 text-sm md:text-base font-medium text-gray-900 placeholder:text-gray-400 resize-none max-h-32"
                        />

                        <div className="flex items-center space-x-1 pb-1 pr-1">
                            <label className="p-2 text-gray-300 hover:text-blue-500 transition-all cursor-pointer">
                                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                                <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) onFileUpload(file)
                                }} />
                            </label>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={cn(
                                    "w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all",
                                    input.trim() && !isLoading
                                        ? "bg-blue-500 text-white shadow-lg active:scale-95"
                                        : "bg-gray-100 text-gray-300"
                                )}
                            >
                                <Send className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
