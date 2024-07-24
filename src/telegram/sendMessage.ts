import { bot } from "@telegram/index";
import { MAX_MESSAGE_LENGTH } from "@service/projectConstants";
import crypto from "crypto";
import dayjs from "dayjs";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import {
  AnalysisResult,
  IMailObject,
  TelegramMessageOutput,
} from "@service/types";
import { isValidUrl } from "@service/utils";
import { emailTemplate, getImportanceInfo } from "./template";

export const sendErrorMessage = async (chatId: number, error: Error) => {
  await bot.telegram.sendMessage(
    chatId,
    `Error occured while processing email: ${error?.message}`
  );
};

export const createTelegramMessage = async (
  chatId: number,
  email: IMailObject,
  emailTo: string,
  analysis: AnalysisResult
): Promise<TelegramMessageOutput> => {
  const { emoji: importanceEmoji, text: importanceText } = getImportanceInfo(
    analysis.importance
  );

  // Validate deadline if present
  let deadline = null;
  if (analysis.deadline) {
    const deadlineParsed = dayjs(analysis.deadline);
    if (deadlineParsed.isValid()) {
      deadline = deadlineParsed.toDate();
    }
  }

  const md5Email = crypto
    .createHash("md5")
    .update(emailTo)
    .digest("hex")
    .slice(0, 5);

  const message = {
    text: emailTemplate({
      importanceEmoji,
      from: email.from,
      emailTo,
      importance: analysis.importance,
      title: email.title,
      importanceText,
      category: analysis.category,
      summary: analysis.summary,
      actionSteps: analysis.actionSteps || [],
      deadline,
    }),
    id: `${md5Email}_${email.id}`,
    unsubscribeLink: email.unsubscribeLink,
    importantUrls: analysis.importantUrls,
  };

  const buttons: InlineKeyboardButton[][] = [
    [
      {
        text: "🚫 Blacklist",
        callback_data: `blacklist:${message.id}`,
      },
      {
        text: "🗑 Remove",
        callback_data: `remove:${message.id}`,
      },
      {
        text: "🔍 Show more",
        callback_data: `full:${message.id}`,
      },
    ],
  ];

  if (message.unsubscribeLink && isValidUrl(message.unsubscribeLink)) {
    buttons.push([
      {
        text: "🔇 Unsubscribe",
        url: message.unsubscribeLink,
      },
    ]);
  }

  if (message.importantUrls) {
    for (const url of message.importantUrls) {
      if (!url.url || !isValidUrl(url.url)) {
        continue;
      }
      buttons.push([
        {
          text: `🔗 ${url.text ?? "Open link"}`,
          url: url.url,
        },
      ]);
    }
  }

  try {
    const tgMessage = await bot.telegram.sendMessage(chatId, message.text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
    return {
      success: true,
      messageText: message.text,
      messageButtons: buttons,
      messageId: tgMessage.message_id,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error sending message: ${(error as Error).message}`,
    };
  }
};

export const sendMessageWithAttachments = async (
  chatId: number,
  mailObject: IMailObject
) => {
  if (!mailObject.message) {
    throw new Error("Empty message");
  }

  const message =
    mailObject.message.length > MAX_MESSAGE_LENGTH
      ? `${mailObject.message.substr(
          0,
          MAX_MESSAGE_LENGTH
        )}\nMessage exceeded max length`
      : mailObject.message;

  const sent = await bot.telegram.sendMessage(chatId, message);

  await Promise.all(
    mailObject.attachments.map((attachment) =>
      bot.telegram.sendDocument(
        chatId,
        { filename: attachment.name, source: attachment.data },
        { reply_parameters: { message_id: sent.message_id } }
      )
    )
  );
};
