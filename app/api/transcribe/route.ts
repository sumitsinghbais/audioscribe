import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySession } from '@/lib/session';
import prisma from '@/lib/db';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user securely
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in the environment.' }, { status: 500 });
    }

    // Parse the multipart/form-data
    const formData = await req.formData();
    const file = formData.get('audio') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided in the request.' }, { status: 400 });
    }

    // Convert file to a base64 string for Gemini inlineData
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine mimeType.
    const mimeType = file.type || 'audio/mp3';

    // Call Gemini Model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = 'Please carefully transcribe this audio. Return ONLY the exact transcription text, with no introductory or conversational text. If there is no speech, return an empty string.';
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const transcriptText = result.response.text();

    if (!transcriptText || transcriptText.trim() === '') {
       return NextResponse.json({ error: 'No speech detected in the audio file.' }, { status: 400 });
    }

    // Securely store the transcript text tied to the authenticated user.
    // The audio file is intentionally discarded here.
    await prisma.transcript.create({
      data: {
        content: transcriptText.trim(),
        userId: session.userId,
      }
    });

    return NextResponse.json({ text: transcriptText });
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred during transcription' },
      { status: 500 }
    );
  }
}
