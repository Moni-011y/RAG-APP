import { NextRequest, NextResponse } from "next/server";
import { RAGService } from "@/lib/rag-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, api_key: google_key } = body;

        const googleApiKey = google_key || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY; // Always from env for security
        const userId = user_id || "default";

        if (!googleApiKey || !groqApiKey) {
            return NextResponse.json({ error: "Missing API keys" }, { status: 400 });
        }

        const ragService = new RAGService(userId, googleApiKey, groqApiKey);
        ragService.clearHistory();

        return NextResponse.json({ message: `Session history cleared for ${userId}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
