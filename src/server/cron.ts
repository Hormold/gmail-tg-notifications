import { generateGroupEmailSummary } from "@ai/report";
import { FindAll } from "@db/controller/user";
import { authorizeUser, watchMails } from "@gmail/index";
import { error, info, success } from "@service/logging";
import { bot } from "@telegram/index";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import cron from "node-cron";
import { CleanUpAfterMonth } from "@db/controller/links";

dayjs.extend(utc);
dayjs.extend(timezone);

cron.schedule("0 0 * * *", async () => {
  CleanUpAfterMonth();
});

cron.schedule("0 */1 * * *", async () => {
  try {
    const users = await FindAll();
    if (!Array.isArray(users)) return [];
    await Promise.all(
      users.flatMap(async (user) => {
        // Check user timezone
        const timezone = user.timezoneUTCDiff ?? -7;
        const currentTime = dayjs().utcOffset(timezone);

        // If this is 8:00 AM or 8:00 PM in user timezone then send the summary
        const isMorning = currentTime.hour() === 8;
        const isEvening = currentTime.hour() === 20;

        if (!isMorning && !isEvening) return;

        const userEmails = user.gmailAccounts.map((account) => account.email);
        const result = await generateGroupEmailSummary(
          userEmails,
          isMorning ? "morning" : "evening"
        );

        await bot.telegram.sendMessage(user.telegramID, result.summaryText, {
          parse_mode: "HTML",
        });
      })
    );
    success("Morning summary generated successfully");
  } catch (err) {
    error("Error generating morning summary:", err);
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
