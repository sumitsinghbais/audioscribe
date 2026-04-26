import Link from 'next/link';
import { verifySession } from '@/lib/session';
import { logout } from '@/app/actions/auth';

export default async function Navbar() {
  const session = await verifySession();

  return (
    <nav className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-primary dark:text-indigo-400">
              AudioScribe
            </Link>
          </div>
          <div className="flex space-x-8 items-center">
            <Link href="/dashboard" className="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Dashboard
            </Link>
            {session ? (
              <form action={logout}>
                <button type="submit" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer">
                  Logout
                </button>
              </form>
            ) : (
              <Link href="/login" className="bg-primary hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
