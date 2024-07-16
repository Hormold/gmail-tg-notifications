import { Telegraf, session, Scenes } from "telegraf";
import { error } from "@service/logging";
import startCb, { description as startCommand } from "@commands/start";
import connectGmailCb, {
  description as connectGmailCommand,
} from "@commands/connectGmail";
import setChatsId, {
  description as setChatsIdCommand,
} from "@commands/setChatsId";
import getId, { description as getIdCommand } from "@commands/getId";
import help, { description as helpCommand } from "@commands/help";
import deleteTokenCb, {
  description as deleteTokenCommand,
} from "@commands/deleteToken";
import { stage as authGmailStage } from "@commands/connectGmail";
import blackListEmail from "@commands/blackList";
import showFullText from "@commands/showFullText";
import deleteMessage from "./commands/deleteMessage";
export const bot = new Telegraf<Scenes.SceneContext>(process.env.BOT_TOKEN);

bot.use(session());
bot.use(authGmailStage.middleware());
bot.start(startCb);
bot.command(connectGmailCommand.command, connectGmailCb);
bot.command(setChatsIdCommand.command, setChatsId);
bot.command(getIdCommand.command, getId);
bot.on("callback_query", async (ctx) => {
  // @ts-ignore Broken types?
  const data = ctx.callbackQuery.data.split(":");
  const action = data[0];
  const mailId = data[1].split("_")[1];
  const emailHash = data[1].split("_")[0];
  console.log(`Action: ${action}, mailId: ${mailId}, emailHash: ${emailHash}`);
  switch (action) {
    case "blacklist":
      const result = await blackListEmail(ctx, mailId, emailHash);
      await ctx.answerCbQuery(result);
      // Add reaction to self message
      await ctx.telegram.setMessageReaction(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id,
        [{ type: "emoji", emoji: "👌" }]
      );
      break;
    case "remove":
      const resultOfDeletion = await deleteMessage(ctx, mailId, emailHash);
      if (resultOfDeletion) {
        await ctx.answerCbQuery("Removed from Gmail & Telegram");
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          ctx.callbackQuery.message.message_id
        );
      } else {
        await ctx.answerCbQuery("Error in deletion, try again later");
      }
      break;
    case "full":
      const text = await showFullText(ctx, mailId, emailHash);
      await ctx.editMessageText(text, { parse_mode: "HTML" });
      break;
    default:
      break;
  }
});

bot.command("/delete_token", (ctx) => deleteTokenCb(ctx));
bot.hears(/^\/delete_token_([a-zA-Z0-9]+)$/, async (ctx) => {
  const id = ctx.match[1];
  await deleteTokenCb(ctx, id);
});

bot.help(help);

bot.telegram
  .setMyCommands([
    startCommand,
    connectGmailCommand,
    setChatsIdCommand,
    helpCommand,
    getIdCommand,
    deleteTokenCommand,
  ])
  .catch((e) => error(e));

bot.catch((err: Error) => error("GeneralBotError", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
