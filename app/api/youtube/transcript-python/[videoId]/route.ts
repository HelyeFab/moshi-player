import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * Python-based Japanese YouTube Transcript API Route
 * Uses the Python youtube-transcript-api package for reliable Japanese transcript fetching
 * Based on Context7 documentation for jdepoix/youtube-transcript-api
 */

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

    console.log('Fetching Japanese transcript via Python API for video:', videoId);

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
    transcriptData.method = 'python-script';

    console.log('Successfully fetched transcript via Python:', {
      available: transcriptData.available,
      language: transcriptData.language,
      isJapanese: transcriptData.isJapanese,
      segments: transcriptData.totalSegments
    });

    return NextResponse.json(transcriptData);

  } catch (error) {
    console.error('Error in Python transcript API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Japanese transcript',
        available: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        videoId,
        source: 'python-transcript-api',
        method: 'python-script'
      },
      { status: 500 }
    );
  }
}