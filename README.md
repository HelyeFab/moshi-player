# 🎬 Modern YouTube Player

A feature-rich, modern YouTube player built with **Next.js 15**, **React 19**, and **TypeScript** using the latest web development patterns researched through Context7.

## ✨ Features

### 🎮 Player Features
- **Custom Controls**: Beautiful, responsive player controls with modern UI
- **Fullscreen Support**: Cross-browser fullscreen API with automatic detection
- **Volume Control**: Interactive volume slider with mute/unmute functionality
- **Playback Speed**: Adjustable playback rates from 0.25x to 2x speed
- **Progress Bar**: Clickable progress bar with real-time seek functionality
- **Time Display**: Real-time current time and duration in MM:SS format
- **Quality Indicator**: Display current video quality (240p, 360p, 720p, etc.)
- **Error Handling**: User-friendly error messages for various YouTube API errors
- **Loading States**: Smooth loading animations and states
- **Responsive Design**: Mobile-first responsive design with Tailwind CSS
- **YouTube API Integration**: Rich video metadata from YouTube Data API v3
- **Server-Side API Routes**: Secure API key handling with Next.js API routes

### 🔧 Technical Features
- **TypeScript**: Full type safety with comprehensive interfaces and enums
- **Modern React**: React 19 hooks (useState, useEffect, useCallback, useRef)
- **Custom Hooks**: Reusable custom hooks for state management
- **Performance**: Throttling and debouncing for optimal performance
- **Next.js App Router**: Latest Next.js 15 App Router patterns
- **Client-Side Rendering**: Proper 'use client' directives for interactive components
- **YouTube IFrame API**: Full integration with YouTube's official API
- **Cross-Browser Support**: Fullscreen API support for all modern browsers
- **Accessibility**: Keyboard and mouse controls with proper ARIA labels
- **SEO Optimized**: Proper metadata and Open Graph tags

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn package manager

### Installation

1. **Clone and setup the project**:
   ```bash
   cd /home/helye/DevProject/personal/next-js
   npm install
   ```

2. **Setup YouTube API (Optional but Recommended)**:
   - Get a YouTube Data API v3 key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add it to `.env.local`:
   ```bash
   YOUTUBE_API_KEY=your_api_key_here
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linter
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main demo page
├── components/            # React components
│   └── YouTubePlayer.tsx  # Main YouTube player component
├── lib/                   # Custom hooks and utilities
│   └── useYouTubePlayer.ts # YouTube player state management hook
├── types/                 # TypeScript type definitions
│   └── youtube.ts         # YouTube player interfaces and types
├── utils/                 # Utility functions
│   └── youtube.ts         # YouTube helper functions
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## 🎯 Usage Examples

### Basic Usage

```tsx
import YouTubePlayer from '@/components/YouTubePlayer';

export default function MyPage() {
  return (
    <YouTubePlayer
      videoId="dQw4w9WgXcQ"
      config={{
        width: '100%',
        height: 400,
        autoplay: false,
        controls: false,
      }}
      onReady={() => console.log('Player ready!')}
      onPlay={() => console.log('Video playing')}
      onPause={() => console.log('Video paused')}
    />
  );
}
```

### Advanced Configuration

```tsx
<YouTubePlayer
  videoId="your-video-id"
  config={{
    width: 800,
    height: 450,
    autoplay: true,
    muted: true,
    loop: true,
    quality: 'hd720',
    modestbranding: true,
    rel: false,
    start: 30,        // Start at 30 seconds
    end: 120,         // End at 2 minutes
  }}
  onTimeUpdate={(currentTime, duration) => {
    console.log(`${currentTime}/${duration} seconds`);
  }}
  onVolumeChange={(volume) => {
    console.log(`Volume: ${volume}%`);
  }}
  onError={(error) => {
    console.error('Player error:', error);
  }}
/>
```

## 🛠️ Custom Hooks

### useYouTubePlayer

The core custom hook that manages YouTube player state:

```tsx
import { useYouTubePlayer } from '@/lib/useYouTubePlayer';

function MyComponent() {
  const { containerRef, state, actions, isReady } = useYouTubePlayer('videoId', {
    autoplay: false,
    controls: false,
  });

  return (
    <div>
      <div ref={containerRef} />
      <button onClick={actions.play}>Play</button>
      <button onClick={actions.pause}>Pause</button>
      <span>Time: {state.currentTime}/{state.duration}</span>
    </div>
  );
}
```

## 🎨 Styling

The project uses **Tailwind CSS** for styling with custom YouTube-themed colors:

```css
colors: {
  youtube: {
    red: '#FF0000',
    dark: '#0f0f0f',
    light: '#f9f9f9',
  }
}
```

## 🔧 Configuration Options

### Player Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `videoId` | string | required | YouTube video ID |
| `width` | number/string | 640 | Player width |
| `height` | number/string | 360 | Player height |
| `autoplay` | boolean | false | Auto-start playback |
| `controls` | boolean | true | Show YouTube controls |
| `loop` | boolean | false | Loop the video |
| `muted` | boolean | false | Start muted |
| `quality` | string | 'auto' | Video quality preference |

### Event Callbacks

- `onReady()` - Player is ready
- `onPlay()` - Video starts playing
- `onPause()` - Video is paused
- `onEnd()` - Video ends
- `onError(error)` - Error occurred
- `onTimeUpdate(currentTime, duration)` - Time updates
- `onVolumeChange(volume)` - Volume changes
- `onPlaybackRateChange(rate)` - Playback rate changes

## 🌐 Browser Support

- **Chrome/Chromium** ✅
- **Firefox** ✅
- **Safari** ✅
- **Edge** ✅
- **Mobile browsers** ✅

## 📱 Mobile Features

- Touch-friendly controls
- Responsive layout
- Optimized for mobile viewing
- iOS playsinline support
- Android fullscreen support

## 🔍 Context7 Integration

This project was built using the latest patterns and documentation from **Context7**, ensuring:

- Up-to-date Next.js 15 App Router patterns
- Modern React 19 hooks and patterns
- TypeScript best practices
- Performance optimizations
- Accessibility standards

## 🤝 Contributing

Feel free to contribute to this project! Some areas for improvement:

- [ ] Add playlist support
- [ ] Implement video chapters
- [ ] Add keyboard shortcuts
- [ ] Create additional themes
- [ ] Add video download functionality
- [ ] Implement picture-in-picture mode

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Context7** for providing up-to-date documentation and patterns
- **YouTube IFrame API** for the player functionality
- **Next.js** team for the excellent framework
- **React** team for the UI library
- **Tailwind CSS** for the styling system

---

Built with ❤️ using modern web technologies and Context7 documentation.