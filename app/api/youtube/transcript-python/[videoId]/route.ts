import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * Python-based Japanese YouTube Transcript API Route
 * Supports both Google Cloud Function (production) and local subprocess (development)
 * Based on Context7 documentation for jdepoix/youtube-transcript-api
 */

// Check if Google Cloud Function URL is configured
const GOOGLE_CLOUD_FUNCTION_URL = process.env.GOOGLE_CLOUD_FUNCTION_URL;

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

    console.log('Fetching Japanese transcript for video:', videoId);

    // Use Google Cloud Function if configured (production/Vercel)
    if (GOOGLE_CLOUD_FUNCTION_URL) {
      console.log('Using Google Cloud Function:', GOOGLE_CLOUD_FUNCTION_URL);
      return await fetchViaCloudFunction(videoId);
    }

    // Otherwise use local subprocess (local development)
    console.log('Using local Python subprocess');
    return await fetchViaSubprocess(videoId);

  } catch (error) {
    console.error('Error in transcript API:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch Japanese transcript',
        available: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        videoId,
        source: 'transcript-api'
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch transcript via Google Cloud Function
 */
async function fetchViaCloudFunction(videoId: string) {
  try {
    const url = `${GOOGLE_CLOUD_FUNCTION_URL}?videoId=${encodeURIComponent(videoId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloud Function returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('Cloud Function response:', {
      available: data.available,
      language: data.language,
      isJapanese: data.isJapanese,
      segments: data.totalSegments
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Cloud Function error:', error);
    throw error;
  }
}

/**
 * Fetch transcript via local Python subprocess
 */
async function fetchViaSubprocess(videoId: string) {
  try {

    // Path to the Python script and virtual environment
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_japanese_transcript.py');
    const venvPython = path.join(process.cwd(), 'transcript_env', 'bin', 'python3');

    // Check if virtual environment exists
    const fs = require('fs');
    if (!fs.existsSync(venvPython)) {
      throw new Error('Python virtual environment not found. Please run: python3 -m venv transcript_env && source transcript_env/bin/activate && pip install youtube-transcript-api');
    }

    // Execute Python script
    const result = await new Promise<string>((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const pythonProcess = spawn(venvPython, [scriptPath, videoId], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Python script executed successfully');
          if (stderr) {
            console.log('Python script stderr (info):', stderr);
          }
          resolve(stdout);
        } else {
          console.error('Python script failed with code:', code);
          console.error('Python script stderr:', stderr);
          reject(new Error(`Python script failed with exit code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(error);
      });

      // Set a timeout for the Python script
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script timed out after 30 seconds'));
      }, 30000);
    });

    // Parse the JSON result from Python script
    let transcriptData;
    try {
      transcriptData = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse Python script output:', result);
      throw new Error('Invalid JSON response from Python script');
    }

    // Add additional metadata
    transcriptData.fetchedAt = new Date().toISOString();
    transcriptData.method = 'local-subprocess';

    console.log('Successfully fetched transcript via subprocess:', {
      available: transcriptData.available,
      language: transcriptData.language,
      isJapanese: transcriptData.isJapanese,
      segments: transcriptData.totalSegments
    });

    return NextResponse.json(transcriptData);

  } catch (error) {
    console.error('Subprocess error:', error);
    throw error;
  }
}