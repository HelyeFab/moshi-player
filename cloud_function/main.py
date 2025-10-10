"""
Japanese YouTube Transcript Fetcher - Google Cloud Function
Deployed as a serverless function for use with Next.js/Vercel
"""

import json
import functions_framework
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from flask import jsonify


def fetch_japanese_transcript(video_id):
    """
    Fetch Japanese transcript for a YouTube video
    Prioritizes manual Japanese over auto-generated Japanese
    """
    try:
        # Create YouTubeTranscriptApi instance and list transcripts
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)

        available_transcripts = []
        japanese_transcripts = []

        # Collect all available transcripts and identify Japanese ones
        for transcript in transcript_list:
            transcript_info = {
                'language': transcript.language,
                'language_code': transcript.language_code,
                'is_generated': transcript.is_generated,
                'is_translatable': transcript.is_translatable
            }
            available_transcripts.append(transcript_info)

            # Check for Japanese transcripts
            if (transcript.language_code == 'ja' or
                'japanese' in transcript.language.lower() or
                '日本語' in transcript.language):
                japanese_transcripts.append({
                    'transcript': transcript,
                    'info': transcript_info
                })

        print(f"Available transcripts for {video_id}: {len(available_transcripts)}")
        print(f"Japanese transcripts found: {len(japanese_transcripts)}")

        selected_transcript = None

        if japanese_transcripts:
            # Prefer manual Japanese over auto-generated Japanese
            manual_japanese = [jt for jt in japanese_transcripts if not jt['info']['is_generated']]
            if manual_japanese:
                selected_transcript = manual_japanese[0]['transcript']
                print(f"Selected manual Japanese transcript: {manual_japanese[0]['info']['language']}")
            else:
                selected_transcript = japanese_transcripts[0]['transcript']
                print(f"Selected auto-generated Japanese transcript: {japanese_transcripts[0]['info']['language']}")
        else:
            # No Japanese transcripts found
            print("ERROR: No Japanese transcripts available for this video")
            return {
                'available': False,
                'videoId': video_id,
                'message': 'No Japanese transcripts available for this video',
                'availableLanguages': [t['language'] + ' (' + t['language_code'] + ')' for t in available_transcripts],
                'source': 'gcp-cloud-function'
            }

        # Fetch the actual transcript data
        fetched_transcript = selected_transcript.fetch()

        # Transform to expected format
        segments = []
        for snippet in fetched_transcript:
            start = float(snippet['start'])
            duration = float(snippet['duration'])
            end = start + duration
            text = snippet['text'].strip()

            # Skip empty or music/sound effect annotations
            if text and not (text.startswith('[') and text.endswith(']')):
                segments.append({
                    'start': start,
                    'duration': duration,
                    'end': end,
                    'text': text
                })

        return {
            'available': True,
            'videoId': video_id,
            'title': f'Video {video_id}',
            'language': selected_transcript.language,
            'languageCode': selected_transcript.language_code,
            'isJapanese': True,
            'isGenerated': selected_transcript.is_generated,
            'availableLanguages': [jt['info']['language'] + (' (auto)' if jt['info']['is_generated'] else ' (manual)')
                                 for jt in japanese_transcripts],
            'segments': segments,
            'totalSegments': len(segments),
            'totalDuration': segments[-1]['end'] if segments else 0,
            'source': 'gcp-cloud-function'
        }

    except TranscriptsDisabled:
        return {
            'available': False,
            'videoId': video_id,
            'message': 'Transcripts are disabled for this video',
            'source': 'gcp-cloud-function'
        }
    except NoTranscriptFound as e:
        return {
            'available': False,
            'videoId': video_id,
            'message': f'No transcript found: {str(e)}',
            'source': 'gcp-cloud-function'
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Full error traceback: {error_details}")
        return {
            'available': False,
            'videoId': video_id,
            'message': f'Error fetching transcript: {str(e)}',
            'error_type': type(e).__name__,
            'source': 'gcp-cloud-function'
        }


@functions_framework.http
def get_japanese_transcript(request):
    """
    HTTP Cloud Function entry point
    Handles CORS and processes transcript requests
    """
    # Set CORS headers for preflight requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for main request
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    try:
        # Get video ID from query parameter or JSON body
        video_id = None

        if request.method == 'GET':
            video_id = request.args.get('videoId')
        elif request.method == 'POST':
            request_json = request.get_json(silent=True)
            if request_json and 'videoId' in request_json:
                video_id = request_json['videoId']

        if not video_id:
            return (jsonify({
                'error': 'Video ID is required',
                'message': 'Please provide videoId as query parameter or in request body'
            }), 400, headers)

        print(f"Processing transcript request for video: {video_id}")

        # Fetch transcript
        result = fetch_japanese_transcript(video_id)

        return (jsonify(result), 200, headers)

    except Exception as e:
        print(f"Error in Cloud Function: {str(e)}")
        return (jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'available': False,
            'source': 'gcp-cloud-function'
        }), 500, headers)
