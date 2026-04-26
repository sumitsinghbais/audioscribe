import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Valid session required to fetch history.' }, { status: 401 });
    }

    const transcripts = await prisma.transcript.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, transcripts });
  } catch (error: any) {
    console.error('Fetch Transcripts History Fatal Error:', error.stack || error);
    return NextResponse.json(
      { success: false, error: 'Failed to query database for transcript history.' },
      { status: 500 }
    );
  }
}
