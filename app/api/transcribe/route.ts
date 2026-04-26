import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySession } from '@/lib/session';
import prisma from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

// In-memory rate limiting map
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5;

  const data = rateLimitMap.get(userId);
  if (!data || now > data.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (data.count >= maxRequests) {
    return true;
  }

  data.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Guard
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Valid session required.' }, { status: 401 });
    }

    // 2. Rate Limiting Check
    if (isRateLimited(session.userId)) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded. Maximum 5 requests per minute allowed.' }, { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration: GEMINI_API_KEY is missing.' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No audio file provided in the request payload.' }, { status: 400 });
    }

    // 3. Strict Server-side Validation
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ success: false, error: 'Invalid file format. Only audio MIME types are supported.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Audio file size exceeds the 5MB maximum limit.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;

    // 4. Gemini Transcription with Timeout
    let transcriptText = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Please carefully transcribe this audio. Return ONLY the exact transcription text, with no introductory or conversational text. If there is no speech, return an empty string.';
      
      const generationPromise = model.generateContent([
        prompt,
        {
          inlineData: { mimeType, data: base64Data },
        },
      ]);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 10000); // 10 second timeout
      });

      const result: any = await Promise.race([generationPromise, timeoutPromise]);
      transcriptText = result.response.text();
    } catch (geminiError: any) {
      console.error('Gemini Failure Log:', geminiError.stack || geminiError);
      
      let errorMessage = 'AI Processing Error: Failed to generate transcript.';
      if (geminiError.message === 'TIMEOUT') {
        errorMessage = 'Transcription timed out (10s limit exceeded). Please try a shorter audio file.';
      } else if (geminiError?.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid Gemini API Key configuration.';
      }
      
      return NextResponse.json({ success: false, error: errorMessage }, { status: 502 });
    }

    // 5. Strong Transcript Validation
    const finalizedText = transcriptText.trim();
    if (!finalizedText || finalizedText.length < 3) {
       return NextResponse.json({ success: false, error: 'Transcription rejected: Audio contained no meaningful speech or was too quiet.' }, { status: 422 });
    }

    // 6. DB Storage
    try {
      await prisma.transcript.create({
        data: {
          content: finalizedText,
          userId: session.userId,
        }
      });
    } catch (dbError: any) {
      console.error('Database Failure Log:', dbError.stack || dbError);
      return NextResponse.json({ success: false, error: 'Transcription was generated but failed to persist to the database.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, transcript: finalizedText });
    
  } catch (error: any) {
    // 7. Ultimate Crash Prevention
    console.error('Unhandled Transcription Route Fatal Error:', error.stack || error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error crashed the process.' },
      { status: 500 }
    );
  }
}
