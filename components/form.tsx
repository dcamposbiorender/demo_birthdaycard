'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

/**
 * Simplified form schema (POC)
 * - Only requires prompt
 * - Removed email/RSVP/date fields
 */
const formSchema = z.object({
  prompt: z.string().min(1, {
    message: 'Prompt is required.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const BirthdayCardForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: values.prompt,
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

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <Button
            type="submit"
            disabled={isSubmitting || !hasPrompt}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Generating...
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
        </DialogContent>
      </Dialog>
    </div>
  );
};
