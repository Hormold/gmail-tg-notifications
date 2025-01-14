import EmailHistory, { IEmailHistory } from "@model/history";
import EmailSummary, { IEmailSummary } from "@model/summary";
import { openai } from "./client";
import { BASE_MODEL_NAME } from "@service/projectConstants";
import { error } from "@service/logging";
import { zodFunction } from "openai/helpers/zod";
import { formatEmailSummarySchema } from "./schemas";

export async function generateGroupEmailSummary(
  emails: string[],
  summaryType: "morning" | "evening" | "24hours"
): Promise<IEmailSummary> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (summaryType) {
    case "morning":
    case "evening":
      startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      break;
    case "24hours":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
  }

  const emailHistories = await EmailHistory.find({
    email: { $in: emails },
    from: { $ne: null },
    importance: { $ne: 0 }, // Ignore spam emails
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
    .slice(0, 15)
    .map((email) => ({
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
    const response = await openai.beta.chat.completions.parse({
      model: BASE_MODEL_NAME,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes emails and provides structured output with concrete action steps. Your final goal - help the user to manage their inbox more effectively. You can categorize emails, summarize their content, rate their importance, and suggest action steps based on the email content. Today: ${new Date().toISOString()}. Ignore verification emails (only keep unusual activiy notifcations), newsletters, and spam.`,
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
      tools: [formatEmailSummarySchema],
      tool_choice: "required",
    });

    const toolCalls = response?.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCalls && toolCalls?.function) {
      const summaryData = toolCalls.function.parsed_arguments;
      return formatSummaryTelegramHTML(periodText, summaryData);
    } else {
      return (
        response.choices[0].message.content || "Unable to generate summary."
      );
    }
  } catch (err) {
    error("Error generating overall summary:", err);
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
