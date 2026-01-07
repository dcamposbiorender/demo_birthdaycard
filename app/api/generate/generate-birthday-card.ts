import { generateImage } from './generate-image';
import { generateMessage } from './generate-message';
import { generatePrompts } from './generate-prompts';

/**
 * Simplified birthday card workflow (POC)
 * - Removed email/RSVP functionality to focus on Workflow DevKit + AI SDK
 * - Uses Gemini for images, OpenAI for text (bypassing Vercel AI Gateway)
 */
export const generateBirthdayCard = async (prompt: string) => {
  'use workflow';

  try {
    console.log(`[WORKFLOW] Starting birthday card generation for: ${prompt}`);

    // Step 1: Generate separate text and image prompts from user input
    console.log('[WORKFLOW] Step 1/2: Generating text and image prompts');
    const { textPrompt, imagePrompt } = await generatePrompts(prompt);
    console.log('[WORKFLOW] Step 1/2 complete. Prompts generated');
    console.log(`[WORKFLOW] - Text prompt: ${textPrompt}`);
    console.log(`[WORKFLOW] - Image prompt: ${imagePrompt}`);

    // Step 2: Generate image and text in parallel
    console.log('[WORKFLOW] Step 2/2: Generating image and text in parallel');
    const [image, text] = await Promise.all([
      generateImage(imagePrompt),
      generateMessage(textPrompt),
    ]);
    console.log('[WORKFLOW] Step 2/2 complete. Image and text generated');

    console.log('[WORKFLOW] Birthday card generation complete!');
    return { image, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WORKFLOW] Error:`, message);
    throw error;
  }
};
