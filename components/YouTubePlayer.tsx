'use client';

import React, { useState, useEffect, useRef } from 'react';
import { YouTubePlayerProps } from '@/types/youtube';
import { useYouTubePlayer } from '@/lib/useYouTubePlayer';
import { 
  formatTime, 
  getThumbnailUrl, 
  getQualityDisplayName,
  supportsFullscreen,
  requestFullscreen,
  exitFullscreen,
  isFullscreen 
} from '@/utils/youtube';

/**
 * Modern YouTube Player Component
 * Built with Next.js 15, React 19, and TypeScript patterns from Context7
 */
export default function YouTubePlayer({ 
  videoId, 
  config = {}, 
  onReady,
  onPlay,
  onPause,
  onEnd,
  onError,
  onTimeUpdate,
  onVolumeChange,
  onPlaybackRateChange,
  onQualityChange,
  onSeekRequest,
  className = ''
}: YouTubePlayerProps) {
  const { containerRef, state, actions, isReady } = useYouTubePlayer(videoId, config);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(isFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Trigger callback events using useRef to avoid dependency issues
  const onReadyRef = useRef(onReady);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onErrorRef = useRef(onError);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  
  // Update refs when callbacks change
  useEffect(() => {
    onReadyRef.current = onReady;
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onErrorRef.current = onError;
    onTimeUpdateRef.current = onTimeUpdate;
  });

  useEffect(() => {
    if (isReady && onReadyRef.current) {
      onReadyRef.current();
    }
  }, [isReady]);

  useEffect(() => {
    if (state.playing && onPlayRef.current) {
      onPlayRef.current();
    } else if (!state.playing && onPauseRef.current) {
      onPauseRef.current();
    }
  }, [state.playing]);

  useEffect(() => {
    if (state.error && onErrorRef.current) {
      onErrorRef.current(state.error);
    }
  }, [state.error]);

  useEffect(() => {
    if (onTimeUpdateRef.current) {
      onTimeUpdateRef.current(state.currentTime, state.duration);
    }
  }, [state.currentTime, state.duration]);

  // Enhanced fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!supportsFullscreen()) return;
    
    if (isFullscreenActive) {
      exitFullscreen();
    } else if (containerRef.current) {
      requestFullscreen(containerRef.current);
    }
  };

  // Custom control handlers
  const handlePlayPause = () => {
    if (state.playing) {
      actions.pause();
    } else {
      actions.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseInt(e.target.value);
    actions.setVolume(volume);
    if (onVolumeChange) onVolumeChange(volume);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseInt(e.target.value) / 100) * state.duration;
    actions.seekTo(time);
  };

  const handlePlaybackRateChange = (rate: number) => {
    actions.setPlaybackRate(rate);
    if (onPlaybackRateChange) onPlaybackRateChange(rate);
  };

  // Handle external seek requests (e.g., from transcript navigation)
  const handleExternalSeek = (time: number) => {
    console.log('External seek request to:', time);
    if (isReady && actions.seekTo) {
      actions.seekTo(time);
    }
  };

  // Expose seek function via callback - only once when player is ready
  useEffect(() => {
    if (onSeekRequest && isReady) {
      onSeekRequest(handleExternalSeek);
    }
  }, [isReady]); // Remove onSeekRequest from dependencies to avoid loops

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div 
      className={`youtube-player relative bg-black rounded-lg overflow-hidden shadow-xl ${className} ${
        isFullscreenActive ? 'fixed inset-0 z-50' : ''
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Player Container */}
      <div 
        ref={containerRef}
        className={`w-full ${isFullscreenActive ? 'h-full' : 'aspect-video'}`}
        style={{
          minHeight: isFullscreenActive ? '100vh' : config.height || '360px'
        }}
      />

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-youtube-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-medium">Loading YouTube Player...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/90">
          <div className="text-center p-6 bg-red-800 rounded-lg max-w-md mx-4">
            <div className="text-red-200 text-4xl mb-4">⚠️</div>
            <h3 className="text-white font-bold text-lg mb-2">Playback Error</h3>
            <p className="text-red-100 mb-4">{state.error}</p>
            
            {/* Fallback options for embedding errors (101/150 codes) */}
            {(state.error.includes('not allow embedding') || state.error.includes('not allowed in embedded player')) && (
              <div className="space-y-3">
                <p className="text-red-200 text-sm">This video has embedding restrictions.</p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Watch on YouTube
                  </a>
                  <button
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      {isReady && showControls && (
        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleFullscreenToggle}
              className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
              title={isFullscreenActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreenActive ? '⊠' : '⛶'}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`
                }}
              />
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-between text-white">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="bg-youtube-red hover:bg-red-700 text-white p-3 rounded-full transition-colors"
                  title={state.playing ? 'Pause' : 'Play'}
                >
                  {state.playing ? '⏸️' : '▶️'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={state.muted ? actions.unmute : actions.mute}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                    title={state.muted ? 'Unmute' : 'Mute'}
                  >
                    {state.muted ? '🔇' : '🔊'}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.muted ? 0 : state.volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-sm font-mono">
                  {formatTime(state.currentTime)} / {formatTime(state.duration)}
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                {/* Quality Selector */}
                <div className="text-sm bg-black/50 px-2 py-1 rounded">
                  {getQualityDisplayName(state.quality)}
                </div>

                {/* Playback Rate */}
                <select
                  value={state.playbackRate}
                  onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                  className="bg-black/50 text-white text-sm px-2 py-1 rounded border-none cursor-pointer"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
