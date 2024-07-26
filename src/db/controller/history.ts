import History, { IEmailHistory } from "@model/history";
import { error, success, warning } from "@service/logging";
import {
  AnalysisResult,
  IMailObject,
  TelegramMessageOutput,
} from "@service/types";
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

export async function UpdateBasicData(
  obj: Partial<IEmailHistory>,
  email: IMailObject
): Promise<boolean> {
  success(`Updating email ${obj.email}:${obj.messageId} with basic data`);

  return History.findOneAndUpdate(
    {
      email: obj.email,
      messageId: obj.messageId,
    },
    {
      from: email.from,
      title: email.title,
    }
  )
    .then(() => true)
    .catch((e) => {
      error("UpdateBasicData", e);
      return false;
    });
}

export async function FindHistoryByTelegramMessageId(
  messageId: number
): Promise<IEmailHistory | null> {
  return History.findOne({
    telegramMessageId: messageId,
  })
    .then((doc) => doc)
    .catch((e) => {
      error("FindHistoryByTelegramMessageId", e);
      return null;
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
        unsubscribeLink: obj.unsubscribeLink,
        actionSteps: analysis.actionSteps,
        processedAt: new Date(),
        processingDetails,
        category: analysis.category,
        importance: analysis.importance,
        summary: analysis.summary,
        importantUrls: analysis.importantUrls,
        deadline: analysis.deadline,
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
  email: IMailObject,
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
      from: email.from,
      title: email.title,
      summary: emailAnalyze.summary,
      importantUrls: emailAnalyze.importantUrls,
      deadline: emailAnalyze.deadline,
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
