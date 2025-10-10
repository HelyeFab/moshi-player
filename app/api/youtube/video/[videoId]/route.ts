import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoDetails } from '@/lib/youtubeApi';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json(
        { error: 'Invalid video ID format' },
        { status: 400 }
      );
    }

    const videoDetails = await fetchVideoDetails(videoId);

    if (!videoDetails) {
      return NextResponse.json(
        { error: 'Video not found or API key not configured' },
        { status: 404 }
      );
    }

    return NextResponse.json(videoDetails, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in YouTube API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}