import { BotCommand } from "@service/types";
import { Context, Middleware } from "telegraf";

const help: Middleware<Context> = async function (ctx) {
  ctx.replyWithHTML(
    "Tap /start to get started.\n\n" +
      "Tap /connect to subscribe for new emails.\n\n" +
      "To forward emails from gmail into specific chats " +
      "or channels you should enter command /set_chats and " +
      "list of chats ID separeted by whitespaces on second " +
      "line in such format :\n" +
      "<pre>" +
      "/set_chats\n" +
      "0000 0000 0000 0000" +
      "</pre>\n\n" +
      "Tap /delete_token to unsubscribe from gmail updates and delete creds.\n\n" +
      "Chats or channels ID you can get here: @userinfobot.\n" +
      "Tap /get_id to get id of group chat.",
    { reply_markup: { remove_keyboard: true } }
  );
};

export const description: BotCommand = {
  command: "help",
  description: "How to use this bot",
};

export default help;
