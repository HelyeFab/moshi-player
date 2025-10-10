export interface YouTubePlayerState {
  playing: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playbackRate: number;
  quality: string;
  fullscreen: boolean;
  buffered: number;
  error: string | null;
}

export interface YouTubePlayerConfig {
  videoId: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  start?: number;
  end?: number;
  quality?: 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres' | 'auto';
  cc_lang_pref?: string;
  cc_load_policy?: 0 | 1;
  color?: 'red' | 'white';
  disablekb?: boolean;
  enablejsapi?: boolean;
  fs?: boolean;
  hl?: string;
  iv_load_policy?: 1 | 3;
  modestbranding?: boolean;
  origin?: string;
  playlist?: string;
  playsinline?: boolean;
  rel?: boolean;
}

export interface YouTubePlayerActions {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  loadVideoByUrl: (url: string, startSeconds?: number) => void;
}

export interface YouTubePlayerProps {
  videoId: string;
  config?: Partial<YouTubePlayerConfig>;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onVolumeChange?: (volume: number) => void;
  onPlaybackRateChange?: (rate: number) => void;
  onQualityChange?: (quality: string) => void;
  onSeekRequest?: (seekFunction: (time: number) => void) => void;
  className?: string;
}

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  author: string;
  views: number;
  uploadDate: string;
}

// YouTube Player API Events
export type YouTubePlayerEvent = 
  | 'ready'
  | 'statechange'
  | 'playbackqualitychange'
  | 'playbackratechange'
  | 'error'
  | 'apichange';

// YouTube Player States
export enum YouTubePlayerStateEnum {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

// YouTube Player Errors
export enum YouTubePlayerError {
  INVALID_PARAM = 2,
  HTML5_ERROR = 5,
  VIDEO_NOT_FOUND = 100,
  VIDEO_NOT_ALLOWED = 101,
  VIDEO_NOT_ALLOWED_DISGUISE = 150,
}

// Transcript types based on Context7 youtube-transcript-api documentation
export interface TranscriptSegment {
  start: number;
  duration: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  available: boolean;
  videoId: string;
  title: string;
  language?: string;
  languageCode?: string;
  isJapanese?: boolean;
  isGenerated?: boolean;
  availableLanguages?: string[];
  languageNote?: string;
  segments?: TranscriptSegment[];
  totalSegments?: number;
  totalDuration?: number;
  message?: string;
  error?: string;
  source?: string;
  method?: string;
  fetchedAt?: string;
  forcedJapanese?: boolean;
}

export interface CaptionProps {
  videoId: string;
  currentTime: number;
  isVisible?: boolean;
  className?: string;
  onToggle?: (visible: boolean) => void;
  onSeekToTime?: (seconds: number) => void;
}

export interface YouTubePlayerApiError {
  code: YouTubePlayerError;
  message: string;
}