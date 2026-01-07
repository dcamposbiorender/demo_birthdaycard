import { NextResponse } from 'next/server';
import { FatalError } from 'workflow';
import { start } from 'workflow/api';
import { generateBirthdayCard } from '@/app/api/generate/generate-birthday-card';

/**
 * API route for birthday card generation
 *
 * IMPORTANT: For workflows with webhooks/sleep, we can't wait for completion
 * because Vercel serverless functions timeout after 10-60 seconds.
 *
 * Two modes:
 * - Without RSVP emails: Wait for full completion (image + text only)
 * - With RSVP emails: Start workflow and return immediately with workflow ID
 *   The workflow continues in the background waiting for webhook clicks.
 */
export const POST = async (request: Request): Promise<NextResponse> => {
  try {
    const body = await request.json();
    const { prompt, recipientEmail, rsvpEmails = [], eventDate } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Start the workflow
    const result = await start(generateBirthdayCard, [
      prompt,
      recipientEmail,
      rsvpEmails,
      eventDate ? new Date(eventDate) : undefined,
    ]);

    // If there are RSVP emails, we can't wait - return workflow ID immediately
    // The workflow will pause at the webhook step and continue when users click
    if (rsvpEmails.length > 0) {
      return NextResponse.json({
        status: 'started',
        message: 'Workflow started! Check server logs for webhook URLs to simulate RSVP responses.',
        workflowId: result.workflowId,
        note: 'The workflow is now waiting for RSVP responses. In a real app, you would poll for status or use a webhook callback.',
      });
    }

    // Without RSVP emails, we can wait for completion (just image + text + sleep)
    // This should complete within the serverless timeout
    const values = await result.returnValue;

    return NextResponse.json(values);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isFatal = error instanceof FatalError;

    return NextResponse.json(
      {
        error: message,
        fatal: isFatal,
      },
      { status: isFatal ? 400 : 500 }
    );
  }
};
