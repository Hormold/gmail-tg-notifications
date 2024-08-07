import { error, warning } from "@service/logging";
import { AnalysisResult, IMailObject } from "@service/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { IUser } from "@db/model/user";
import { openai } from "@ai/client";
import { BASE_MODEL_NAME, TRIAL_MODEL_NAME } from "@service/projectConstants";
import { zodFunction } from "openai/helpers/zod";
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
Provide the following information via structured output (function call):
1. Category of the email: Personal, Work, Finance, Marketing, Bills, Other (specify)
2. Brief summary of the content (no more than 20 words)
3. Importance rating from 0 to 5, where:
   0 - spam or useless marketing email (also newsletter, useless rewards or promotions, etc)
   1-2 - low importance (imporant notifications from services, etc)
   3-4 - medium importance (work-related, personal, etc)
   5 - high importance or requires immediate attention (urgent, important deadlines, etc)
4. Concrete action steps (up to 3) based on the email content. Include specific deadlines or time frames if applicable.
5. If email contains special urls or links, extract them and provide as a separate output

Spam examples: newsletters, irrelevant marketing emails, or unsolicited messages.
Mandatory: if email contains some VERIFICATION code (or any other important code), extract it and add it to summary! This is very important for the user to not miss it.
For important urls: extract realy useful links and important things, limit it to 5 and sort by importance.
Do not include useless and non helpful links like privacy policy, terms, marketing links, etc.

Important: All marketing emails without real good deals should be rated as 0.

Consider that emails with good discounts or beneficial promotions may receive a higher rating. But you should realy mark spam as spam`,
        },
      ],
      tool_choice: "required",
      tools: [
        zodFunction({ name: "analyzeEmail", parameters: analyzeEmailSchema }),
      ],
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
