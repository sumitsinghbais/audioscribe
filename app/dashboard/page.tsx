import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Uploader from '@/components/Uploader';
import prisma from '@/lib/db';

export default async function Dashboard() {
  const session = await verifySession();
  if (!session) {
    redirect('/login');
  }

  // Fetch real transcripts for the user from the database
  const transcripts = await prisma.transcript.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1">
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
          Welcome, {session.username}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Upload audio to generate transcripts.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Uploader />
        </div>
        
        {/* Transcripts Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 shadow rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
                Your Transcripts
              </h3>
              <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                {transcripts.length} total
              </span>
            </div>
            
            <div className="px-6 py-5 flex-1 overflow-y-auto min-h-[300px]">
              {transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">No transcripts yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">
                    Get started by uploading an audio file using the panel on the left.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {transcripts.map((t) => (
                    <li key={t.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{t.content}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>{new Date(t.createdAt).toLocaleString()}</span>
                        </span>
                        <button className="text-primary hover:text-[#4338CA] transition-colors font-medium">
                          Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
