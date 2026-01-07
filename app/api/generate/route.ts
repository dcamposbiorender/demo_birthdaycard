import { NextResponse } from 'next/server';
import { FatalError } from 'workflow';
import { start } from 'workflow/api';
import { generateBirthdayCard } from '@/app/api/generate/generate-birthday-card';

/**
 * API route for birthday card generation
 *
 * Parameters:
 * - prompt (required): Description of the birthday card
 * - recipientEmail (required): Email of the birthday person
 * - rsvpEmails (optional): Array of guest emails for RSVP
 * - eventDate (optional): When to send the card (ISO string)
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

    // Start the workflow with all parameters
    const result = await start(generateBirthdayCard, [
      prompt,
      recipientEmail,
      rsvpEmails,
      eventDate ? new Date(eventDate) : undefined,
    ]);

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
