import { error, info, success, warning } from "@service/logging";
import { getEmails, authorizeUser, watchMails } from "@gmail/index";
import { FindAll, SetChatsId, FindUserByEmailNew } from "@controller/user";
import { bot } from "@telegram/index";
import { getValue, setValue } from "@db/controller/kv";
import { analyzeEmail } from "@ai/analyze";
import { createTelegramMessage, sendErrorMessage } from "@telegram/sendMessage";
import { extractEmail } from "@service/utils";
import {
  AddEmailToHistoryIfNew,
  NotProcessEmail,
  UpdateEmailAnalysis,
} from "@controller/history";
import { IEmailHistory } from "@model/history";

const handleChatError = async (user, chatId) => {
  try {
    const chat = await bot.telegram.getChat(chatId);
    const botId = (await bot.telegram.getMe()).id;

    if (chat.type !== "private") {
      const admins = await bot.telegram.getChatAdministrators(chatId);
      const isUserAdmin = admins.some(
        (admin) => admin.user.id === user.telegramID
      );
      const isBotAdmin = admins.some((admin) => admin.user.id === botId);

      if (!isBotAdmin || !isUserAdmin) {
        throw new Error("Bot or user is not admin");
      }
    }
  } catch (e) {
    await SetChatsId(
      user.telegramID,
      user.chatsId.filter((id) => id !== chatId)
    );
    console.log("Deleted chatID due to error:", e);
  }
};

export const googlePushEndpoint = async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error(`Error in parsing body`, e, req.body);
        return res.status(400).send("Bad request");
      }
    }
    success(`Debug, incomeing body: ${JSON.stringify(body)}`);

    const { emailAddress, historyId } = JSON.parse(
      Buffer.from(body.message.data, "base64").toString("utf-8")
    );

    // Limit for one historyId in 5 minutes
    const rateLimit = await getValue(`${emailAddress}:${historyId}`);
    if (rateLimit) {
      warning(`Rate limit for ${emailAddress}:${historyId}`);
      return res.status(204).send();
    }

    await setValue(
      `${emailAddress}:${historyId}`,
      true,
      new Date(Date.now() + 5 * 60 * 1000)
    );

    const sanitizedEmail = emailAddress.toLowerCase().trim();

    success(`Coming email for ${sanitizedEmail} with historyId ${historyId}`);

    const emailHistoryObject = await AddEmailToHistoryIfNew({
      email: sanitizedEmail,
      messageId: String(historyId),
    });

    if (!emailHistoryObject) {
      warning(
        `Email history object already exists for ${sanitizedEmail}:${historyId}`
      );
      return res.status(204).send();
    }

    const user = await FindUserByEmailNew(sanitizedEmail);
    if (!user) {
      warning(`User not found for ${sanitizedEmail}`);
      return res.status(204).send("User not found");
    }

    const gmailAccount = user.gmailAccounts.find(
      (acc) => acc.email === sanitizedEmail
    );

    if (!gmailAccount) {
      warning(`Gmail account not found for ${sanitizedEmail}`);
      return res.status(204).send("Gmail account not found");
    }

    const emails = await getEmails(gmailAccount, historyId, user);
    if (!emails) {
      warning(`Failed to get emails for ${sanitizedEmail}`);
      throw new Error("Failed to get emails");
    }

    success(
      `All checks passed for ${sanitizedEmail}, now processing emails... (${emails.length} to ${user.chatsId.length} chats)`
    );

    await Promise.all(
      user.chatsId.map(async (chatId) => {
        for (const email of emails) {
          const cacheKey = `${emailAddress}:${email.id}:${chatId}`;
          const rateLimit = await getValue(cacheKey);
          if (rateLimit) {
            warning(`Rate limit for ${cacheKey}`);
            continue;
          }
          await setValue(cacheKey, true, new Date(Date.now() + 5 * 60 * 1000));

          // Blacklist check
          if (
            user.blackListEmails &&
            user.blackListEmails
              .map((email) => email.toLowerCase())
              .includes(email.from.toLowerCase())
          ) {
            await NotProcessEmail(
              emailHistoryObject as IEmailHistory,
              "Blacklisted sender"
            );
            continue;
          }

          if (
            extractEmail(email.from.trim().toLowerCase()) === sanitizedEmail
          ) {
            await NotProcessEmail(
              emailHistoryObject as IEmailHistory,
              "Email from self"
            );
            continue;
          }

          try {
            const analysis = await analyzeEmail(email);

            if (+analysis.importance === 0) {
              await NotProcessEmail(
                emailHistoryObject as IEmailHistory,
                "Email is not important",
                analysis
              );
              continue;
            }

            const telegramSendResult = await createTelegramMessage(
              chatId,
              email,
              sanitizedEmail,
              analysis
            );

            warning(`Processed message`, {
              chatId,
              email,
              emailHistoryObject,
              sanitizedEmail,
              analysis,
              telegramSendResult,
            });

            if (telegramSendResult.success) {
              await UpdateEmailAnalysis(
                emailHistoryObject as IEmailHistory,
                analysis,
                telegramSendResult
              );
            } else {
              await NotProcessEmail(
                emailHistoryObject as IEmailHistory,
                telegramSendResult.error ?? "Unknown error"
              );
            }
          } catch (err: any) {
            await sendErrorMessage(chatId, err);
            warning(`Error in sending message: ${err.message}`, err);
            await NotProcessEmail(
              emailHistoryObject as IEmailHistory,
              "Error in processing email: " + err?.message
            );
            await handleChatError(user, chatId);
          }
        }
      })
    );

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
};

export const resubRoute = async (_req, res) => {
  try {
    const users = await FindAll();
    if (!Array.isArray(users)) return res.status(204).send();

    await Promise.all(
      users.flatMap((user) =>
        user.gmailAccounts.map(async (account) => {
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
              error(
                "resubRoute",
                new Error(`Couldn't watch mails for ${account.email}`)
              );
              await bot.telegram.sendMessage(
                tgId,
                `Try to renew gmail subscription for ${account.email}`
              );
            } else {
              info(
                `Successfully updated subscription for ${tgId} (${account.email})`
              );
            }
          } else {
            error(
              "resubRoute",
              new Error(`Bad token, not authorized for ${account.email}`)
            );
            await bot.telegram.sendMessage(
              tgId,
              `Renew gmail subscription for ${account.email}`
            );
          }
        })
      )
    );

    res.status(204).send();
  } catch (e) {
    error(e);
    res.status(500).send("Internal Server Error");
  }
};
