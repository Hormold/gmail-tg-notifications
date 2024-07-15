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
export const bot = new Telegraf<Scenes.SceneContext>(process.env.BOT_TOKEN);

bot.use(session());
bot.use(authGmailStage.middleware());
bot.start(startCb);
bot.command(connectGmailCommand.command, connectGmailCb);
bot.command(setChatsIdCommand.command, setChatsId);
bot.command(getIdCommand.command, getId);
bot.hears(/^\/full_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)$/, async (ctx) => {
  const id = ctx.match[2];
  const email = ctx.match[1];
  console.log({ id, email });
  await showFullText(ctx, id, email);
});
bot.hears(/^\/blacklist_([a-zA-Z0-9]+)_([a-zA-Z0-9]+)$/, async (ctx) => {
  const id = ctx.match[2];
  const email = ctx.match[1];
  await blackListEmail(ctx, id, email);
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
