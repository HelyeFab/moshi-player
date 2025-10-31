'use client'

import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react'

export default function Home() {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoId, setVideoId] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const playerRef = useRef<any>(null)
  const [isAPIReady, setIsAPIReady] = useState(false)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const musicImages = [
    '/music/ape.png',
    '/music/listen.png',
    '/music/music.png',
    '/music/music (1).png',
    '/music/tiger.png',
    '/music/unicorn.png',
    '/music/unicorn (1).png',
    '/music/youtube.png',
    '/music/youtube (1).png',
    '/music/youtube (2).png',
  ]

  // Auto-rotate carousel
  useEffect(() => {
    if (!videoId) {
      console.log('🎨 YT-PLAYER: Carousel initialized with', musicImages.length, 'images')
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => {
          const newIndex = (prev + 1) % musicImages.length
          console.log('🎨 YT-PLAYER: Carousel rotating to image', newIndex + 1, '/', musicImages.length)
          return newIndex
        })
      }, 3000)
      return () => {
        console.log('🎨 YT-PLAYER: Carousel stopped')
        clearInterval(interval)
      }
    }
  }, [videoId, musicImages.length])

  // Detect if we're in an iframe
  useEffect(() => {
    setIsEmbedded(window.self !== window.top)
  }, [])

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      // @ts-ignore
      window.onYouTubeIframeAPIReady = () => {
        setIsAPIReady(true)
      }
    } else if ((window as any).YT && (window as any).YT.Player) {
      setIsAPIReady(true)
    }
  }, [])

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : ''
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = extractVideoId(videoUrl)
    if (id) {
      setVideoId(id)
    } else {
      alert('Please enter a valid YouTube URL')
    }
  }

  // Initialize YouTube Player when API is ready and videoId changes
  useEffect(() => {
    if (!isAPIReady || !videoId) return

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            // Broadcast ready state to parent
            window.parent.postMessage({
              type: 'PLAYER_READY',
              videoId: videoId
            }, '*')
          },
          onStateChange: (event: any) => {
            const state = event.data
            const isPlaying = state === (window as any).YT.PlayerState.PLAYING
            setIsPlaying(isPlaying)

            // Broadcast state change to parent
            window.parent.postMessage({
              type: 'STATE_CHANGE',
              state: state,
              isPlaying: isPlaying
            }, '*')
          }
        }
      })
    }

    // Small delay to ensure DOM is ready
    setTimeout(initPlayer, 100)

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [isAPIReady, videoId])

  // Broadcast time updates
  useEffect(() => {
    if (!playerRef.current) return

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime()
        const duration = playerRef.current.getDuration()
        setCurrentTime(time)

        window.parent.postMessage({
          type: 'TIME_UPDATE',
          currentTime: time,
          duration: duration
        }, '*')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying])

  // Listen for commands from parent window (Brains)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // SECURITY: Validate origin - whitelist trusted parent domains
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://brains-d2764.web.app',
        'https://brains-d2764.firebaseapp.com',
        // Add your production Brains app domains here
      ]

      // Reject messages from untrusted origins
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('[YT-Player Security] Rejected message from untrusted origin:', event.origin)
        return
      }

      // Validate message structure
      if (!event.data || typeof event.data !== 'object') {
        console.warn('[YT-Player Security] Invalid message data structure')
        return
      }

      const { type, value } = event.data

      // Validate message type
      if (!type || typeof type !== 'string') {
        console.warn('[YT-Player Security] Invalid message type')
        return
      }

      // LOAD_VIDEO can run without a player (it creates one)
      if (type === 'LOAD_VIDEO') {
        if (typeof value === 'string') {
          setVideoUrl(value)
          const id = extractVideoId(value)
          if (id) {
            setVideoId(id)
          }
        }
        return
      }

      // All other commands require an active player
      if (!playerRef.current) {
        console.warn('[YT-Player] Player not ready for command:', type)
        return
      }

      switch (type) {
        case 'PLAY':
          playerRef.current.playVideo()
          break
        case 'PAUSE':
          playerRef.current.pauseVideo()
          break
        case 'SEEK':
          if (typeof value === 'number') {
            playerRef.current.seekTo(value, true)
          }
          break
        case 'SET_VOLUME':
          if (typeof value === 'number') {
            playerRef.current.setVolume(value)
          }
          break
        case 'MUTE':
          playerRef.current.mute()
          break
        case 'UNMUTE':
          playerRef.current.unMute()
          break
        default:
          console.warn('[YT-Player] Unknown command type:', type)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // If embedded, show only the video player
  if (isEmbedded) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        {videoId ? (
          <div className="w-full h-full">
            <div id="yt-player" className="w-full h-full"></div>
          </div>
        ) : (
          <div className="text-center p-8 max-w-md">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-pink-500 rounded-full opacity-20 blur-2xl absolute inset-0 animate-pulse"></div>
                <svg
                  className="w-32 h-32 relative z-10 text-red-500/80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              No Video Loaded
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Paste a YouTube URL in the controls above to start watching
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>Powered by YouTube</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Standard standalone mode - show full UI
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">YT Player</h1>
            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
              v2.1.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* URL Input */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Enter YouTube URL</h2>
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <Button type="submit">Load Video</Button>
            </form>
          </div>

          {/* Video Player */}
          {videoId && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Video Player</h2>
              <div className="aspect-video rounded-lg overflow-hidden border">
                <div id="yt-player" className="w-full h-full"></div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isPlaying) {
                      playerRef.current?.pauseVideo()
                    } else {
                      playerRef.current?.playVideo()
                    }
                  }}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    Playing: YouTube Video {videoId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Time: {Math.floor(currentTime)}s
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🎥 YouTube Integration</h3>
              <p className="text-muted-foreground">
                Load and play YouTube videos with a clean, modern interface
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🎮 Remote Control</h3>
              <p className="text-muted-foreground">
                postMessage API for external control from parent window
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🎯 Clean Interface</h3>
              <p className="text-muted-foreground">
                Distraction-free video viewing experience
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🌙 Dark Mode</h3>
              <p className="text-muted-foreground">
                Toggle between light and dark themes
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-muted-foreground">
            <p>YT Player - Modern YouTube Player with Remote Control</p>
            <p className="text-sm mt-2">Built with Next.js, React, and Tailwind CSS</p>
          </div>
        </div>
      </main>
    </div>
  )
}
