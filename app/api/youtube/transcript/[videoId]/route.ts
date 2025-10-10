import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

/**
 * YouTube Transcript API Route
 * Based on Context7 documentation for YouTube.js
 */

// Initialize the YouTube client
let youtubeClient: any = null;

async function getYouTubeClient() {
  if (!youtubeClient) {
    console.log('Initializing YouTube.js client...');
    youtubeClient = await Innertube.create();
    console.log('YouTube.js client initialized successfully!');
  }
  return youtubeClient;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Await params in Next.js 15
    const { videoId } = await params;
    
    // Get preferred language from query parameters
    const url = new URL(request.url);
    const preferredLanguage = url.searchParams.get('language');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching transcript for video:', videoId, 'Preferred language:', preferredLanguage);

    // Get the YouTube.js client
    const client = await getYouTubeClient();
    console.log('Client ready, getting video info...');
    
    // Get video info first
    const videoInfo = await client.getInfo(videoId);
    console.log('Video info received, getting transcript...');
    
    // First, let's try to get transcript info and see what languages are available
    const transcriptInfo = await videoInfo.getTranscript();
    console.log('Transcript info received');
    
    // Check available languages first
    const languageMenu = transcriptInfo?.transcript?.content?.footer?.language_menu;
    const availableLanguages = languageMenu?.sub_menu_items || [];
    
    console.log('Available transcript languages:', availableLanguages.map((lang: any) => ({
      title: lang.title,
      selected: lang.selected
    })));
    
    // Filter to only Japanese languages, excluding English entirely
    const japaneseLanguages = availableLanguages.filter((lang: any) => {
      const title = lang.title.toLowerCase();
      return (title.includes('japanese') || title.includes('日本語')) &&
             !title.includes('english') && !title.includes('英語');
    });
    
    console.log('Japanese languages found:', japaneseLanguages.map((lang: any) => lang.title));
    
    // If no Japanese transcripts available, return error
    if (japaneseLanguages.length === 0) {
      console.warn('No Japanese transcripts available for this video');
      return NextResponse.json({
        available: false,
        message: 'Japanese transcript not available for this video. Only English or other languages found.',
        videoId,
        title: videoInfo.basic_info?.title || 'Unknown Title',
        availableLanguages: availableLanguages.map((lang: any) => lang.title)
      });
    }
    
    // Check if we got English but Japanese is available
    const currentlySelected = availableLanguages.find((lang: any) => lang.selected);
    const isCurrentlyEnglish = currentlySelected?.title?.toLowerCase().includes('english');
    
    console.log('Currently selected:', currentlySelected?.title);
    console.log('Is currently English:', isCurrentlyEnglish);
    
    // Log language preference information and attempt Japanese transcript fetching
    if (isCurrentlyEnglish && japaneseLanguages.length > 0) {
      console.warn('⚠️  Got English transcript but Japanese is available:', {
        current: currentlySelected.title,
        japanese: japaneseLanguages.map(lang => lang.title)
      });
      
      // Note: YouTube.js currently doesn't support direct language selection for getTranscript()
      // The continuation token approach requires lower-level API access that's not exposed
      console.log('Available Japanese options:', japaneseLanguages.map(lang => ({
        title: lang.title,
        hasContinuation: !!lang.continuation
      })));
      
      console.log('Using English transcript as fallback (YouTube.js limitation)');
      console.log('Future improvement: Implement alternative transcript API or YouTube.js enhancement');
    }
    
    // Extract segments from the correct YouTube.js structure
    let rawSegments = transcriptInfo?.transcript?.content?.body?.initial_segments;
    
    console.log('Found segments:', rawSegments ? `${rawSegments.length} segments` : 'none');
    
    // Check if transcript is available
    if (!rawSegments || rawSegments.length === 0) {
      return NextResponse.json({
        available: false,
        message: 'Transcript not available for this video',
        videoId,
        title: videoInfo.basic_info?.title || 'Unknown Title'
      });
    }

    // Extract transcript segments
    // Transform to a more usable format based on actual YouTube.js structure
    const segments = rawSegments.map((segment: any) => {
      // YouTube.js provides start_ms and end_ms
      const startMs = parseInt(segment.start_ms || '0');
      const endMs = parseInt(segment.end_ms || '0');
      const start = startMs / 1000; // Convert to seconds
      const end = endMs / 1000;
      const duration = end - start;
      
      // Extract text from the correct structure
      const text = segment.snippet?.text || segment.snippet?.runs?.[0]?.text || '';
      
      return {
        start,
        duration,
        end,
        text: text.trim()
      };
    }).filter((segment: any) => 
      segment.text.length > 0 && 
      !segment.text.match(/^\[.*\]$/) // Remove [音楽] style annotations
    );

    // Detect language from currently selected
    const selectedLanguage = availableLanguages.find((lang: any) => lang.selected);
    const detectedLanguage = selectedLanguage?.title || 'Unknown';
    
    // Determine if we should warn about language mismatch
    const languageWarning = isCurrentlyEnglish && japaneseLanguages.length > 0 
      ? `Note: Currently showing ${detectedLanguage} captions, but Japanese options are available: ${japaneseLanguages.map(lang => lang.title).join(', ')}`
      : undefined;
    
    // Return all available languages for now (including non-Japanese for debugging)
    // TODO: In production, filter to only Japanese languages
    const returnLanguages = japaneseLanguages.length > 0 
      ? japaneseLanguages.map((lang: any) => lang.title)
      : availableLanguages.map((lang: any) => lang.title);
    
    return NextResponse.json({
      available: true,
      videoId,
      title: videoInfo.basic_info?.title || 'Unknown Title',
      language: detectedLanguage,
      availableLanguages: returnLanguages,
      languageNote: languageWarning,
      segments,
      totalSegments: segments.length,
      totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0
    });

  } catch (error) {
    console.error('Error fetching transcript:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript',
        available: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        videoId
      },
      { status: 500 }
    );
  }
}