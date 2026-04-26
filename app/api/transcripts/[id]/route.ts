import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import prisma from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Transcript ID is required' }, { status: 400 });
    }

    // Verify the transcript belongs to the authenticated user before deleting
    const transcript = await prisma.transcript.findUnique({
      where: { id },
    });

    if (!transcript) {
      return NextResponse.json({ success: false, error: 'Transcript not found' }, { status: 404 });
    }

    if (transcript.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.transcript.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete transcript error:', error.stack || error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transcript' },
      { status: 500 }
    );
  }
}
