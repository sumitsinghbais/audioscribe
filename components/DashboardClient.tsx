'use client';

import { useState, useEffect, useRef } from 'react';

type Transcript = {
  id: string;
  content: string;
  createdAt: string;
};

export default function DashboardClient({ initialUsername }: { initialUsername: string }) {
  // Transcripts State
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  
  // Uploader State
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy-to-clipboard State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTranscripts = async () => {
    try {
      const res = await fetch('/api/transcripts');
      const data = await res.json();
      if (data.success) {
        setTranscripts(data.transcripts);
      } else {
        console.error(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setAudioDuration(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('audio/')) {
      setError('Please select a valid audio file (mp3, wav, m4a, etc).');
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Audio file is too large. Maximum size allowed is 5MB.');
      setFile(null);
      return;
    }

    const audio = new Audio(URL.createObjectURL(selectedFile));
    audio.onloadedmetadata = () => {
      if (audio.duration > 60) {
        setError('Audio must be less than 1 minute long.');
        setFile(null);
      } else {
        setFile(selectedFile);
        const mins = Math.floor(audio.duration / 60);
        const secs = Math.floor(audio.duration % 60);
        setAudioDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
      URL.revokeObjectURL(audio.src);
    };
    audio.onerror = () => {
       setError('Failed to load audio file duration.');
       setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to transcribe audio.');
      }

      setFile(null);
      setAudioDuration(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchTranscripts();
    } catch (err: any) {
       setError(err.message || 'An error occurred during upload.');
    } finally {
       setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1">
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
          Welcome, {initialUsername}
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Upload audio to generate transcripts.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 shadow rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Audio</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 5MB (Audio only)</p>
                  </div>
                  <input id="dropzone-file" type="file" accept="audio/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isUploading} />
                </label>
              </div>

              {file && !error && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">{file.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB {audioDuration ? `• ${audioDuration}` : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => { setFile(null); setAudioDuration(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 rounded-md transition-colors flex-shrink-0 ml-2" disabled={isUploading}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 flex items-center space-x-2">
                   <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <button onClick={handleUpload} disabled={!file || isUploading} className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-[#4338CA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {isUploading ? (
                  <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Transcribing...</>
                ) : 'Upload & Transcribe'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Transcripts Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 shadow rounded-xl border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white">Your Transcripts</h3>
              {!isFetchingHistory && transcripts.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">{transcripts.length} total</span>
              )}
            </div>
            
            <div className="px-6 py-5 flex-1 overflow-y-auto min-h-[300px]">
              {isFetchingHistory ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-100 dark:border-gray-700">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="flex justify-between mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : transcripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">No transcripts yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-[250px]">Upload an audio file on the left to start generating transcripts.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {transcripts.map((t) => (
                    <li key={t.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pr-8 whitespace-pre-wrap">{t.content}</p>
                      <button onClick={() => handleCopy(t.id, t.content)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Copy to clipboard">
                        {copiedId === t.id ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        )}
                      </button>
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>{new Date(t.createdAt).toLocaleString()}</span>
                        </span>
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
