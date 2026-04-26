import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Guard
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Env check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("🔥 GEMINI_API_KEY is missing in environment variables");
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: API key missing' },
        { status: 500 }
      );
    }

    // 3. Parse and Validate File
    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 });
    }

    // Strict validation
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Must be audio.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Max 5MB allowed.' }, { status: 400 });
    }

    // 4. Convert Audio to Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    // 5. Direct REST API Call to Gemini (v1beta with EXACT required structure)
    let transcript = "";
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Transcribe this audio clearly. Return ONLY the exact transcription text."
                },
                {
                  inlineData: {
                    mimeType: file.type || "audio/mpeg",
                    data: base64Audio
                  }
                }
              ]
            }
          ]
        }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        console.error("🔥 GEMINI ERROR FULL:", rawText);

        return NextResponse.json(
          { success: false, error: rawText },
          { status: 502 }
        );
      }

      const data = JSON.parse(rawText);
      transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    } catch (restError: any) {
      console.error("🔥 GEMINI FETCH FATAL ERROR:", restError);
      return NextResponse.json(
        { success: false, error: restError.message || "Failed to reach Gemini API" },
        { status: 502 }
      );
    }

    // 6. Validate Response safely
    if (!transcript || transcript.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'No speech detected' },
        { status: 422 }
      );
    }

    // 7. Save to Database
    try {
      await prisma.transcript.create({
        data: {
          content: transcript.trim(),
          userId: session.userId,
        }
      });
    } catch (dbError) {
      console.error("🔥 DB SAVE ERROR:", dbError);
      return NextResponse.json(
        { success: false, error: 'Transcription succeeded but failed to save to database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript: transcript.trim()
    });

  } catch (error: any) {
    console.error("🔥 TOP LEVEL ERROR IN TRANSCRIBE ROUTE:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
