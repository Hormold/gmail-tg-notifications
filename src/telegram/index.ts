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
import payment, {
  description as paymentCommand,
  onSuccessfulPayment,
  stage as subscriptionScene,
} from "@commands/subscribe";
import deleteTokenCb, {
  description as deleteTokenCommand,
} from "@commands/deleteToken";
import { stage as authGmailStage } from "@commands/connectGmail";
import blackListEmail from "@commands/blackList";
import showFullText from "@commands/showFullText";
import deleteMessage from "./commands/deleteMessage";
import { FindUserById, SetUserTimeUTCOffset } from "@db/controller/user";
import { generateGroupEmailSummary } from "@ai/report";
import { FindHistoryByTelegramMessageId } from "@db/controller/history";
import { getTimezoneOffset } from "@service/utils";

export const bot = new Telegraf<Scenes.SceneContext>(process.env.BOT_TOKEN);

bot.use(session());
bot.use(authGmailStage.middleware());
bot.use(subscriptionScene.middleware());
bot.start(startCb);
bot.command(connectGmailCommand.command, connectGmailCb);
bot.command(setChatsIdCommand.command, setChatsId);
bot.command(getIdCommand.command, getId);
bot.command(paymentCommand.command, payment);
bot.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true);
});
bot.on("successful_payment", onSuccessfulPayment);

bot.command("summary", async (ctx) => {
  const user = await FindUserById(ctx.chat.id);
  if (!user) {
    return ctx.reply(`Sorry, I can't find you in my database`);
  }
  // send typing event
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
  const userEmails = user.gmailAccounts.map((account) => account.email);
  try {
    const summary = await generateGroupEmailSummary(userEmails, "24hours");
    await ctx.reply(summary.summaryText, {
      parse_mode: "HTML",
    });
  } catch (err) {
    await ctx.reply(`Wooops! Looks like we have internal problem!`);
    error(`Error while generating summary for `, { userEmails, err });
  }
});

bot.on("location", async (ctx) => {
  try {
    const user = await FindUserById(ctx.chat.id);
    if (!user) {
      return ctx.reply(`Sorry, I can't find you in my database`);
    }
    const timezone = getTimezoneOffset(
      ctx.message.location.latitude,
      ctx.message.location.longitude
    );

    await SetUserTimeUTCOffset(ctx.chat.id, timezone);

    await ctx.reply(
      `Your timezone update. Your timezone is UTC${
        timezone >= 0 ? "+" : ""
      }${timezone}`,
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  } catch (err) {
    error("Error in setting timezone", err);
    console.log(err);
    ctx.reply(
      "Error in setting timezone, share location again with bot to set timezone",
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  }
});

bot.on("callback_query", async (ctx) => {
  // @ts-ignore Broken types?
  const data = ctx.callbackQuery.data.split(":");
  const action = data[0];
  const mailId = data[1].split("_")[1];
  const emailHash = data[1].split("_")[0];
  switch (action) {
    case "blacklist":
      const result = await blackListEmail(ctx, mailId, emailHash);
      await ctx.answerCbQuery(result);
      // Add reaction to self message
      const isDeleted = !!result.match(/Removed/i);
      await ctx.telegram.setMessageReaction(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id,
        [{ type: "emoji", emoji: isDeleted ? "👌" : "🕊" }]
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
    case "back":
      const original = await FindHistoryByTelegramMessageId(
        ctx.callbackQuery.message.message_id
      );
      if (!original)
        return ctx.answerCbQuery("Error in fetching original message");
      await ctx.editMessageText(original.telegramMessageText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: original.telegramMessageButtons,
        },
      });
      break;
    case "full":
      const text = await showFullText(ctx, mailId, emailHash);
      const originalMessage = await FindHistoryByTelegramMessageId(
        ctx.callbackQuery.message.message_id
      );
      if (text)
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              ...originalMessage.telegramMessageButtons,
              [{ text: "🔙 Back", callback_data: `back:${mailId}` }],
            ],
          },
        });
      else await ctx.answerCbQuery("Error in fetching full text");
      break;
    default:
      break;
  }
});

bot.command("delete_token", (ctx) => deleteTokenCb(ctx));
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
    paymentCommand,
  ])
  .catch((e) => error(e));

bot.catch((err: Error) => error("GeneralBotError", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
