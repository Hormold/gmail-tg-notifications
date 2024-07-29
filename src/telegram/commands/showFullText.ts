import { checkUser } from "@telegram/common";
import { getEmailDetailsById } from "@gmail/index";
import crypto from "crypto";
import {
  clearTags,
  extractEmail,
  replaceAllLinks,
  replaceAllLinksInPlainText,
} from "@service/utils";
import { MAX_MESSAGE_LENGTH } from "@service/projectConstants";

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

  const text = await replaceAllLinksInPlainText(data.message);

  const message =
    text.length > MAX_MESSAGE_LENGTH
      ? `${text.substr(0, MAX_MESSAGE_LENGTH)}...\n`
      : text;

  return `<b>Full message text from ${extractEmail(data.from)} - ${
    data.subject
  }:</b>\n${clearTags(message)}`;
};

export default getFullText;
