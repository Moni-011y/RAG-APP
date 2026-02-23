import "@/lib/polyfill";
import { NextRequest, NextResponse } from "next/server";
import { RAGService } from "@/lib/rag-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    return NextResponse.json(
        { detail: "Method not allowed. Use POST to send a chat message." },
        { status: 405, headers: { Allow: "POST, OPTIONS" } }
    );
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, api_key, groq_api_key",
        },
    });
}


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, user_id, api_key: google_key, groq_api_key: groq_key, pdf_text } = body;

        const googleApiKey = google_key || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        const groqApiKey = groq_key || process.env.NEXT_PUBLIC_GROQ_API_KEY;
        const userId = user_id || "default";

        if (!googleApiKey || !groqApiKey) {
            return NextResponse.json({ detail: "Missing API keys" }, { status: 400 });
        }

        const ragService = new RAGService(userId, googleApiKey, groqApiKey);
        const stream = await ragService.getChatResponse(query, pdf_text);

        // Convert LangChain stream to web ReadableStream for Next.js
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                let fullAnswer = "";
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", content: "thinking..." })}\n\n`));

                try {
                    for await (const chunk of stream) {
                        // Case 1: RAG result object
                        if (chunk && typeof chunk === "object" && "answer" in chunk) {
                            const answer = (chunk as any).answer;
                            fullAnswer += answer;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content: answer })}\n\n`));

                            if ("context" in chunk && Array.isArray((chunk as any).context)) {
                                const sources = (chunk as any).context.map((doc: any) => ({
                                    page: (doc.metadata?.page || 0) + 1,
                                    snippet: (typeof doc.pageContent === "string" ? doc.pageContent : "").substring(0, 200)
                                }));
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`));
                            }
                        }
                        // Case 2: Direct LLM stream (AIMessageChunk or string)
                        else if (chunk) {
                            let text = "";
                            if (typeof chunk === "string") {
                                text = chunk;
                            } else if (typeof chunk === "object" && "content" in chunk) {
                                text = (chunk as any).content || "";
                            }

                            if (text) {
                                fullAnswer += text;
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content: text })}\n\n`));
                            }
                        }
                    }

                    if (fullAnswer) {
                        ragService.updateHistory(query, fullAnswer);
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } catch (err: any) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", detail: err.message })}\n\n`));
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({ detail: error.message || "Internal Server Error" }, { status: 500 });
    }
}
