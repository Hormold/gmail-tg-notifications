import { z } from "zod";

export const formatEmailSummarySchema = z.object({
  overview: z
    .string()
    .describe("A brief overview of the email activity for the period"),
  importantEmails: z
    .array(
      z.object({
        title: z.string(),
        importance: z.number(),
        summary: z.string(),
      })
    )
    .describe(
      "A list of important emails with titles, importance ratings, summaries, and Telegram links"
    ),
  urgentActions: z
    .array(z.string())
    .optional()
    .describe("A list of urgent action items if applicable"),
});

export const analyzeEmailSchema = z.object({
  category: z.string().describe("The category of the email"),
  summary: z.string().describe("A brief summary of the email content"),
  importance: z
    .number()
    .describe("The importance rating of the email from 0 to 5"),
  deadline: z
    .string()
    .optional()
    .describe(
      "The deadline OR time of the event from email, if applicable. Return in format: HH:mm, DD/MM/YYYY OR DD/MM/YYYY. Do not convert time zones, just extract the data from the email"
    ),
  quickResponses: z
    .array(z.string())
    .max(3)
    .optional()
    .describe(
      "If this is human written email, return list of quick and short responses based on the email content. Max 3 items with up to 20 words each"
    ),
  actionSteps: z
    .array(z.string())
    .max(5)
    .optional()
    .describe(
      "List of concrete action steps based on the email content, with deadlines if applicable. Ignore if useless in this case!!"
    ),
  importantUrls: z
    .array(
      z.object({
        url: z.string(),
        text: z.string(),
      })
    )
    .max(5)
    .optional()
    .describe(
      "If email contains special URL to follow (confirmation, etc), extract them (+Text to display for the action link, if applicable) and provide here. Extract full links, not just domains!"
    ),
});
