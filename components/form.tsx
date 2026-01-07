'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';

/**
 * Form schema for birthday card generation
 * Demonstrates the full workflow with RSVP collection
 */
const formSchema = z.object({
  prompt: z.string().min(1, {
    message: 'Prompt is required.',
  }),
  recipientEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  eventDate: z.date().optional(),
  rsvpEmail1: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')),
  rsvpEmail2: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')),
  rsvpEmail3: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export const BirthdayCardForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    image?: string;
    text?: string;
    rsvpReplies?: Array<{ email: string; reply: string }>;
    status?: string;
    message?: string;
    note?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      prompt: '',
      recipientEmail: '',
      rsvpEmail1: '',
      rsvpEmail2: '',
      rsvpEmail3: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Collect non-empty RSVP emails
      const rsvpEmails = [
        values.rsvpEmail1,
        values.rsvpEmail2,
        values.rsvpEmail3,
      ].filter((email) => email && email.trim().length > 0);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: values.prompt,
          recipientEmail: values.recipientEmail,
          eventDate: values.eventDate?.toISOString(),
          rsvpEmails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate birthday card');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPrompt = form.watch('prompt').trim().length > 0;
  const hasRecipient = form.watch('recipientEmail').trim().length > 0;

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipient Email */}
          <FormField
            control={form.control}
            name="recipientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Email (birthday person)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="birthday-person@example.com"
                    className="bg-background"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Date (optional) */}
          <FormField
            control={form.control}
            name="eventDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Birthday Date (optional - demo uses 10s delay)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prompt */}
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Describe the birthday card you want to create
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="I want a beach image with a message that says 'Happy Birthday!' and something nice."
                    disabled={isSubmitting}
                    className="bg-background min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RSVP Emails */}
          <div className="space-y-2">
            <FormLabel>RSVP Emails (optional - triggers webhook wait)</FormLabel>
            <p className="text-muted-foreground text-xs">
              Add guests to demonstrate the webhook feature. The workflow will pause until they respond.
            </p>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="rsvpEmail1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="guest1@example.com"
                        className="bg-background"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rsvpEmail2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="guest2@example.com"
                        className="bg-background"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rsvpEmail3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="guest3@example.com"
                        className="bg-background"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !hasPrompt || !hasRecipient}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Generating (check console for webhook URLs)...
              </>
            ) : (
              <>Generate Birthday Card</>
            )}
          </Button>
        </form>
      </Form>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-900">
          <p className="font-medium text-sm">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Dialog for completed workflow (image + text) */}
      <Dialog open={Boolean(result?.image && result?.text)} onOpenChange={() => setResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Your Birthday Card</DialogTitle>
          </DialogHeader>
          {result?.image && (
            <img
              alt="Generated birthday card"
              className="w-full rounded-md"
              src={result.image}
            />
          )}
          {result?.text && (
            <p className="text-sm whitespace-pre-wrap">{result.text}</p>
          )}
          {result?.rsvpReplies && result.rsvpReplies.length > 0 && (
            <div className="border-t pt-4">
              <p className="font-medium text-sm mb-2">RSVP Responses:</p>
              <ul className="text-sm space-y-1">
                {result.rsvpReplies.map((rsvp, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{rsvp.email}</span>
                    <span className={rsvp.reply === 'yes' ? 'text-green-600' : 'text-red-600'}>
                      {rsvp.reply}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for async workflow (started with RSVPs) */}
      <Dialog open={Boolean(result?.status === 'started')} onOpenChange={() => setResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Workflow Started!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">{result?.message}</p>
            {result?.note && (
              <p className="text-muted-foreground text-xs">{result.note}</p>
            )}
            <div className="border-t pt-4">
              <p className="font-medium text-sm mb-2">What happens next:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Image and text are generated (OpenAI)</li>
                <li>RSVP emails are sent (mocked to logs)</li>
                <li>Workflow pauses until RSVP links are clicked</li>
                <li>After 10s sleep, birthday card is sent</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
