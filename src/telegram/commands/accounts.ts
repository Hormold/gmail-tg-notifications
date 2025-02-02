import { Context } from "telegraf";
import { checkUser } from "@telegram/common";
import { RemoveGmailAccount } from "@controller/user";
import { BotCommand } from "@service/types";

export const description: BotCommand = {
  command: "accounts",
  description: "Show connected Gmail accounts",
};

const accounts = async (ctx: Context) => {
  const user = await checkUser(ctx);
  if (!user) return;

  if (!user.gmailAccounts.length) {
    return ctx.reply("No Gmail accounts connected. Use /connect to add one.");
  }

  const message = user.gmailAccounts
    .map((account, index) => {
      return `${index + 1}. ${account.email} - /delete_account_${index}`;
    })
    .join("\n");

  await ctx.reply("Your connected Gmail accounts:\n" + message);
};

export const deleteAccount = async (ctx: Context, accountIndex: number) => {
  const user = await checkUser(ctx);
  if (!user) return;

  if (accountIndex < 0 || accountIndex >= user.gmailAccounts.length) {
    return ctx.reply("Invalid account index");
  }

  const account = user.gmailAccounts[accountIndex];
  const success = await RemoveGmailAccount(user.telegramID, account.email);

  if (success) {
    await ctx.reply(`Successfully removed ${account.email}`);
  } else {
    await ctx.reply("Failed to remove account");
  }
};

export default accounts;
