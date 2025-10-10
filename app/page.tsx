'use client';

import { useState, useCallback } from 'react';
import YouTubePlayer from '@/components/YouTubePlayer';
import VideoMetadata from '@/components/VideoMetadata';
import Caption from '@/components/Caption';
import ClientWrapper from '@/components/ClientWrapper';
import { extractVideoId, isValidVideoId, getThumbnailUrl } from '@/utils/youtube';

/**
 * Main demo page for the YouTube Player
 * Using latest Next.js App Router patterns from Context7
 */
export default function HomePage() {
  const [currentVideoId, setCurrentVideoId] = useState('dQw4w9WgXcQ'); // Rick Roll as default
  const [inputUrl, setInputUrl] = useState('');
  const [playerEvents, setPlayerEvents] = useState<string[]>([]);
  const [showCaptions, setShowCaptions] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seekFunction, setSeekFunction] = useState<((time: number) => void) | null>(null);

  // Sample videos for quick testing (selected based on Context7 embedding patterns)
  const sampleVideos = [
    { id: 'M7lc1UVf-VE', title: 'Context7 Example Video', type: 'Test' }, // From Context7 docs
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo (First YouTube Video)', type: 'Historic' },
    { id: 'ScMzIvxBSi4', title: 'The Evolution of Dance', type: 'Classic' },
    { id: 'hFZFjoX2cGg', title: 'Dramatic Chipmunk', type: 'Meme' },
    { id: 'K2cYWfq--Nw', title: 'Sneezing Panda', type: 'Viral' },
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', type: 'Music' },
  ];

  // Log player events for debugging - using useCallback with proper dependencies
  const logEvent = useCallback((event: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${event}${data ? `: ${JSON.stringify(data)}` : ''}`;
    setPlayerEvents(prev => [logEntry, ...prev].slice(0, 10)); // Keep last 10 events
  }, []); // Empty dependency array since we use functional update

  // Handle URL input and video ID extraction
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = inputUrl.trim();
    
    if (!trimmedUrl) {
      alert('Please enter a YouTube URL or video ID');
      return;
    }
    
    const videoId = extractVideoId(trimmedUrl);
    
    if (videoId && isValidVideoId(videoId)) {
      setCurrentVideoId(videoId);
      setInputUrl('');
      logEvent('Video Changed', { videoId, originalUrl: trimmedUrl });
    } else {
      alert(`Unable to extract video ID from: "${trimmedUrl}"\n\nSupported formats:\n• https://www.youtube.com/watch?v=VIDEO_ID\n• https://youtu.be/VIDEO_ID\n• VIDEO_ID (11 characters)\n• YouTube Shorts, Embed URLs, etc.`);
    }
  };

  return (
    <ClientWrapper>
      <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
          Modern YouTube Player
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Built with Next.js 15, React 19, and TypeScript using the latest patterns from Context7
        </p>
        <p className="text-sm text-gray-400 max-w-xl mx-auto mt-2">
          💡 <strong>Tip:</strong> Add your YouTube API key to <code className="bg-gray-700 px-1 rounded">.env.local</code> to see rich video metadata below the player!
        </p>
        <div className="flex flex-wrap gap-2 justify-center text-sm">
          <span className="bg-blue-600 px-3 py-1 rounded-full">Next.js 15</span>
          <span className="bg-blue-500 px-3 py-1 rounded-full">React 19</span>
          <span className="bg-blue-400 px-3 py-1 rounded-full">TypeScript</span>
          <span className="bg-red-600 px-3 py-1 rounded-full">YouTube API</span>
          <span className="bg-green-600 px-3 py-1 rounded-full">Tailwind CSS</span>
        </div>
      </div>

      {/* Video URL Input */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Load YouTube Video</h2>
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            <strong>⚠️ Note:</strong> Some videos (especially music, Shorts, or copyrighted content) may not be embeddable due to YouTube's restrictions. 
            If a video fails to load, you'll see a "Watch on YouTube" button instead.
          </p>
        </div>
        <form onSubmit={handleUrlSubmit} className="flex gap-4">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or YouTube Shorts URL"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Load Video
          </button>
        </form>
      </div>

      {/* Quick Video Selection */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Sample Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => {
                setCurrentVideoId(video.id);
                logEvent('Sample Video Selected', { title: video.title });
              }}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                currentVideoId === video.id
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              }`}
            >
              <img
                src={getThumbnailUrl(video.id, 'medium')}
                alt={video.title}
                className="w-full aspect-video object-cover rounded mb-2"
                loading="lazy"
              />
              <p className="text-sm font-medium truncate">{video.title}</p>
              <p className="text-xs text-gray-400 mt-1">{video.type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* YouTube Player */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">YouTube Player</h2>
        <YouTubePlayer
          videoId={currentVideoId}
          config={{
            width: '100%',
            height: 500,
            autoplay: false,
            // Minimal config based on Context7 YouTube API docs to avoid embedding restrictions
          }}
          onReady={() => logEvent('Player Ready')}
          onPlay={() => logEvent('Play')}
          onPause={() => logEvent('Pause')}
          onEnd={() => logEvent('Video Ended')}
          onError={(error) => logEvent('Error', { error })}
          onTimeUpdate={(currentTime, duration) => {
            // Update current time for captions
            setCurrentTime(currentTime);
            // Only log every 10 seconds to avoid spam
            if (Math.floor(currentTime) % 10 === 0) {
              logEvent('Time Update', { currentTime: Math.floor(currentTime), duration: Math.floor(duration) });
            }
          }}
          onVolumeChange={(volume) => logEvent('Volume Change', { volume })}
          onPlaybackRateChange={(rate) => logEvent('Playback Rate Change', { rate })}
          onSeekRequest={(seekFn) => {
            console.log('Seek function received from player');
            // Use functional update to avoid recreating the function on every render
            setSeekFunction(() => seekFn);
          }}
          className="w-full"
        />
      </div>

      {/* Video Metadata */}
      <VideoMetadata videoId={currentVideoId} />

      {/* Transcript Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">📝 Video Transcript</h2>
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showCaptions 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {showCaptions ? 'Hide Transcript' : 'Show Transcript'}
          </button>
        </div>
        
        {showCaptions ? (
          <Caption
            videoId={currentVideoId}
            currentTime={currentTime}
            isVisible={true}
            onToggle={setShowCaptions}
            onSeekToTime={seekFunction || undefined}
            className=""
          />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg mb-2">📝</p>
            <p>Click "Show Transcript" to view synchronized captions for this video.</p>
            <p className="text-sm mt-2">Supports multiple languages when available.</p>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">🎮 Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Custom player controls with modern UI</li>
            <li>✅ Fullscreen support with API detection</li>
            <li>✅ Volume control with mute/unmute</li>
            <li>✅ Playback speed adjustment (0.25x - 2x)</li>
            <li>✅ Progress bar with seek functionality</li>
            <li>✅ Real-time time display (MM:SS format)</li>
            <li>✅ Video quality indicator</li>
            <li>✅ Error handling with user-friendly messages</li>
            <li>✅ Loading states and animations</li>
            <li>✅ Responsive design with Tailwind CSS</li>
            <li>✅ YouTube API integration for metadata</li>
            <li>✅ Rich video information display</li>
            <li>✅ Live video transcript/captions display</li>
            <li>✅ Time-synchronized caption highlighting</li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">🔧 Technical Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ TypeScript with full type safety</li>
            <li>✅ React 19 hooks (useState, useEffect, useCallback)</li>
            <li>✅ Custom hooks for state management</li>
            <li>✅ Performance optimizations (throttling, debouncing)</li>
            <li>✅ Modern Next.js App Router patterns</li>
            <li>✅ Client-side rendering with 'use client'</li>
            <li>✅ YouTube IFrame API integration</li>
            <li>✅ Cross-browser fullscreen API support</li>
            <li>✅ Accessible keyboard and mouse controls</li>
            <li>✅ Mobile-responsive design</li>
            <li>✅ YouTube Data API v3 integration</li>
            <li>✅ Server-side API routes for data fetching</li>
            <li>✅ YouTube Transcript API integration</li>
            <li>✅ Real-time caption synchronization</li>
            <li>✅ Clickable transcript navigation (jump to any segment)</li>
          </ul>
        </div>
      </div>

      {/* Event Log */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">📊 Player Events</h2>
        <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
          {playerEvents.length > 0 ? (
            <ul className="space-y-1 font-mono text-sm">
              {playerEvents.map((event, index) => (
                <li key={index} className="text-green-400">
                  {event}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No events logged yet</p>
          )}
        </div>
        <button
          onClick={() => setPlayerEvents([])}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Clear Events
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 space-y-2">
        <p>
          Built with modern web technologies and patterns from{' '}
          <a 
            href="https://context7.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Context7
          </a>
        </p>
        <p className="text-sm">
          Next.js {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'} Build
        </p>
      </div>
      </div>
    </ClientWrapper>
  );
}