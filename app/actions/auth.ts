'use server';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function login(state: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  let user;

  try {
    // Attempt to automatically create the admin user if logging in as admin and it doesn't exist.
    if (username === 'admin') {
      const adminExists = await prisma.user.findUnique({
        where: { username: 'admin' },
      });

      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        user = await prisma.user.create({
          data: {
            username: 'admin',
            password: hashedPassword,
          },
        });
      } else {
        user = adminExists;
      }
    } else {
      user = await prisma.user.findUnique({
        where: { username },
      });
    }
  } catch (error) {
    console.error('Database query failed during login:', error);
    return { error: 'Database connection failed. Ensure database is deployed and migrated.' };
  }

  if (!user) {
    return { error: 'Invalid username or password' };
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return { error: 'Authentication processing error.' };
  }

  if (!isPasswordValid) {
    return { error: 'Invalid username or password' };
  }

  try {
    await createSession(user.id, user.username);
  } catch (error) {
    console.error('Session creation failed:', error);
    return { error: 'Could not create user session.' };
  }

  // Redirect must happen outside the try/catch blocks because it works by throwing an error in Next.js
  redirect('/dashboard');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
