import { checkUser } from "@telegram/common";
import { getEmailDetailsById } from "@gmail/index";
import crypto from "crypto";
import { clearTags, extractEmail } from "@service/utils";

const getFullText = async function (ctx, id: string, emailHash: string) {
  const user = await checkUser(ctx);
  if (user === false) {
    return null;
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
    return null;
  }

  const data = await getEmailDetailsById(emailAccount, id);

  if (!data) {
    return null;
  }

  const message =
    data.message.length > 3500
      ? `${data.message.substr(0, 3500)}\nMessage exceeded max length`
      : data.message;

  return `<b>Full message text from ${extractEmail(data.from)} - ${
    data.subject
  }:</b>\n${clearTags(message)}`;
};

export default getFullText;
