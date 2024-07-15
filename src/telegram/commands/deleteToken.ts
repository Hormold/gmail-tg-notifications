import { Context, MiddlewareFn } from "telegraf";
import { RemoveGmailAccount } from "@controller/user";
import { checkUser, BotCommand } from "@telegram/common";
import { authorizeUser, stopNotifications } from "@gmail/index";

const deleteToken = async function (ctx, id?: string) {
  const user = await checkUser(ctx);
  if (user === false) {
    await ctx.reply("You are not registered. /start to proceed");
    return;
  }
  if (user.gmailAccounts?.length === 0) {
    await ctx.reply("You are not subscribed");
    return;
  }

  if (!id) {
    // Print all
    for (const key in user.gmailAccounts) {
      const account = user.gmailAccounts[key];
      await ctx.reply(
        `Email: ${account.email}, to unsubscribe click /delete_token_${key}`
      );
    }
    return;
  }

  const account = user.gmailAccounts[id];

  if (!account) {
    await ctx.reply("Invalid id");
    return;
  }

  const obj = await authorizeUser(account.token);
  if (obj !== null) {
    if (obj.authorized) {
      if (!(await stopNotifications(obj.oauth))) {
        await ctx.reply("error while stopping notifications");
      } else {
        await ctx.reply("Unsubscribed");
      }
    } else {
      await ctx.reply("Not authorized");
    }
  } else {
    await ctx.reply("Error ocurred: auth obj is null");
  }

  if (await RemoveGmailAccount(user.telegramID, account.email)) {
    await ctx.reply("successfully deleted token");
  } else {
    await ctx.reply("error ocurred");
  }
};

export const desrciption: BotCommand = {
  command: "delete_token",
  description: "Unsubscribe from email updates and delete Gmail token",
};

export default deleteToken;
