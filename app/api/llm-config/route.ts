import { NextRequest, NextResponse } from 'next/server'
import { LLMModel, OPENAI_MODELS } from '@/lib/llm-config'

export async function POST(request: NextRequest) {
    try {
        const { provider, serverUrl, action } = await request.json()

        // Handle OpenAI provider
        if (provider === 'openai') {
            if (action === 'test-connection') {
                // Check if OpenAI API key is available
                const apiKey = process.env.OPENAI_KEY

                if (!apiKey) {
                    return NextResponse.json({
                        success: false,
                        error: 'OpenAI API key not configured in environment variables',
                    })
                }

                // Test OpenAI connection with a minimal request
                try {
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 10000)

                    const response = await fetch('https://api.openai.com/v1/models', {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        signal: controller.signal,
                    })

                    clearTimeout(timeoutId)

                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}))
                        return NextResponse.json({
                            success: false,
                            error: error.error?.message || `OpenAI API error: ${response.status}`,
                        })
                    }

                    // Return OpenAI models
                    return NextResponse.json({
                        success: true,
                        models: OPENAI_MODELS.map(model => ({
                            name: model.name,
                            size: undefined,
                            details: {
                                family: 'OpenAI',
                            }
                        })),
                        serverInfo: {
                            provider: 'openai',
                            total_models: OPENAI_MODELS.length,
                        },
                    })

                } catch (error: any) {
                    return NextResponse.json({
                        success: false,
                        error: error.name === 'AbortError' ? 'Connection timeout' : 'Failed to connect to OpenAI',
                    })
                }
            }

            if (action === 'get-models') {
                return NextResponse.json({
                    success: true,
                    models: OPENAI_MODELS.map(model => ({
                        name: model.name,
                        size: undefined,
                        details: {
                            family: 'OpenAI',
                        }
                    })),
                })
            }
        }

        // Handle local Ollama provider
        if (!serverUrl) {
            return NextResponse.json(
                { error: 'Server URL is required for local provider' },
                { status: 400 }
            )
        }

        // Validate URL format
        try {
            new URL(serverUrl)
        } catch {
            return NextResponse.json(
                { error: 'Invalid server URL format' },
                { status: 400 }
            )
        }

        if (action === 'test-connection') {
            // Test connection to the LLM server
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

                const response = await fetch(`${serverUrl}/api/tags`, {
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                clearTimeout(timeoutId)

                if (!response.ok) {
                    return NextResponse.json({
                        success: false,
                        error: `Server responded with ${response.status}: ${response.statusText}`,
                    })
                }

                const data = await response.json()
                const models: LLMModel[] = data.models || []

                return NextResponse.json({
                    success: true,
                    models: models.map(model => ({
                        name: model.name,
                        size: model.size,
                        modified_at: model.modified_at,
                        digest: model.digest,
                        details: model.details,
                    })),
                    serverInfo: {
                        version: data.version,
                        total_models: models.length,
                    },
                })

            } catch (error: any) {
                let errorMessage = 'Connection failed'

                if (error.name === 'AbortError') {
                    errorMessage = 'Connection timeout (10s)'
                } else if (error.code === 'ECONNREFUSED') {
                    errorMessage = 'Connection refused - server not running'
                } else if (error.code === 'ENOTFOUND') {
                    errorMessage = 'Server not found - check URL'
                } else if (error.message) {
                    errorMessage = error.message
                }

                return NextResponse.json({
                    success: false,
                    error: errorMessage,
                })
            }
        }

        if (action === 'get-models') {
            // Get available models from the server
            try {
                const response = await fetch(`${serverUrl}/api/tags`, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const data = await response.json()
                const models: LLMModel[] = data.models || []

                return NextResponse.json({
                    success: true,
                    models: models.map(model => ({
                        name: model.name,
                        size: model.size,
                        modified_at: model.modified_at,
                        digest: model.digest,
                        details: model.details,
                    })),
                })

            } catch (error: any) {
                return NextResponse.json({
                    success: false,
                    error: error.message || 'Failed to fetch models',
                })
            }
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )

    } catch (error) {
        console.error('LLM config API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}