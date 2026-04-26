import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';

export default async function Dashboard() {
  const session = await verifySession();
  
  if (!session) {
    redirect('/login');
  }

  return <DashboardClient initialUsername={session.username} />;
}
