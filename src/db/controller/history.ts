import History, { IEmailHistory } from "@model/history";
import { error, success, warning } from "@service/logging";
import { AnalysisResult, TelegramMessageOutput } from "@service/types";
import dayjs from "dayjs";

export async function AddEmailToHistoryIfNew(
  obj: Partial<IEmailHistory>
): Promise<boolean | IEmailHistory> {
  const exists = await History.findOne({
    email: obj.email,
    messageId: obj.messageId,
    processedAt: null,
  });
  if (exists) {
    return false;
  }

  success(`Adding email ${obj.email}:${obj.messageId} to history`);

  return await History.create({
    email: obj.email,
    messageId: obj.messageId,
  });
}

export async function NotProcessEmail(
  obj: Partial<IEmailHistory>,
  processingDetails: string,
  analysis?: AnalysisResult
): Promise<IEmailHistory | null> {
  warning(
    `Not processing email ${obj.email}:${obj.messageId} because ${processingDetails}`
  );

  // Save, but not notify
  if (analysis) {
    return History.findOneAndUpdate(
      {
        email: obj.email,
        messageId: obj.messageId,
      },
      {
        from: obj.from,
        title: obj.title,
        unsubscribeLink: obj.unsubscribeLink,
        actionSteps: analysis.actionSteps,
        processedAt: new Date(),
        processingDetails,
        category: analysis.category,
        importance: analysis.importance,
        summary: analysis.summary,
        importantUrls: analysis.importantUrls,
        deadline: dayjs(analysis.deadline).toDate(),
      }
    )
      .then((doc) => doc)
      .catch((e) => {
        error("NotProcessEmail", e);
        return null;
      });
  }

  return History.findOneAndUpdate(
    {
      email: obj.email,
      messageId: obj.messageId,
    },
    {
      processedAt: new Date(),
      processingDetails,
    }
  )
    .then((doc) => doc)
    .catch((e) => {
      error("NotProcessEmail", e);
      return null;
    });
}

export async function UpdateEmailAnalysis(
  obj: Partial<IEmailHistory>,
  emailAnalyze: AnalysisResult,
  telegramMessage: TelegramMessageOutput
) {
  success(`Updating email ${obj.email}:${obj.messageId} with analysis`);

  return History.findOneAndUpdate(
    {
      email: obj.email,
      messageId: obj.messageId,
    },
    {
      category: emailAnalyze.category,
      importance: emailAnalyze.importance,
      from: obj.from,
      title: obj.title,
      summary: emailAnalyze.summary,
      importantUrls: emailAnalyze.importantUrls,
      deadline: dayjs(emailAnalyze.deadline).toDate(),
      unsubscribeLink: obj.unsubscribeLink,

      telegramMessageText: telegramMessage.messageText,
      telegramMessageId: telegramMessage.messageId,
      telegramMessageButtons: telegramMessage.messageButtons,

      processedAt: new Date(),
      processingDetails: "Email has been processed",
    }
  )
    .then(() => true)
    .catch((e) => {
      error("UpdateEmailAnalysis", e);
      return false;
    });
}
