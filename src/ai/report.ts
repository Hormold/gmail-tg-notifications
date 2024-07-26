import EmailHistory, { IEmailHistory } from "@model/history";
import EmailSummary, { IEmailSummary } from "@model/summary";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateGroupEmailSummary(
  emails: string[],
  summaryType: "morning" | "evening" | "24hours"
): Promise<IEmailSummary> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (summaryType) {
    case "morning":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "evening":
      startDate = new Date(now.setHours(12, 0, 0, 0));
      break;
    case "24hours":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
  }

  const emailHistories = await EmailHistory.find({
    email: { $in: emails },
    from: { $ne: null },
    processedAt: { $gte: startDate, $lte: endDate },
  }).sort({ processedAt: 1 });

  if (!emailHistories.length) {
    throw new Error("No emails found for the specified period");
  }

  const emailCounts: Record<string, number> = {};
  emails.forEach((email) => {
    emailCounts[email] = emailHistories.filter(
      (history) => history.email === email
    ).length;
  });

  const importantEmails = emailHistories
    .filter((email) => email.importance >= 4)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .map((email) => ({
      messageId: email.messageId,
      title: email.title || "",
      importance: email.importance,
      from: email.from,
      email: email.email,
    }));

  const generalSummary = await generateGeneralSummary(
    emailHistories,
    summaryType,
    startDate,
    endDate
  );

  const summary: IEmailSummary = new EmailSummary({
    summaryType,
    startDate,
    endDate,
    summaryText: generalSummary,
    emailCount: emailHistories.length,
    emailCounts,
    importantEmails,
  });

  await summary.save();
  return summary;
}

async function generateGeneralSummary(
  emails: IEmailHistory[],
  summaryType: "morning" | "evening" | "24hours",
  startDate: Date,
  endDate: Date
): Promise<string> {
  const periodText =
    summaryType === "24hours"
      ? "the last 24 hours"
      : summaryType === "morning"
      ? "this morning"
      : "this evening";

  const emailSummaries = emails.map((email) => ({
    category: email.category,
    summary: email.summary,
    importance: email.importance,
    actionSteps: email.actionSteps,
    from: email.from,
    title: email.title,
    email: email.email,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes emails and provides structured output with concrete action steps. Your final goal - help the user to manage their inbox more effectively. You can categorize emails, summarize their content, rate their importance, and suggest action steps based on the email content. Today: ${new Date().toISOString()}`,
        },
        {
          role: "user",
          content: `Generate a concise summary of email activity for ${periodText} (${startDate.toLocaleString()} - ${endDate.toLocaleString()}). 
          Total emails received: ${emails.length}

          Email summaries:
          ${JSON.stringify(emailSummaries, null, 2)}

          Please provide:
          1. A brief overview of the email activity for the period
          2. Highlight the most important emails or trends (up to 5)
          3. Summarize any urgent action items if applicable`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "format_email_summary",
            description: "Formats the email summary",
            parameters: {
              type: "object",
              properties: {
                overview: {
                  type: "string",
                  description:
                    "A brief overview of the email activity for the period",
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
              required: ["overview", "importantEmails"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const toolCalls = response.choices[0].message.tool_calls;
    if (toolCalls && toolCalls[0].function.name === "format_email_summary") {
      const summaryData = JSON.parse(toolCalls[0].function.arguments);
      return formatSummaryTelegramHTML(periodText, summaryData);
    } else {
      return (
        response.choices[0].message.content || "Unable to generate summary."
      );
    }
  } catch (error) {
    console.error("Error generating overall summary:", error);
    return "Error generating overall summary. Please check the logs for more information.";
  }
}

function formatSummaryTelegramHTML(
  periodText: string,
  summaryData: any
): string {
  let formattedSummary = `<b>Email Summary for ${periodText}</b>\n\n`;
  formattedSummary += `<b>Overview</b>\n${summaryData.overview}\n\n`;

  formattedSummary += `<b>Important Emails</b>\n`;
  summaryData.importantEmails.forEach((email: any) => {
    formattedSummary += `• <b>${email.title}</b> (Importance: ${email.importance})\n  ${email.summary}\n\n`;
  });

  if (summaryData.urgentActions.length > 0) {
    formattedSummary += `<b>Urgent Actions</b>\n`;
    summaryData.urgentActions.forEach((action: string) => {
      formattedSummary += `• ${action}\n`;
    });
  }

  return formattedSummary;
}
