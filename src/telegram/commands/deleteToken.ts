import { Context, MiddlewareFn } from "telegraf";
import { RemoveGmailAccount } from "@controller/user";
import { checkUser } from "@telegram/common";
import { authorizeUser, stopNotifications } from "@gmail/index";
import { BotCommand } from "@service/types";

const deleteToken = async function (ctx, id?: string) {
  const user = await checkUser(ctx);
  if (user === false) {
    return ctx.reply("You are not registered. /start to proceed");
  }

  if (user.gmailAccounts?.length === 0) {
    return ctx.reply(`You have no emails to unsubscribe`);
  }

  if (!id) {
    let message = [];
    for (const key in user.gmailAccounts) {
      const account = user.gmailAccounts[key];
      message.push(
        `Email: ${account.email}, to unsubscribe click: /delete_token_${key}`
      );
    }
    return ctx.reply(
      `Looks like you want to remove your email. Here is the list of your emails:\n\n${message.join(
        "\n"
      )}`
    );
  }

  const account = user.gmailAccounts[id];

  if (!account) {
    return ctx.reply("Invalid id");
  }

  const obj = await authorizeUser(account.token);
  if (obj !== null) {
    if (obj.authorized) {
      if (!(await stopNotifications(obj.oauth))) {
        await ctx.reply(
          "Oops! Something went wrong while unsubscribing, contact maintainer"
        );
      } else {
        await ctx.reply(`We have stopped notifications for ${account.email}`);
      }
    } else {
      await ctx.reply("Not authorized to stop notifications");
    }
  } else {
    await ctx.reply("Error ocurred: auth obj is null");
  }

  if (await RemoveGmailAccount(user.telegramID, account.email)) {
    await ctx.reply("And we successfully removed your email from our database");
  } else {
    await ctx.reply(
      "Error while removing email from database, contact maintainer"
    );
  }
};

export const description: BotCommand = {
  command: "delete_token",
  description: "Unsubscribe from email updates and delete Gmail token",
};

export default deleteToken;
