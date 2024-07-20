import { BotCommand } from "@service/types";
import { Context, Middleware } from "telegraf";

const getId: Middleware<Context> = async function (ctx) {
  ctx.reply(ctx.chat.id.toString());
};

export const description: BotCommand = {
  command: "get_id",
  description: "Get ID of current chat",
};

export default getId;
