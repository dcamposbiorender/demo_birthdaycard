import { z } from 'zod';

/**
 * Environment variables for direct provider access (bypassing AI Gateway)
 * - GOOGLE_GENERATIVE_AI_API_KEY: For Gemini image generation
 * - OPENAI_API_KEY: For text generation
 */
const envSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
});

export const env = envSchema.parse(process.env);
