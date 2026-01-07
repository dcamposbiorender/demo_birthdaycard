import { createWebhook, sleep } from 'workflow';
import { generateImage } from './generate-image';
import { generateMessage } from './generate-message';
import { generatePrompts } from './generate-prompts';
import { requestRsvp } from './request-rsvp';
import { sendRecipientEmail } from './send-recipient-email';

/**
 * Full Birthday Card Workflow - Demonstrates Vercel Workflow DevKit Features
 *
 * This workflow showcases:
 * 1. `'use workflow'` - Marks this as a durable workflow
 * 2. `'use step'` - Each step's result is persisted (in child functions)
 * 3. `createWebhook()` - Pauses workflow until external event (RSVP click)
 * 4. `sleep()` - Pauses workflow until a specific date/time
 * 5. Automatic retries - Failed steps retry with exponential backoff
 *
 * The workflow can span DAYS between steps (e.g., waiting for birthday date)
 * and will resume exactly where it left off, even across server restarts.
 */
export const generateBirthdayCard = async (
  prompt: string,
  recipientEmail: string,
  rsvpEmails: string[],
  eventDate?: Date
) => {
  'use workflow';

  // For demo purposes, use 10 seconds instead of actual date
  // In production, you'd use the real eventDate
  const sleepDuration = '10 seconds';

  try {
    console.log('\n' + '='.repeat(70));
    console.log('[WORKFLOW] Starting birthday card generation');
    console.log('='.repeat(70));
    console.log(`  Prompt: ${prompt}`);
    console.log(`  Recipient: ${recipientEmail}`);
    console.log(`  RSVP guests: ${rsvpEmails.join(', ') || '(none)'}`);
    console.log(`  Event date: ${eventDate?.toISOString() || '(demo: 10 seconds)'}`);
    console.log('='.repeat(70) + '\n');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Generate prompts for image and text
    // ─────────────────────────────────────────────────────────────────────
    console.log('[WORKFLOW] Step 1/5: Generating text and image prompts...');
    const { textPrompt, imagePrompt } = await generatePrompts(prompt);
    console.log('[WORKFLOW] Step 1/5 COMPLETE');
    console.log(`  Text prompt: ${textPrompt.slice(0, 50)}...`);
    console.log(`  Image prompt: ${imagePrompt.slice(0, 50)}...\n`);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Generate image and text in parallel
    // ─────────────────────────────────────────────────────────────────────
    console.log('[WORKFLOW] Step 2/5: Generating image and text in parallel...');
    const [image, text] = await Promise.all([
      generateImage(imagePrompt),
      generateMessage(textPrompt),
    ]);
    console.log('[WORKFLOW] Step 2/5 COMPLETE');
    console.log(`  Image: ${image.slice(0, 50)}... (${Math.round(image.length / 1024)}KB)`);
    console.log(`  Text: ${text.slice(0, 100)}...\n`);

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Send RSVP emails and wait for responses (WEBHOOK FEATURE)
    // ─────────────────────────────────────────────────────────────────────
    let rsvpReplies: Array<{ email: string; reply: string }> = [];

    if (rsvpEmails.length > 0) {
      console.log('[WORKFLOW] Step 3/5: Sending RSVP emails...');
      console.log('  Creating webhooks for each guest...');

      // Create a webhook for each RSVP recipient
      // These URLs will pause the workflow until clicked
      const webhooks = rsvpEmails.map(() => createWebhook());

      // Send RSVP emails with webhook URLs
      await Promise.all(
        rsvpEmails.map((email, i) => requestRsvp(email, webhooks[i].url))
      );

      console.log('[WORKFLOW] RSVP emails sent! Waiting for responses...');
      console.log('  (Click the YES/NO URLs logged above to simulate responses)\n');

      // Wait for ALL webhooks to be triggered
      // The workflow PAUSES here until each person clicks their link
      rsvpReplies = await Promise.all(
        webhooks.map((webhook) => {
          return webhook.then((request) => {
            const url = new URL(request.url);
            const reply = url.searchParams.get('reply') || 'no-response';
            const email = url.searchParams.get('email') || 'unknown';
            console.log(`[WORKFLOW] RSVP received: ${email} = ${reply}`);
            return { email, reply };
          });
        })
      );

      console.log('[WORKFLOW] Step 3/5 COMPLETE - All RSVPs collected');
      console.log(`  Replies: ${JSON.stringify(rsvpReplies)}\n`);
    } else {
      console.log('[WORKFLOW] Step 3/5: SKIPPED (no RSVP emails provided)\n');
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Wait until event date (SLEEP FEATURE)
    // ─────────────────────────────────────────────────────────────────────
    console.log('[WORKFLOW] Step 4/5: Waiting until event date...');
    console.log(`  Sleep duration: ${sleepDuration}`);
    console.log('  (In production, this could be days/weeks)\n');

    // The workflow PAUSES here until the sleep duration passes
    // Even if the server restarts, it will resume at the right time
    await sleep(sleepDuration);

    console.log('[WORKFLOW] Step 4/5 COMPLETE - Event date reached!\n');

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Send the birthday card to the recipient
    // ─────────────────────────────────────────────────────────────────────
    console.log('[WORKFLOW] Step 5/5: Sending birthday card to recipient...');

    await sendRecipientEmail({
      recipientEmail,
      cardImage: image,
      cardText: text,
      rsvpReplies,
    });

    console.log('[WORKFLOW] Step 5/5 COMPLETE\n');

    // ─────────────────────────────────────────────────────────────────────
    // WORKFLOW COMPLETE
    // ─────────────────────────────────────────────────────────────────────
    console.log('='.repeat(70));
    console.log('[WORKFLOW] BIRTHDAY CARD WORKFLOW COMPLETE!');
    console.log('='.repeat(70));
    console.log(`  Total RSVP responses: ${rsvpReplies.length}`);
    console.log(`  Card sent to: ${recipientEmail}`);
    console.log('='.repeat(70) + '\n');

    return { image, text, rsvpReplies };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WORKFLOW] ERROR: ${message}`);
    throw error;
  }
};
