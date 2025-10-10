'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CaptionProps, TranscriptData, TranscriptSegment } from '@/types/youtube';

/**
 * Caption Component with YouTube Transcript Integration
 * Built with Context7 patterns and YouTube transcript API
 */
export default function Caption({
  videoId,
  currentTime,
  isVisible = false,
  className = '',
  onToggle,
  onSeekToTime
}: CaptionProps) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(true); // Default to full transcript
  
  // Refs for auto-scroll functionality
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLButtonElement>(null);
  const segmentRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  // Function to fetch transcript (Japanese preferred)
  const fetchTranscript = async () => {
    if (!videoId) return;

    setLoading(true);
    setError(null);
    
    try {
      // Try Python-based Japanese API first for reliable Japanese transcript support
      console.log('Fetching Japanese transcript via Python API...');
      const pythonResponse = await fetch(`/api/youtube/transcript-python/${videoId}`);
      const pythonData: TranscriptData = await pythonResponse.json();
      
      if (pythonResponse.ok && pythonData.available && pythonData.isJapanese) {
        console.log('Python API successful - Japanese transcript found:', pythonData.language);
        setTranscript(pythonData);
        return;
      }
      
      console.log('Python API result:', pythonData.available ? 'No Japanese transcripts' : 'Failed');
      
      // If Python API found no Japanese transcripts, show clear error
      if (pythonResponse.ok && !pythonData.available) {
        throw new Error(pythonData.message || 'No Japanese transcripts available for this video');
      }
      
      // If Python API completely failed, throw error (no English fallback)
      throw new Error('Failed to fetch Japanese transcript. This application requires Japanese captions.');
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transcript when videoId changes
  useEffect(() => {
    fetchTranscript();
  }, [videoId]);

  // Auto-scroll to current segment when it changes
  useEffect(() => {
    if (!currentSegment || !showFullTranscript) return;
    
    const segmentKey = `${currentSegment.start}`;
    const segmentElement = segmentRefs.current[segmentKey];
    
    if (segmentElement && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      const elementTop = segmentElement.offsetTop;
      const elementHeight = segmentElement.offsetHeight;
      const containerHeight = container.offsetHeight;
      const containerScrollTop = container.scrollTop;
      
      // Check if element is not fully visible
      const isElementAboveViewport = elementTop < containerScrollTop + 100;
      const isElementBelowViewport = elementTop + elementHeight > containerScrollTop + containerHeight - 100;
      
      if (isElementAboveViewport || isElementBelowViewport) {
        // Smooth scroll to center the active segment
        const scrollPosition = elementTop - containerHeight / 2 + elementHeight / 2;
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [currentSegment, showFullTranscript]);

  // Find current caption segment based on video time
  const currentSegment = useMemo(() => {
    if (!transcript?.segments) return null;
    
    return transcript.segments.find(segment => 
      currentTime >= segment.start && currentTime <= segment.end
    );
  }, [transcript, currentTime]);

  // Get upcoming segments for preview
  const upcomingSegments = useMemo(() => {
    if (!transcript?.segments) return [];
    
    return transcript.segments
      .filter(segment => segment.start > currentTime)
      .slice(0, 3);
  }, [transcript, currentTime]);

  if (loading) {
    return (
      <div className={`caption-component ${className}`}>
        <div className="flex items-center justify-center p-4 bg-black/70 rounded-lg">
          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          <span className="text-white text-sm">Loading transcript...</span>
        </div>
      </div>
    );
  }

  if (error || !transcript?.available) {
    return (
      <div className={`caption-component ${className}`}>
        <div className="p-4 bg-gray-800/70 rounded-lg text-center">
          <p className="text-yellow-300 text-sm mb-2">⚠️ Transcript not available</p>
          <p className="text-gray-300 text-xs">
            {error || transcript?.message || 'This video does not have transcripts enabled'}
          </p>
        </div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className={`caption-component ${className}`}>
      {/* Caption Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm font-medium flex items-center gap-1">
            {transcript.isJapanese ? '🇯🇵' : '🇺🇸'} 
            {transcript.language || 'Unknown'}
            {transcript.isGenerated && <span className="text-xs opacity-60">(auto)</span>}
          </span>
          {transcript.source && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded">
              Python API
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="text-white/70 hover:text-white text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-colors"
            title={showFullTranscript ? "Show Current Only" : "Show Full Transcript"}
          >
            {showFullTranscript ? "Current" : "Full"}
          </button>
        </div>
      </div>

      {/* Current Caption Display */}
      {!showFullTranscript && (
        <div className="space-y-2">
          {/* Active Caption */}
          {currentSegment && (
            <div className="p-3 bg-black/80 rounded-lg border-l-4 border-red-500">
              <p className="text-white text-sm leading-relaxed">
                {currentSegment.text}
              </p>
              <div className="flex justify-between items-center mt-2 text-xs text-white/50">
                <span>
                  {formatTime(currentSegment.start)} - {formatTime(currentSegment.end)}
                </span>
                <span className="bg-red-500 px-1 rounded text-white">LIVE</span>
              </div>
            </div>
          )}

          {/* Upcoming Captions Preview */}
          {upcomingSegments.length > 0 && (
            <div className="space-y-1">
              <p className="text-white/60 text-xs font-medium">Coming up:</p>
              {upcomingSegments.map((segment, index) => (
                <button
                  key={`${segment.start}-${index}`}
                  onClick={() => onSeekToTime?.(segment.start)}
                  className="w-full text-left p-2 bg-white/5 hover:bg-white/10 rounded text-white/70 hover:text-white text-xs transition-colors cursor-pointer"
                  title={`Jump to ${formatTime(segment.start)}`}
                >
                  <span className="text-white/40 mr-2">
                    {formatTime(segment.start)}
                  </span>
                  {segment.text.substring(0, 60)}
                  {segment.text.length > 60 && '...'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Transcript View */}
      {showFullTranscript && (
        <div 
          ref={transcriptContainerRef}
          className="max-h-80 overflow-y-auto bg-black/60 rounded-lg p-4 space-y-1 border border-white/20"
        >
          <div className="mb-3 text-white/70 text-sm flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-sm pb-2 border-b border-white/10">
            <span className="font-medium">Full Transcript ({transcript.totalSegments} segments)</span>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded">
                👆 Click to jump
              </span>
              <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">
                📍 Auto-scroll
              </span>
            </div>
          </div>
          {transcript.segments?.map((segment, index) => {
            const isActive = currentTime >= segment.start && currentTime <= segment.end;
            const isPast = currentTime > segment.end;
            
            return (
              <button
                key={`${segment.start}-${index}`}
                ref={(el) => {
                  const segmentKey = `${segment.start}`;
                  segmentRefs.current[segmentKey] = el;
                  if (isActive) activeSegmentRef.current = el;
                }}
                onClick={() => {
                  console.log(`Jumping to segment: ${formatTime(segment.start)} - "${segment.text.substring(0, 30)}..."`);
                  onSeekToTime?.(segment.start);
                }}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-red-500/30 border-red-500 text-white shadow-lg transform scale-[1.02]' 
                    : isPast 
                    ? 'text-white/50 hover:text-white/80 border-white/10 hover:border-white/20 hover:bg-white/5' 
                    : 'text-white/80 hover:text-white border-white/10 hover:border-white/30 hover:bg-white/10'
                }`}
                title={`Jump to ${formatTime(segment.start)}: ${segment.text.substring(0, 50)}...`}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-xs min-w-[45px] mt-0.5 font-mono ${
                    isActive ? 'text-red-300' : 'text-white/40'
                  }`}>
                    {formatTime(segment.start)}
                  </span>
                  <span className="leading-relaxed flex-1">{segment.text}</span>
                  {isActive && <span className="text-xs text-red-400 mt-0.5">▶</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Language Warning */}
      {transcript.languageNote && (
        <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-200 text-xs">
            ⚠️ {transcript.languageNote}
          </p>
        </div>
      )}
      
      {/* Transcript Stats */}
      <div className="mt-2 text-xs text-white/40 text-center">
        {transcript.totalSegments} segments • {formatTime(transcript.totalDuration || 0)} total
        {transcript.language && (
          <>
            <br />
            Language: {transcript.language}
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to format time in MM:SS format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}