import { Context, Middleware } from "telegraf";
import { BotCommand } from "@telegram/common";

const getId: Middleware<Context> = async function (ctx) {
  ctx.reply(ctx.chat.id.toString());
};

export const desrciption: BotCommand = {
  command: "get_id",
  description: "Get ID of current chat",
};

export default getId;
