import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

/**
 * Enhanced YouTube Transcript API Route
 * Uses direct YouTube.js approach with forced Japanese language selection
 * Based on Context7 documentation and custom language selection logic
 */

// Initialize the YouTube client
let youtubeClient: any = null;

async function getYouTubeClient() {
  if (!youtubeClient) {
    console.log('Initializing enhanced YouTube.js client...');
    youtubeClient = await Innertube.create();
    console.log('Enhanced YouTube.js client initialized successfully!');
  }
  return youtubeClient;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  let videoId: string = '';
  
  try {
    // Await params in Next.js 15
    const resolvedParams = await params;
    videoId = resolvedParams.videoId;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching transcript for video (enhanced API):', videoId);

    // Get the YouTube.js client  
    const client = await getYouTubeClient();
    console.log('Client ready, getting video info...');
    
    // Get video info first
    const videoInfo = await client.getInfo(videoId);
    console.log('Video info received, getting transcript...');
    
    // Get transcript info
    const transcriptInfo = await videoInfo.getTranscript();
    console.log('Transcript info received');
    
    // Check available languages
    const languageMenu = transcriptInfo?.transcript?.content?.footer?.language_menu;
    const availableLanguages = languageMenu?.sub_menu_items || [];
    
    console.log('Available transcript languages:', availableLanguages.map((lang: any) => ({
      title: lang.title,
      selected: lang.selected,
      hasContinuation: !!lang.continuation
    })));
    
    // Filter to only Japanese languages
    const japaneseLanguages = availableLanguages.filter((lang: any) => {
      const title = lang.title.toLowerCase();
      return (title.includes('japanese') || title.includes('日本語')) &&
             !title.includes('english') && !title.includes('英語');
    });
    
    console.log('Japanese languages found:', japaneseLanguages.map((lang: any) => lang.title));
    
    let finalTranscriptInfo = transcriptInfo;
    let selectedLanguage = availableLanguages.find((lang: any) => lang.selected);
    let forcedJapanese = false;
    
    // If we have Japanese options and currently selected is not Japanese, attempt to force Japanese
    if (japaneseLanguages.length > 0) {
      const isCurrentlyJapanese = selectedLanguage?.title?.toLowerCase().includes('japanese') || 
                                  selectedLanguage?.title?.toLowerCase().includes('日本語');
      
      if (!isCurrentlyJapanese) {
        console.log('Attempting to force Japanese transcript selection...');
        
        // Try to use the Japanese language continuation token
        const preferredJapanese = japaneseLanguages.find((lang: any) =>
          !lang.title.toLowerCase().includes('auto-generated')
        ) || japaneseLanguages[0];
        
        console.log('Selected Japanese option:', preferredJapanese.title);
        
        if (preferredJapanese.continuation) {
          try {
            console.log('Attempting to use Japanese continuation token...');
            console.log('Session structure:', Object.keys(client.session || {}));
            console.log('Continuation token:', preferredJapanese.continuation.substring(0, 50) + '...');
            
            // Try direct HTTP POST with the continuation token
            const session = client.session;
            
            if (session && session.http) {
              console.log('Making direct API call for Japanese transcript...');
              console.log('HTTP client methods:', Object.keys(session.http));
              
              const payload = {
                context: session.context,
                continuation: preferredJapanese.continuation
              };
              
              try {
                // Try different HTTP methods that might exist
                let response;
                if (typeof session.http.post === 'function') {
                  console.log('Using http.post method...');
                  response = await session.http.post('/youtubei/v1/get_transcript', payload);
                } else if (typeof session.actions?.execute === 'function') {
                  console.log('Using actions.execute method...');
                  response = await session.actions.execute('/youtubei/v1/get_transcript', payload);
                } else {
                  console.log('No suitable HTTP method found');
                }
                
                if (response) {
                  console.log('Direct API response received, type:', typeof response);
                  console.log('Response keys:', Object.keys(response));
                  
                  // Try different response structures
                  const transcriptContent = response.actions?.[0]?.updateEngagementPanelAction?.content?.transcript ||
                                           response.data?.actions?.[0]?.updateEngagementPanelAction?.content?.transcript ||
                                           response.transcript;
                  
                  if (transcriptContent) {
                    console.log('Successfully extracted Japanese transcript!');
                    finalTranscriptInfo = { transcript: transcriptContent };
                    selectedLanguage = preferredJapanese;
                    forcedJapanese = true;
                  } else {
                    console.log('No transcript found in response structure');
                  }
                }
              } catch (apiError: any) {
                console.warn('Direct API call failed:', apiError?.message || apiError);
              }
            } else {
              console.warn('Session or HTTP client not available');
            }
          } catch (error) {
            console.warn('Failed to force Japanese transcript:', error);
            console.log('Using default transcript...');
          }
        }
      } else {
        console.log('Current transcript is already Japanese!');
        forcedJapanese = true;
      }
    }
    
    // Extract segments from transcript
    let rawSegments = finalTranscriptInfo?.transcript?.content?.body?.initial_segments;
    
    console.log('Found segments:', rawSegments ? `${rawSegments.length} segments` : 'none');
    
    // Check if transcript is available
    if (!rawSegments || rawSegments.length === 0) {
      return NextResponse.json({
        available: false,
        message: japaneseLanguages.length > 0
          ? `Japanese transcript options found but could not extract content. Available: ${japaneseLanguages.map((l: any) => l.title).join(', ')}`
          : 'No transcript available for this video',
        videoId,
        title: videoInfo.basic_info?.title || 'Unknown Title',
        availableLanguages: japaneseLanguages.map((lang: any) => lang.title)
      });
    }

    // Transform segments to our format
    const segments = rawSegments.map((segment: any) => {
      const startMs = parseInt(segment.start_ms || '0');
      const endMs = parseInt(segment.end_ms || '0');
      const start = startMs / 1000;
      const end = endMs / 1000;
      const duration = end - start;
      
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

    const detectedLanguage = selectedLanguage?.title || 'Unknown';
    const isJapanese = forcedJapanese || 
                      detectedLanguage.toLowerCase().includes('japanese') || 
                      detectedLanguage.toLowerCase().includes('日本語');

    return NextResponse.json({
      available: true,
      videoId,
      title: videoInfo.basic_info?.title || 'Unknown Title',
      language: detectedLanguage,
      isJapanese,
      availableLanguages: japaneseLanguages.map((lang: any) => lang.title),
      languageNote: !isJapanese && japaneseLanguages.length > 0
        ? `Japanese options available: ${japaneseLanguages.map((l: any) => l.title).join(', ')}`
        : undefined,
      segments,
      totalSegments: segments.length,
      totalDuration: segments.length > 0 ? segments[segments.length - 1].end : 0,
      source: 'enhanced-youtubejs',
      forcedJapanese
    });

  } catch (error) {
    console.error('Error fetching transcript (alternative API):', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript',
        available: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        videoId,
        source: 'enhanced-youtubejs'
      },
      { status: 500 }
    );
  }
}