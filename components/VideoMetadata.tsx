'use client';

import { useState, useEffect } from 'react';
import { YouTubeVideoDetails } from '@/lib/youtubeApi';

interface VideoMetadataProps {
  videoId: string;
  className?: string;
}

/**
 * Component to display YouTube video metadata
 * Uses the YouTube Data API v3 through our API route
 */
export default function VideoMetadata({ videoId, className = '' }: VideoMetadataProps) {
  const [videoDetails, setVideoDetails] = useState<YouTubeVideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideoDetails() {
      if (!videoId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/youtube/video/${videoId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch video details');
        }

        const data = await response.json();
        setVideoDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video details');
        console.error('Error fetching video metadata:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideoDetails();
  }, [videoId]);

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-white/10 rounded w-1/3 mb-3"></div>
          <div className="h-20 bg-white/10 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-yellow-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 ${className}`}>
        <h3 className="text-yellow-400 font-semibold mb-3">📋 YouTube API Setup Required</h3>
        <p className="text-yellow-200 text-sm mb-3">{error}</p>
        <div className="bg-yellow-800/20 p-3 rounded-lg">
          <p className="text-yellow-100 text-sm font-medium mb-2">To enable rich video metadata:</p>
          <ol className="text-yellow-200 text-xs space-y-1 list-decimal list-inside">
            <li>Get a YouTube Data API v3 key from <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Google Cloud Console</a></li>
            <li>Enable the YouTube Data API v3 in your project</li>
            <li>Add the key to your <code className="bg-yellow-700 px-1 rounded">.env.local</code> file:</li>
          </ol>
          <pre className="text-yellow-300 text-xs mt-2 bg-yellow-800/30 p-2 rounded">YOUTUBE_API_KEY=your_api_key_here</pre>
          <p className="text-yellow-200 text-xs mt-2">The player will work without the API key, but won't show video details.</p>
        </div>
      </div>
    );
  }

  if (!videoDetails) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 200) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 ${className}`}>
      <div className="space-y-4">
        {/* Title and Channel */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2">
            {videoDetails.title}
          </h2>
          <p className="text-lg text-gray-300">
            by <span className="font-semibold text-red-400">{videoDetails.channelTitle}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">👁️</span>
            <span className="text-white font-medium">{videoDetails.viewCount}</span>
            <span className="text-gray-400">views</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">👍</span>
            <span className="text-white font-medium">{videoDetails.likeCount}</span>
            <span className="text-gray-400">likes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">📅</span>
            <span className="text-white font-medium">{formatDate(videoDetails.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">⏱️</span>
            <span className="text-white font-medium">{Math.floor(parseInt(videoDetails.duration) / 60)}:{(parseInt(videoDetails.duration) % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Description */}
        {videoDetails.description && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {truncateDescription(videoDetails.description)}
            </p>
          </div>
        )}

        {/* Tags */}
        {videoDetails.tags && videoDetails.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {videoDetails.tags.slice(0, 10).map((tag, index) => (
                <span 
                  key={index}
                  className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm hover:bg-gray-600 transition-colors"
                >
                  #{tag}
                </span>
              ))}
              {videoDetails.tags.length > 10 && (
                <span className="text-gray-400 text-sm self-center">
                  +{videoDetails.tags.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Thumbnail Preview */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Thumbnail</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(videoDetails.thumbnails).map(([quality, thumbnail]) => (
              <div key={quality} className="text-center">
                <img
                  src={thumbnail.url}
                  alt={`${quality} thumbnail`}
                  className="w-full rounded border border-gray-600 mb-1"
                  loading="lazy"
                />
                <p className="text-xs text-gray-400 capitalize">
                  {quality} ({thumbnail.width}x{thumbnail.height})
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}