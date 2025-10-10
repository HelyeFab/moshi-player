'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  YouTubePlayerState, 
  YouTubePlayerConfig, 
  YouTubePlayerActions,
  YouTubePlayerStateEnum,
  YouTubePlayerError
} from '@/types/youtube';
import { loadYouTubeAPI, throttle } from '@/utils/youtube';

/**
 * Custom hook for YouTube player state management
 * Uses modern React patterns from Context7 documentation
 */
export function useYouTubePlayer(videoId: string, config: Partial<YouTubePlayerConfig> = {}) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);

  // Player state using useState hook pattern from Context7
  const [state, setState] = useState<YouTubePlayerState>({
    playing: false,
    muted: config.muted || false,
    volume: 100,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    quality: 'auto',
    fullscreen: false,
    buffered: 0,
    error: null,
  });

  // Throttled state update function for performance - stabilized
  const updateCurrentTime = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration() || 0;
      
      setState(prev => ({
        ...prev,
        currentTime,
        duration,
      }));
    }
  }, []);

  // Load YouTube API on mount - using useEffect pattern from Context7
  useEffect(() => {
    loadYouTubeAPI().then(() => {
      setIsAPIReady(true);
    });
  }, []);

  // Initialize player when API is ready - fix dependencies to prevent infinite loop
  useEffect(() => {
    if (!isAPIReady || !containerRef.current || playerRef.current) return;

    // YouTube IFrame Player API configuration based on Context7 official docs
    const playerConfig = {
      height: config.height || 360,
      width: config.width || 640,
      videoId,
      playerVars: {
        // Essential parameters from Context7 YouTube API docs
        autoplay: config.autoplay ? 1 : 0,
        enablejsapi: 1,
        // Minimal configuration to avoid error 150/101 (embedding restrictions)
        playsinline: 1,
      },
      events: {
        onReady: (event: any) => {
          console.log('YouTube player ready for video:', videoId);
          setState(prev => ({ ...prev, error: null }));
        },
        onStateChange: (event: any) => {
          const playerState = event.data;
          setState(prev => ({
            ...prev,
            playing: playerState === YouTubePlayerStateEnum.PLAYING,
          }));

          if (playerState === YouTubePlayerStateEnum.PLAYING) {
            updateCurrentTime();
          }
        },
        onPlaybackQualityChange: (event: any) => {
          setState(prev => ({ ...prev, quality: event.data }));
        },
        onPlaybackRateChange: (event: any) => {
          setState(prev => ({ ...prev, playbackRate: event.data }));
        },
        onError: (event: any) => {
          console.error('YouTube player error for video:', videoId, 'Error code:', event.data);
          
          // Error codes based on Context7 official YouTube API documentation
          const errorMessages = {
            2: 'Invalid parameter value',
            5: 'Content not playable in HTML5 player',
            100: 'Video not found or has been removed',
            101: 'Video owner does not allow embedding',
            150: 'Video owner does not allow embedding (same as 101)', // Context7 docs confirm 150 = 101
          };

          const errorMessage = errorMessages[event.data as number] || `YouTube player error: ${event.data}`;
          console.error('Error message:', errorMessage);
          
          setState(prev => ({
            ...prev,
            error: errorMessage,
          }));
        },
      },
    };

    playerRef.current = new (window as any).YT.Player(containerRef.current, playerConfig);

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isAPIReady, videoId]); // Remove problematic dependencies

  // Separate effect for time updates to prevent infinite loop
  useEffect(() => {
    let timeUpdateInterval: NodeJS.Timeout;
    
    if (state.playing && playerRef.current) {
      timeUpdateInterval = setInterval(() => {
        updateCurrentTime();
      }, 1000);
    }

    return () => {
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
    };
  }, [state.playing, updateCurrentTime]);

  // Player actions object using useCallback for performance
  const actions: YouTubePlayerActions = {
    play: useCallback(() => {
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }
    }, []),

    pause: useCallback(() => {
      if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    }, []),

    stop: useCallback(() => {
      if (playerRef.current?.stopVideo) {
        playerRef.current.stopVideo();
      }
    }, []),

    seekTo: useCallback((seconds: number) => {
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    }, []),

    setVolume: useCallback((volume: number) => {
      if (playerRef.current?.setVolume) {
        playerRef.current.setVolume(Math.max(0, Math.min(100, volume)));
        setState(prev => ({ ...prev, volume: Math.max(0, Math.min(100, volume)) }));
      }
    }, []),

    mute: useCallback(() => {
      if (playerRef.current?.mute) {
        playerRef.current.mute();
        setState(prev => ({ ...prev, muted: true }));
      }
    }, []),

    unmute: useCallback(() => {
      if (playerRef.current?.unMute) {
        playerRef.current.unMute();
        setState(prev => ({ ...prev, muted: false }));
      }
    }, []),

    setPlaybackRate: useCallback((rate: number) => {
      if (playerRef.current?.setPlaybackRate) {
        playerRef.current.setPlaybackRate(rate);
      }
    }, []),

    toggleFullscreen: useCallback(() => {
      // This would integrate with the fullscreen utils
      setState(prev => ({ ...prev, fullscreen: !prev.fullscreen }));
    }, []),

    loadVideoById: useCallback((newVideoId: string, startSeconds?: number) => {
      if (playerRef.current?.loadVideoById) {
        playerRef.current.loadVideoById(newVideoId, startSeconds || 0);
      }
    }, []),

    loadVideoByUrl: useCallback((url: string, startSeconds?: number) => {
      if (playerRef.current?.loadVideoByUrl) {
        playerRef.current.loadVideoByUrl(url, startSeconds || 0);
      }
    }, []),
  };

  return {
    containerRef,
    state,
    actions,
    isReady: isAPIReady && !!playerRef.current,
  };
}