#!/usr/bin/env node

/**
 * Test script for YouTube URL parsing
 * Run with: node test-urls.mjs
 */

// Import the functions (this is a simplified version for testing)
function extractVideoId(url) {
  // If input is already a valid video ID, return it
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }

  // Comprehensive regex patterns for various YouTube URL formats
  const patterns = [
    // Standard watch URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // Mobile URLs
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // Short URLs
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Old style URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    // YouTube Music URLs
    /(?:https?:\/\/)?music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // Gaming URLs
    /(?:https?:\/\/)?gaming\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    // YouTube Shorts
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Direct video ID (fallback)
    /^([a-zA-Z0-9_-]{11})$/
  ];

  const trimmedUrl = url.trim();
  
  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      // Validate that the extracted ID is exactly 11 characters
      const videoId = match[1];
      if (videoId.length === 11) {
        return videoId;
      }
    }
  }

  return null;
}

function isValidVideoId(videoId) {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

// Test URLs
const testUrls = [
  // Standard formats
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
  'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'www.youtube.com/watch?v=dQw4w9WgXcQ',
  'youtube.com/watch?v=dQw4w9WgXcQ',
  
  // Short URLs
  'https://youtu.be/dQw4w9WgXcQ',
  'youtu.be/dQw4w9WgXcQ',
  
  // With additional parameters
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
  'https://www.youtube.com/watch?feature=player_embedded&v=dQw4w9WgXcQ',
  
  // Mobile
  'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
  
  // Embed
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  
  // Shorts
  'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  
  // Direct ID
  'dQw4w9WgXcQ',
  
  // Invalid formats
  'not-a-url',
  'https://www.google.com',
  'abc123', // too short
  'abcdefghijk123', // too long
];

console.log('🧪 Testing YouTube URL parsing...\n');

testUrls.forEach((url, index) => {
  const videoId = extractVideoId(url);
  const isValid = videoId ? isValidVideoId(videoId) : false;
  const status = videoId && isValid ? '✅' : '❌';
  
  console.log(`${status} Test ${index + 1}: ${url}`);
  console.log(`   → Video ID: ${videoId || 'null'}`);
  console.log(`   → Valid: ${isValid}`);
  console.log('');
});

console.log('✨ Test completed!');