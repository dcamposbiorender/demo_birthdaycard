import { mockSendEmail } from '@/lib/mock-email';
import { generatePostcardEmailTemplate } from '@/lib/template';

type RsvpReply = {
  email: string;
  reply: string;
};

type RecipientEmailParams = {
  recipientEmail: string;
  cardImage: string;
  cardText: string;
  rsvpReplies: RsvpReply[];
};

/**
 * Step: Send the final birthday card to the recipient
 *
 * This step runs after:
 * 1. Image and text have been generated
 * 2. All RSVP responses have been collected (via webhooks)
 * 3. The event date has been reached (via sleep)
 *
 * KEY WORKFLOW FEATURE: This step may run days/weeks after the workflow started,
 * but all the earlier step results (image, text, RSVPs) are automatically preserved.
 */
export const sendRecipientEmail = async ({
  recipientEmail,
  cardImage,
  cardText,
  rsvpReplies,
}: RecipientEmailParams) => {
  'use step';

  try {
    console.log(`[STEP] Sending birthday card to recipient: ${recipientEmail}`);
    console.log(`[STEP] RSVP replies received:`, rsvpReplies);

    // Format RSVP replies for display in email
    const rsvpSummary = rsvpReplies
      .map(({ email, reply }) => `${email}: ${reply}`)
      .join('<br>');

    // Convert data URI to base64 content for attachment
    const base64Content = cardImage.split(',')[1];

    // Generate email HTML
    const html = generatePostcardEmailTemplate(
      'Happy Birthday!',
      `${cardText.replace(/\n/g, '<br>')}${rsvpSummary ? `<br><br><strong>RSVP Replies:</strong><br>${rsvpSummary}` : ''}`
    );

    // Send the email (mocked - just logs to console)
    await mockSendEmail({
      to: recipientEmail,
      subject: 'Happy Birthday!',
      html,
      attachments: [
        {
          filename: 'birthday-card.png',
          content: Buffer.from(base64Content, 'base64'),
          contentId: 'postcard',
        },
      ],
    });

    console.log('[STEP] Birthday card email sent successfully!');

    return {
      success: true,
      recipientEmail,
      sentAt: new Date().toISOString(),
      rsvpCount: rsvpReplies.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[STEP] Error sending recipient email:', message);
    throw error;
  }
};
