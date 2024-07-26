import { generateGroupEmailSummary } from "@ai/report";
import { FindAll } from "@db/controller/user";
import { authorizeUser, watchMails } from "@gmail/index";
import { error, info, success } from "@service/logging";
import { bot } from "@telegram/index";
import cron from "node-cron";

cron.schedule("0 8 * * *", async () => {
  try {
    const users = await FindAll();
    if (!Array.isArray(users)) return [];
    await Promise.all(
      users.flatMap(async (user) => {
        const userEmails = user.gmailAccounts.map((account) => account.email);
        const result = await generateGroupEmailSummary(userEmails, "morning");

        await bot.telegram.sendMessage(user.telegramID, result.summaryText);
      })
    );
    success("Morning summary generated successfully");
  } catch (err) {
    error("Error generating morning summary:", err);
  }
});

// Run evening summary at 8:00 PM every day
cron.schedule("0 20 * * *", async () => {
  try {
    const users = await FindAll();
    if (!Array.isArray(users)) return [];
    await Promise.all(
      users.flatMap(async (user) => {
        const userEmails = user.gmailAccounts.map((account) => account.email);
        const result = await generateGroupEmailSummary(userEmails, "evening");
        await bot.telegram.sendMessage(user.telegramID, result.summaryText);
      })
    );
    success("Evening summary generated successfully");
  } catch (err) {
    error("Error generating evening summary:", err);
  }
});

cron.schedule("0 5 * * *", async () => {
  const users = await FindAll();
  if (!Array.isArray(users)) return [];
  await Promise.all(
    users.flatMap((user) =>
      user.gmailAccounts.map(async (account) => {
        try {
          const auth = await authorizeUser(account.token);
          if (!auth) return;

          const tgId = user.telegramID.toString();
          if (auth.authorized) {
            const success = await watchMails(
              user.telegramID,
              account.email,
              auth.oauth
            );
            if (!success) {
              error(`Couldn't watch mails for ${account.email}`);
              await bot.telegram.sendMessage(
                tgId,
                `Your connected Gmail account ${account.email} needs to be reconnected. Because Google API subscription is not successful.`
              );
            } else {
              info(
                `Successfully updated subscription for ${tgId} (${account.email})`
              );
            }
          } else {
            error(`Bad token, not authorized for ${account.email}`);
            await bot.telegram.sendMessage(
              tgId,
              `Your connected Gmail account ${account.email} needs to be reconnected. Because the token is invalid.`
            );
          }
        } catch (err) {
          error("Error renewing Gmail subscriptions", { err, account, user });
        }
      })
    )
  );
});
