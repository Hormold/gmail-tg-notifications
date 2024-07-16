import OpenAI from "openai";
import crypto from "crypto";
import { IMailObject } from "types";

interface AnalysisResult {
  category: string;
  summary: string;
  importance: number;
  actionSteps: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeEmail(email: IMailObject) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not set");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that analyzes emails and provides structured output with concrete action steps. Your final goal - help the user to manage their inbox more effectively. You can categorize emails, summarize their content, rate their importance, and suggest action steps based on the email content.",
        },
        {
          role: "user",
          content: `Analyze the following email:

Subject: ${email.title}
From: ${email.from}
Body:
${email.rawMessage}

Provide the following information via structured output (function call):
1. Category of the email: Personal, Work, Finance, Marketing, Bills, Other (specify)
2. Brief summary of the content (no more than 20 words)
3. Importance rating from 0 to 5, where:
   0 - spam or useless marketing email (also useless rewards or promotions, etc)
   1-2 - low importance (newsletters, notifications, etc)
   3-4 - medium importance (work-related, personal, etc)
   5 - high importance or requires immediate attention (urgent, important deadlines, etc)
4. Concrete action steps (up to 3) based on the email content. Include specific deadlines or time frames if applicable.

Spam examples: newsletters, irrelevant marketing emails, or unsolicited messages.
If this is login, password, otp code, etc - extract it and send to user.

Consider that emails with good discounts or beneficial promotions may receive a higher rating.`,
        },
      ],
      functions: [
        {
          name: "analyze_email",
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
              actionSteps: {
                type: "array",
                items: { type: "string" },
                description:
                  "List of concrete action steps based on the email content, with deadlines if applicable or ignore if not needed",
              },
            },
            required: ["category", "summary", "importance"],
          },
        },
      ],
      function_call: { name: "analyze_email" },
    });

    const functionCall = response.choices[0].message.function_call;
    if (functionCall && functionCall.name === "analyze_email") {
      const result = JSON.parse(functionCall.arguments || "{}");
      return result as AnalysisResult;
    } else {
      throw new Error("Unexpected response format from GPT API");
    }
  } catch (error) {
    console.error("Error analyzing email:", error);
    throw error;
  }
}

function createTelegramMessage(
  email: IMailObject,
  emailTo: string,
  analysis: AnalysisResult
): { text: string; id: string; unsubscribeLink: string | null } | null {
  let importanceEmoji = "";
  let importanceText = "";

  switch (analysis.importance) {
    case 0:
      return null;
    case 1:
      importanceEmoji = "⚪️";
      importanceText = "Low importance";
      break;
    case 2:
      importanceEmoji = "🔵";
      importanceText = "Moderate importance";
      break;
    case 3:
      importanceEmoji = "🟢";
      importanceText = "Important";
      break;
    case 4:
      importanceEmoji = "🟠";
      importanceText = "Very important";
      break;
    case 5:
      importanceEmoji = "🔴";
      importanceText = "Urgent";
      break;
  }

  let md5Email = crypto
    .createHash("md5")
    .update(emailTo)
    .digest("hex")
    .slice(0, 5);

  let actionSteps =
    analysis.actionSteps && analysis.actionSteps.length
      ? analysis.actionSteps
          .map((step, index) => `${index + 1}. ${step}`)
          .join("\n")
      : "No specific action steps recommended";

  return {
    text: `${escapeHTML(email.title)}
${importanceEmoji} <b>${importanceText}</b> for <b>${emailTo}</b>
<b>From:</b> ${escapeHTML(email.from)}
<b>Category:</b> ${escapeHTML(analysis.category)}
<i>Importance: ${analysis.importance}/5</i>

${escapeHTML(analysis.summary)}

<b>Recommended Actions:</b>
${escapeHTML(actionSteps)}`,
    id: `${md5Email}_${email.id}`,
    unsubscribeLink: email.unsubscribeLink,
  };
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function processEmail(email: IMailObject, emailTo: string) {
  const analysis = await analyzeEmail(email);
  return createTelegramMessage(email, emailTo, analysis);
}
