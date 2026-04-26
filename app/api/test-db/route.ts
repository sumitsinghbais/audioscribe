import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Attempt to query the database
    // Using prisma.$queryRaw as a fundamental connection check, and count users
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful!', 
      data: {
        rawQueryResult: result,
        userCount
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to the database', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
