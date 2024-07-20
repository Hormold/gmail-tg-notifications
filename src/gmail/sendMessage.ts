import { bot } from "@telegram/index";
import { MAX_MESSAGE_LENGTH } from "@service/projectConstants";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";
import { IMailObject, TelegramMessageObject } from "@service/types";

export const sendErrorMessage = async (chatId: number, error: Error) => {
  await bot.telegram.sendMessage(
    chatId,
    `Error occured while processing email: ${error?.message}`
  );
};

export const justSendMessage = async (
  chatId: number,
  message: TelegramMessageObject
) => {
  if (!message) {
    throw new Error("Empty message");
  }

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

  if (message.unsubscribeLink) {
    buttons.push([
      {
        text: "🔇 Unsubscribe",
        url: message.unsubscribeLink,
      },
    ]);
  }

  if (message.importantUrls) {
    for (const url of message.importantUrls) {
      buttons.push([
        {
          text: `🔗 ${url.text}`,
          url: url.url,
        },
      ]);
    }
  }

  return bot.telegram.sendMessage(chatId, message.text, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
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
