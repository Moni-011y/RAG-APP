"use client"

import { useState } from "react"
import {
    Plus,
    MessageSquare,
    FileText,
    Clock,
    ChevronLeft,
    Trash2,
    Upload
} from "lucide-react"
import { cn } from "@/lib/utils"

import { ChatMessage, ChatSession } from "@/types"

interface SidebarProps {
    onNewChat: () => void
    onToggle: () => void
    messages: ChatMessage[]
    fileName: string | null
    sessions: ChatSession[]
    onLoadSession: (session: ChatSession) => void
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void
}

export function Sidebar({ onNewChat, onToggle, messages, fileName, sessions, onLoadSession, onDeleteSession }: SidebarProps) {
    const [view, setView] = useState<'chat' | 'history' | 'files'>('chat')

    return (
        <div className={cn(
            "h-full flex flex-row items-center py-2 md:py-6 shrink-0 relative z-50 transition-all duration-300 ease-out",
            view === 'chat' ? "w-16 md:w-20" : "w-[280px] md:w-80"
        )}>
            {/* Main Sidebar Pillar */}
            <div className="h-full w-16 md:w-20 bg-white backdrop-blur-2xl rounded-2xl flex flex-col items-center py-4 md:py-6 shadow-2xl border border-white/50 relative z-20">
                {/* Top Actions */}
                <div className="flex flex-col space-y-4 items-center w-full px-2">
                    <button
                        onClick={onToggle}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-white/50 rounded-xl"
                        title="Toggle Sidebar"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-px bg-gray-200 rounded-full" />

                    <button
                        className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
                        onClick={() => {
                            onNewChat()
                            setView('chat')
                        }}
                        title="New Chat"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col items-center space-y-4 md:space-y-6 mt-4 md:mt-6">
                    <button
                        onClick={() => setView('chat')}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300",
                            view === 'chat'
                                ? "bg-blue-50 text-blue-600 shadow-inner"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title="Current Chat"
                    >
                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    <button
                        onClick={() => setView(view === 'history' ? 'chat' : 'history')}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300",
                            view === 'history'
                                ? "bg-blue-50 text-blue-600 shadow-inner"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title="Chat History"
                    >
                        <Clock className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    <button
                        onClick={() => setView(view === 'files' ? 'chat' : 'files')}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300",
                            view === 'files'
                                ? "bg-blue-50 text-blue-600 shadow-inner"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title="Documents"
                    >
                        <FileText className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </nav>
            </div>

            {/* Expandable Panel */}
            <div className={cn(
                "absolute left-2 md:left-6 top-2 md:top-6 bottom-2 md:bottom-6 bg-white/90 backdrop-blur-xl rounded-r-3xl rounded-l-2xl border-y border-r border-white/50 shadow-xl transition-all duration-300 ease-out flex flex-col overflow-hidden z-10",
                view === 'chat' ? "w-0 opacity-0 translate-x-0" : "w-60 md:w-64 opacity-100 translate-x-[52px] md:translate-x-14 md:pl-4 pl-2"
            )}>
                <div className="p-6 h-full flex flex-col w-64">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 mt-2">
                        {view === 'history' ? 'Past Conversations' : 'Document Library'}
                    </h3>

                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {view === 'history' ? (
                            <div className="space-y-3">
                                {messages.length > 0 && (
                                    <div className="p-3 md:p-4 rounded-2xl bg-blue-50 border border-blue-100 cursor-pointer shadow-sm">
                                        <p className="text-[10px] md:text-xs font-bold text-blue-600 mb-1 md:mb-2">Current Session</p>
                                        <p className="text-xs md:text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed wrap-break-word">
                                            {messages[0].content}
                                        </p>
                                    </div>
                                )}

                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => {
                                            onLoadSession(session)
                                            setView('chat')
                                        }}
                                        className="p-4 rounded-2xl bg-white border border-gray-100 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group relative"
                                    >
                                        <div className="flex justify-between items-center mb-1 md:mb-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{session.date}</p>
                                            <div className="flex items-center space-x-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => onDeleteSession(session.id, e)}
                                                    className="p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs md:text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">
                                            {session.preview}
                                        </p>
                                    </div>
                                ))}

                                {sessions.length === 0 && messages.length === 0 && (
                                    <div className="text-center py-10">
                                        <p className="text-xs font-medium text-gray-300">No recent history</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {fileName ? (
                                    <div className="p-4 rounded-2xl bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-blue-500 shrink-0">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-700 line-clamp-2 leading-tight break-all">{fileName}</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-600 mt-1">
                                                ACTIVE
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-4 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <p className="text-xs font-medium text-gray-400">No document active</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
