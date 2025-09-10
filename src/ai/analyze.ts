import { error, warning } from "@service/logging";
import { AnalysisResult, IMailObject } from "@service/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { IUser } from "@db/model/user";
import { openai } from "@ai/client";
import { BASE_MODEL_NAME, TRIAL_MODEL_NAME } from "@service/projectConstants";
import { analyzeEmailSchema } from "@ai/schemas";

dayjs.extend(utc);

export const analyzeEmail = async (
  email: IMailObject,
  user: IUser,
  tryCount = 0
): Promise<AnalysisResult> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not set");
  }

  const currentUTCTime = dayjs().utc().toISOString();
  const userLocalTime = dayjs()
    .utcOffset(user.timezoneUTCDiff ?? -7)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const response = await openai.beta.chat.completions.parse({
      model: user.isTrial ? TRIAL_MODEL_NAME : BASE_MODEL_NAME,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that analyzes emails and provides structured output with concrete action steps. Your final goal - help the user to manage their inbox more effectively. You can categorize emails, summarize their content, rate their importance, and suggest action steps based on the email content. Current time: ${currentUTCTime} (UTC), User time: ${userLocalTime} (UTC${
            user.timezoneUTCDiff ?? -7
          })`,
        },
        {
          role: "user",
          content: `Analyze the following email:

Subject: ${email.title}
From: ${email.from}
Date: ${email.date ?? currentUTCTime}
Body:
${email.message}

------
BE RUTHLESS WITH MARKETING SPAM. The user is SICK of irrelevant promotional bullshit.

Provide the following information via structured output (function call):
1. Category of the email: Personal, Work, Finance, Marketing, Bills, Other (specify)
2. Brief summary of the content (no more than 20 words)
3. Importance rating from 0 to 5, where:
   0 - ANY marketing email, newsletter, promotion, event announcement, or unsolicited message (DEFAULT FOR MOST EMAILS)
   1 - Important service notifications (password resets, account issues, payment confirmations)
   2 - Work-related or personal communications that require awareness but not immediate action
   3 - Important work emails or personal matters requiring action within days
   4 - Urgent work/personal matters requiring action within 24 hours
   5 - CRITICAL emergencies requiring immediate attention (security breaches, urgent deadlines TODAY)
4. Concrete action steps (up to 3) ONLY if rating is 2 or higher. For 0-1 emails, provide NO actions.
5. If email contains verification codes, passwords, or critical links, extract them.

AUTOMATIC 0/5 RATING FOR:
- ANY newsletter (regardless of content quality)
- Event announcements and meetups 
- Product updates and feature announcements
- Marketing emails with discounts/coupons
- AI/tech newsletters and industry updates
- Company blog posts and content marketing
- Social media notifications
- Any email trying to sell something or promote events

ONLY rate higher than 0 if it's:
- Direct personal communication
- Work-related from colleagues/clients
- Critical service notifications (security, billing issues)
- Legal/government communications
- Medical/health related
- Financial statements/alerts

Mandatory: Extract verification codes and add to summary.
For important urls: Only extract if rating ≥ 2. No marketing/promotional links ever.

The user wants ZERO marketing noise. Be aggressive about marking things as spam.

P.S. gmail.podelenko.pro is my shortened domain for links`,
        },
      ],
      tool_choice: "required",
      tools: [analyzeEmailSchema],
    });

    const functionCall = response?.choices?.[0]?.message?.tool_calls?.[0];
    if (functionCall && functionCall?.function) {
      const result = functionCall.function.parsed_arguments as AnalysisResult;
      return result;
    } else {
      warning("Unexpected response format from GPT API", response);
      throw new Error("Unexpected response format from GPT API");
    }
  } catch (err) {
    error("Error occured while analyzing email", err);
    // Try again on more time (max: 2 times)
    if (tryCount < 2) {
      return analyzeEmail(email, user, tryCount + 1);
    }
    throw err;
  }
};
