export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'ollama'
  apiKey?: string
  model?: string
  serverUrl?: string
  selectedModel?: string
  timeout?: number
  temperature?: number
  topP?: number
}

export interface LLMProviderInfo {
  name: string
  models: string[]
  requiresApiKey: boolean
}

export interface LLMModel {
  name: string
  size?: number | string
  modified_at?: string
  digest?: string
  details?: any
}

export const OPENAI_MODELS = [
  { name: 'gpt-4o-mini', description: 'Fast and affordable' },
  { name: 'gpt-4o', description: 'Most capable model' },
  { name: 'gpt-3.5-turbo', description: 'Fast and economical' },
]

export const LLM_PROVIDERS: Record<string, LLMProviderInfo> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    requiresApiKey: true,
  },
  openai: {
    name: 'OpenAI',
    models: OPENAI_MODELS.map(m => m.name),
    requiresApiKey: true,
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-pro', 'gemini-pro-vision'],
    requiresApiKey: true,
  },
  ollama: {
    name: 'Local Ollama',
    models: [],
    requiresApiKey: false,
  },
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'ollama',
  serverUrl: 'http://localhost:11434',
  selectedModel: 'llama2',
  timeout: 30000,
  temperature: 0.3,
  topP: 0.9,
}

export function getStoredLLMConfig(): LLMConfig | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('llm-config')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error reading LLM config:', error)
    return null
  }
}

export function saveLLMConfig(config: LLMConfig): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('llm-config', JSON.stringify(config))
  } catch (error) {
    console.error('Error saving LLM config:', error)
  }
}

export function clearLLMConfig(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('llm-config')
  } catch (error) {
    console.error('Error clearing LLM config:', error)
  }
}
