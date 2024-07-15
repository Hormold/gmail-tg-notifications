import { bot } from "@telegram/index";
import { IMailObject } from ".";

const MAX_MESSAGE_LENGTH = 3500;

export const justSendMessage = async (chatId: number, message: string) => {
  if (!message) {
    throw new Error("Empty message");
  }

  const sent = await bot.telegram.sendMessage(chatId, message, {
    parse_mode: "HTML",
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
