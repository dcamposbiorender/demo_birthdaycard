import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const generateMessage = async (prompt: string) => {
  'use step';

  // Generate birthday message text using OpenAI (direct provider, bypassing AI Gateway)
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Create a heartfelt birthday message for a birthday card with this theme: ${prompt}

Return ONLY the final birthday message text that will appear on the card. Do not include labels like "Short variant" or "Longer variant". Do not include multiple options or sign-off variations. Just return one complete, ready-to-use birthday message.`,
  });

  return text;
};
