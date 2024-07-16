import { bot } from "@telegram/index";
import { IMailObject } from "types";

const MAX_MESSAGE_LENGTH = 3500;

export const justSendMessage = async (
  chatId: number,
  message: string,
  mailId: string,
  unsubscribeLink?: string
) => {
  if (!message) {
    throw new Error("Empty message");
  }
  // with emoji all buttons!
  const buttons = [
    [
      {
        text: "🚫 Blacklist",
        callback_data: `blacklist:${mailId}`,
      },
      {
        text: "🗑 Remove",
        callback_data: `remove:${mailId}`,
      },
      {
        text: "🔍 Get full",
        callback_data: `full:${mailId}`,
      },
    ],
  ] as any;

  if (unsubscribeLink) {
    buttons.push([
      {
        text: "🔇 Unsubscribe",
        url: unsubscribeLink,
      },
    ]);
  }

  const sent = await bot.telegram.sendMessage(chatId, message, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
  return sent;
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
