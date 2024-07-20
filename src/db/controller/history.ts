import History, { IEmailHistory } from "@model/history";
import { error, success, warning } from "@service/logging";
import { AnalysisResult } from "types";

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
  processingDetails: string
): Promise<IEmailHistory | null> {
  warning(
    `Not processing email ${obj.email}:${obj.messageId} because ${processingDetails}`
  );

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
  emailAnalyze: AnalysisResult
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
