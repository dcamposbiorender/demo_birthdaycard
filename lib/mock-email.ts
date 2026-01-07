/**
 * Mock email service for demo purposes
 * Logs email details to console instead of actually sending
 * This allows us to demo the full workflow without Resend/domain setup
 */

type EmailParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentId?: string;
  }>;
};

export const mockSendEmail = async (params: EmailParams): Promise<{ id: string }> => {
  const emailId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  console.log('\n' + '='.repeat(60));
  console.log('[MOCK EMAIL] Would send email:');
  console.log('='.repeat(60));
  console.log(`  To: ${params.to}`);
  console.log(`  Subject: ${params.subject}`);
  console.log(`  ID: ${emailId}`);
  if (params.attachments?.length) {
    console.log(`  Attachments: ${params.attachments.map(a => a.filename).join(', ')}`);
  }
  console.log('-'.repeat(60));
  // Log a preview of the HTML (extract text content)
  const textPreview = params.html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  console.log(`  Preview: ${textPreview}...`);
  console.log('='.repeat(60) + '\n');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return { id: emailId };
};
