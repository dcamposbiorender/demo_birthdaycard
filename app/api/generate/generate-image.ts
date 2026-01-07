import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

export const generateImageStep = async (prompt: string) => {
  'use step';

  // Generate image using OpenAI DALL-E 3 (since Gemini quota is exhausted)
  const { image } = await generateImage({
    model: openai.image('dall-e-3'),
    prompt: `Generate a birthday card image based on this description: ${prompt}`,
    size: '1024x1024',
  });

  if (!image?.base64) {
    throw new Error('Failed to generate image');
  }

  // Format as a data URI with the proper media type for use in img src
  const mediaType = image.mimeType || 'image/png';
  return `data:${mediaType};base64,${image.base64}`;
};

// Export with original name for compatibility
export { generateImageStep as generateImage };
