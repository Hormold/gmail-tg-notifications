import { error, info } from "@service/logging";
import { getEmails, authorizeUser, watchMails } from "@gmail/index";
import { FindAll, SetChatsId, FindUserByEmailNew } from "@controller/user";
import { bot } from "@telegram/index";
import { getValue, setValue } from "@server/serverMap";
import { processEmail } from "@ai/analyze";
import { justSendMessage } from "./sendMessage";

interface GmailHistoryEntry {
  email: string;
  historyId: number;
  timestamp: number;
}

const EMAIL_HISTORY_ID_MAP_KEY = "emailHistoryIdMap";

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
    const body = JSON.parse(req.body);

    const { emailAddress, historyId } = JSON.parse(
      Buffer.from(body.data.message.data, "base64").toString("utf-8")
    );

    const sanitizedEmail = emailAddress.toLowerCase().trim();

    if (!(await addGmailUserWithHistoryId(sanitizedEmail, historyId))) {
      info("This update was skipped as it has already been processed");
      return res.status(204).send();
    }

    const user = await FindUserByEmailNew(sanitizedEmail);
    if (!user) return res.status(204).send("User not found");

    const gmailAccount = user.gmailAccounts.find(
      (acc) => acc.email === sanitizedEmail
    );
    console.log(`Coming email for ${sanitizedEmail}`);
    if (!gmailAccount) return res.status(204).send("Gmail account not found");

    const emails = await getEmails(gmailAccount, historyId, user);
    if (!emails) throw new Error("Failed to get emails");

    await Promise.all(
      user.chatsId.map(async (chatId) => {
        for (const email of emails) {
          // Blacklist check
          if (
            user.blackListEmails &&
            user.blackListEmails
              .map((email) => email.toLowerCase())
              .includes(email.from.toLowerCase())
          ) {
            console.log(
              `Email from blacklisted sender ${email.from}, skipping`
            );
            continue;
          }
          try {
            //await sendMessageWithAttachments(chatId, email);
            const aiProcessedEmail = await processEmail(email, sanitizedEmail);
            if (aiProcessedEmail) {
              await justSendMessage(chatId, aiProcessedEmail);
            } else {
              console.log(`No AI processed email for ${email.id}`);
            }
          } catch (err) {
            console.log(`Error in sending message`, err, req.body);
            await handleChatError(user, chatId);
          }
        }
      })
    );

    await cleanGmailHistoryIdMap();
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

const addGmailUserWithHistoryId = async (
  email: string,
  historyId: number
): Promise<boolean> => {
  const entries: GmailHistoryEntry[] =
    (await getValue(EMAIL_HISTORY_ID_MAP_KEY)) || [];
  const current = `${email}${historyId}`;

  if (entries.some((entry) => `${entry.email}${entry.historyId}` === current)) {
    return false;
  }

  entries.push({ email, historyId, timestamp: Date.now() });
  const updatedEntries = entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25);
  await setValue(EMAIL_HISTORY_ID_MAP_KEY, updatedEntries);
  return true;
};

const cleanGmailHistoryIdMap = async (): Promise<void> => {
  const entries = await getValue<GmailHistoryEntry[]>(EMAIL_HISTORY_ID_MAP_KEY);
  if (entries && entries.length > 25) {
    const updatedEntries = entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 15);
    await setValue(EMAIL_HISTORY_ID_MAP_KEY, updatedEntries);
  }
};
