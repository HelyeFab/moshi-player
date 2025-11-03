/**
 * YouTube Data API v3 service
 * Uses environment variables following Context7 Next.js patterns
 */

export interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  tags: string[];
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
    standard?: { url: string; width: number; height: number };
    maxres?: { url: string; width: number; height: number };
  };
  categoryId: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

export interface YouTubeApiError {
  code: number;
  message: string;
  details?: any;
}

/**
 * Converts ISO 8601 duration (PT4M13S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (match[1] ? parseInt(match[1]) : 0);
  const minutes = (match[2] ? parseInt(match[2]) : 0);  
  const seconds = (match[3] ? parseInt(match[3]) : 0);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats numbers with appropriate suffixes (1.2K, 1.2M, etc.)
 */
function formatNumber(num: string): string {
  const number = parseInt(num);
  if (number >= 1000000000) {
    return (number / 1000000000).toFixed(1) + 'B';
  }
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  return number.toString();
}

/**
 * Fetches video details from YouTube Data API v3
 * Following Context7 patterns for API calls in Next.js
 */
export async function fetchVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('YouTube API key not found in environment variables');
    return null;
  }

  try {
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        // Cache for 5 minutes
        next: { revalidate: 300 }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    const { snippet, contentDetails, statistics } = video;

    return {
      id: videoId,
      title: snippet.title,
      description: snippet.description,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      duration: parseDuration(contentDetails.duration).toString(),
      viewCount: formatNumber(statistics.viewCount || '0'),
      likeCount: formatNumber(statistics.likeCount || '0'),
      tags: snippet.tags || [],
      thumbnails: snippet.thumbnails,
      categoryId: snippet.categoryId,
      defaultLanguage: snippet.defaultLanguage,
      defaultAudioLanguage: snippet.defaultAudioLanguage,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('YouTube API request timed out after 15 seconds');
      } else {
        console.error('Error fetching video details:', error.message);
      }
    } else {
      console.error('Error fetching video details:', error);
    }
    return null;
  }
}

/**
 * Fetches multiple video details at once (batch request)
 * Maximum 50 videos per request as per YouTube API limits
 */
export async function fetchMultipleVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey || videoIds.length === 0) {
    return [];
  }

  // Limit to 50 videos per request (YouTube API limit)
  const limitedIds = videoIds.slice(0, 50);

  try {
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${limitedIds.join(',')}&key=${apiKey}&part=snippet,contentDetails,statistics`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        next: { revalidate: 300 }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data.items?.map((video: any) => {
      const { snippet, contentDetails, statistics } = video;
      return {
        id: video.id,
        title: snippet.title,
        description: snippet.description,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        duration: parseDuration(contentDetails.duration).toString(),
        viewCount: formatNumber(statistics.viewCount || '0'),
        likeCount: formatNumber(statistics.likeCount || '0'),
        tags: snippet.tags || [],
        thumbnails: snippet.thumbnails,
        categoryId: snippet.categoryId,
        defaultLanguage: snippet.defaultLanguage,
        defaultAudioLanguage: snippet.defaultAudioLanguage,
      };
    }) || [];
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('YouTube API request timed out after 15 seconds');
      } else {
        console.error('Error fetching multiple video details:', error.message);
      }
    } else {
      console.error('Error fetching multiple video details:', error);
    }
    return [];
  }
}

/**
 * Searches for videos using YouTube Data API v3
 */
export async function searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideoDetails[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey || !query.trim()) {
    return [];
  }

  try {
    // Add timeout handling with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // First, search for video IDs
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&key=${apiKey}&part=id&type=video&maxResults=${maxResults}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        next: { revalidate: 300 }
      }
    );

    clearTimeout(timeoutId);

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId) || [];

    if (videoIds.length === 0) {
      return [];
    }

    // Then, get detailed information for those videos
    return await fetchMultipleVideoDetails(videoIds);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('YouTube API search request timed out after 15 seconds');
      } else {
        console.error('Error searching videos:', error.message);
      }
    } else {
      console.error('Error searching videos:', error);
    }
    return [];
  }
}