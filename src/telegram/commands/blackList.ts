import { checkUser, BotCommand } from "@telegram/common";
import { getEmailById } from "@gmail/index";
import { addSenderToBlackList } from "@controller/user";
import crypto from "crypto";
import { extractEmail } from "@service/utils";

const blackListEmail = async function (ctx, id: string, emailHash: string) {
  const user = await checkUser(ctx);
  if (user === false) {
    return;
  }

  let emailAccount;
  for (let account of user.gmailAccounts) {
    let md5Email = crypto
      .createHash("md5")
      .update(account.email)
      .digest("hex")
      .slice(0, 5);
    if (md5Email === emailHash) {
      emailAccount = account;
      break;
    }
  }

  const sender = await getEmailById(emailAccount, id, "From");

  if (!sender) {
    return "Problem with fetching sender";
  }

  // Extract email from sender
  const email = extractEmail(sender);

  // Check if already in blacklist
  if (user.blackListEmails.includes(email)) {
    // Remove sender from blacklist
    addSenderToBlackList(
      user.telegramID,
      user.blackListEmails.filter((e) => e !== email)
    );
    return `Removed ${email} from blacklist`;
  }

  addSenderToBlackList(user.telegramID, [...user.blackListEmails, email]);

  return `Added ${email} to blacklist, now list contains ${
    user.blackListEmails.length + 1
  } emails`;
};

export const description: BotCommand = {
  command: "blacklist",
  description: "Add sender to blacklist",
};

export default blackListEmail;
