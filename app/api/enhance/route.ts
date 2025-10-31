import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LLM_CONFIG } from '@/lib/llm-config'

export async function POST(request: NextRequest) {
  try {
    const {
      text,
      addEmojis = false,
      customInstructions = '',
      llmConfig
    } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      )
    }

    const emojiInstructions = addEmojis
      ? `4. Add appropriate and relevant emojis to headers and sections to make them visually appealing. Use emojis that match the content (e.g., 📊 for data, 🍳 for cooking, 📝 for forms, etc.). Place emojis at the beginning of headers.`
      : `4. Do NOT add any emojis to the text.`

    const customInstructionText = customInstructions
      ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${customInstructions}\n`
      : ''

    const prompt = `You are a markdown formatting expert. Convert the following text into well-formatted markdown.

CRITICAL RULES - YOU MUST FOLLOW THESE EXACTLY:

1. TABLES ARE SACRED - NEVER REMOVE TABLES:
   - If you detect any tabular data (text aligned in columns with consistent spacing), you MUST convert it to a markdown table
   - Use | separators between columns
   - Add a header separator row (|---|---|) after the first row
   - NEVER convert tables to lists or paragraphs
   - Example of table format:
     | Column 1 | Column 2 | Column 3 |
     |----------|----------|----------|
     | Data 1   | Data 2   | Data 3   |

2. Headers: use # for main titles, ## for sections, ### for subsections

3. Lists:
   - Convert bullet points to proper markdown lists
   - Preserve numbered lists with correct formatting

${emojiInstructions}

5. Text formatting:
   - Bold: **text**
   - Italic: *text*
   - Code: \`code\`

6. Code blocks: Use \`\`\` for multi-line code

7. URLs: Convert to [text](url) format

8. PRESERVE ALL CONTENT:
   - Do not remove or summarize any information
   - Keep all data intact
   - Maintain the original structure as much as possible

${customInstructionText}

REMEMBER: If you see data that looks like a table (rows and columns of information), you MUST format it as a markdown table. This is non-negotiable.

Text to convert:
${text}

Return ONLY the formatted markdown, no explanations or comments. DO NOT remove tables or convert them to other formats.`

    // Use provided config or fallback to defaults
    const config = llmConfig || DEFAULT_LLM_CONFIG

    let markdown: string

    if (config.provider === 'openai') {
      // Call OpenAI API
      markdown = await callOpenAI(prompt, config)
    } else {
      // Call local Ollama API
      markdown = await callOllama(prompt, config)
    }

    return NextResponse.json({ markdown })

  } catch (error: any) {
    console.error('Error enhancing text:', error)

    let errorMessage = 'Failed to enhance text'
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - try increasing timeout in settings'
    } else if (error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to LLM server - check your settings'
    } else if (error.message?.includes('API key')) {
      errorMessage = 'Invalid OpenAI API key - check your environment variables'
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

async function callOllama(prompt: string, config: any): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

  const response = await fetch(`${config.serverUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: config.selectedModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: config.temperature || 0.3,
        top_p: config.topP || 0.9,
      }
    }),
  })

  clearTimeout(timeoutId)

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.response || ''
}

async function callOpenAI(prompt: string, config: any): Promise<string> {
  const apiKey = process.env.OPENAI_KEY

  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: config.selectedModel || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a markdown formatting expert. Always respond with only the formatted markdown, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature || 0.3,
      top_p: config.topP || 0.9,
    }),
  })

  clearTimeout(timeoutId)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function GET(request: NextRequest) {
  // Check if LLM server is available with dynamic configuration
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider') || DEFAULT_LLM_CONFIG.provider
  const serverUrl = url.searchParams.get('serverUrl') || DEFAULT_LLM_CONFIG.serverUrl
  const selectedModel = url.searchParams.get('selectedModel') || DEFAULT_LLM_CONFIG.selectedModel

  try {
    if (provider === 'openai') {
      // Check if OpenAI API key is configured
      const apiKey = process.env.OPENAI_KEY

      if (!apiKey) {
        return NextResponse.json({
          available: false,
          error: 'OpenAI API key not configured'
        })
      }

      // OpenAI is always available if key exists
      return NextResponse.json({
        available: true,
        hasModel: true,
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
        selectedModel: selectedModel || 'gpt-4o-mini',
      })
    }

    // Check local Ollama server
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${serverUrl}/api/tags`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({
        available: false,
        error: `Server responded with ${response.status}`
      })
    }

    const data = await response.json()
    const models = data.models?.map((m: any) => m.name) || []
    const hasModel = models.includes(selectedModel) || models.length > 0

    return NextResponse.json({
      available: true,
      hasModel,
      models,
      selectedModel: hasModel ? selectedModel : models[0] || null,
    })
  } catch (error: any) {
    let errorMessage = 'Cannot connect to LLM server'
    if (error.name === 'AbortError') {
      errorMessage = 'Connection timeout'
    }

    return NextResponse.json({
      available: false,
      error: errorMessage
    })
  }
}