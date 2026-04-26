import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
        Welcome to <span className="text-primary dark:text-indigo-400">AudioScribe</span>
      </h1>
      <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
        A modern, full-stack Next.js application built with the App Router and styled completely with Tailwind CSS.
      </p>
      <div className="mt-10 flex space-x-4">
        <Link href="/dashboard" className="px-8 py-3 bg-primary hover:bg-[#4338CA] text-white rounded-lg font-semibold text-lg transition-all shadow-md hover:shadow-lg">
          Go to Dashboard
        </Link>
        <Link href="/login" className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-semibold text-lg transition-all shadow-sm hover:shadow-md">
          Sign In
        </Link>
      </div>
    </div>
  );
}
