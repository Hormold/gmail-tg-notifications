export const formatEmailSummarySchema = {
  type: "function",
  function: {
    name: "format_email_summary",
    strict: true,
    description: "Formats the email summary",
    parameters: {
      type: "object",
      properties: {
        overview: {
          type: "string",
          description: "A brief overview of the email activity for the period",
        },
        importantEmails: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              importance: { type: "number" },
              summary: { type: "string" },
            },
            additionalProperties: false,
            required: ["title", "import", "summary"],
          },
          description:
            "A list of important emails with titles, importance ratings, summaries, and Telegram links",
        },
        urgentActions: {
          type: "array",
          items: { type: "string" },
          description: "A list of urgent action items if applicable",
        },
      },
      required: ["overview", "importantEmails", "urgentActions"],
      additionalProperties: false,
    },
  },
} as const;

export const analyzeEmailSchema = {
  type: "function",
  function: {
    name: "analyze_email",
    strict: true,
    description:
      "Analyzes an email and returns structured information about it",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "The category of the email",
        },
        summary: {
          type: "string",
          description: "A brief summary of the email content",
        },
        importance: {
          type: "number",
          description: "The importance rating of the email from 0 to 5",
        },
        deadline: {
          type: "string",
          description:
            "The deadline OR time of the event from email, if applicable. Return in format: HH:mm, DD/MM/YYYY OR DD/MM/YYYY. Do not convet time zones, just extract the data from the email. Empty if not applicable",
        },
        /*quickReponses: {
          type: "array",
          items: { type: "string" },
          description:
            "If this is human written email, return list of quick and short responses based on the email content. IMPORTANT: Max 3 items with up to 20 words each",
        },*/
        actionSteps: {
          type: "array",
          items: { type: "string" },
          description:
            "List of concrete action steps based on the email content, with deadlines if applicable. Ignore if useless in this case! IMPORTANT: Max 5 items, empty if not applicable",
        },
        importantUrls: {
          description:
            "If email contains special URL to follow (confirmation, etc), extract them (+Text to display for the action link, if applicable) and provide here. Extract full links, not just domains! IMPORTANT: Max 5 items, empty if not applicable",
          type: "array",
          items: {
            type: "object",
            properties: {
              url: { type: "string" },
              text: { type: "string" },
            },
            required: ["url", "text"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "category",
        "summary",
        "importance",
        "actionSteps",
        "deadline",
        "importantUrls",
      ],
      additionalProperties: false,
    },
  },
} as const;
