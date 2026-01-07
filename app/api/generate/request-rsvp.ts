import { mockSendEmail } from '@/lib/mock-email';
import { generateRsvpEmailTemplate } from '@/lib/template';

/**
 * Step: Send RSVP request email
 *
 * This step sends an RSVP email with Yes/No buttons that link to a webhook URL.
 * The workflow will pause until the recipient clicks one of the buttons.
 *
 * KEY WORKFLOW FEATURE: The webhook URL is created by createWebhook() in the
 * parent workflow. When clicked, it resumes the paused workflow with the response.
 */
export const requestRsvp = async (email: string, webhookUrl: string) => {
  'use step';

  try {
    console.log(`[STEP] Sending RSVP request to: ${email}`);
    console.log(`[STEP] Webhook URL: ${webhookUrl}`);

    // Generate the email HTML with Yes/No buttons
    const html = generateRsvpEmailTemplate(email, webhookUrl);

    // Send the email (mocked - just logs to console)
    await mockSendEmail({
      to: email,
      subject: "You're Invited to a Birthday Party!",
      html,
    });

    // Also log the clickable URLs for easy testing
    const yesUrl = `${webhookUrl}?reply=yes&email=${encodeURIComponent(email)}`;
    const noUrl = `${webhookUrl}?reply=no&email=${encodeURIComponent(email)}`;

    console.log('\n[STEP] RSVP Links (click to simulate response):');
    console.log(`  YES: ${yesUrl}`);
    console.log(`  NO:  ${noUrl}\n`);

    return { email, success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[STEP] Error sending RSVP email:', message);
    throw error;
  }
};
