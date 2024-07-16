import { checkUser } from "@telegram/common";
import { getEmailById } from "@gmail/index";
import crypto from "crypto";

const getFullText = async function (ctx, id: string, emailHash: string) {
  const user = await checkUser(ctx);
  if (user === false) {
    return ctx.reply("You are not registered. /start to proceed");
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

  if (!emailAccount) {
    return ctx.reply("Invalid email hash");
  }
  const from = await getEmailById(emailAccount, id, "From");
  const subject = await getEmailById(emailAccount, id, "Subject");
  const text = await getEmailById(emailAccount, id, "message");

  if (!text) {
    ctx.reply("Problem with fetching data...");
    return;
  }
  const message =
    text.length > 3500
      ? `${text.substr(0, 3500)}\nMessage exceeded max length`
      : text;

  return `<b>Full message text from ${from} - ${subject}:</b>\n${message}`;
};

export default getFullText;
