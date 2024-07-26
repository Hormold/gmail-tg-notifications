import { checkUser } from "@telegram/common";
import { deleteEmailMessage } from "@gmail/index";
import crypto from "crypto";
import { error } from "@service/logging";

const deleteMessage = async function (ctx, id: string, emailHash: string) {
  const user = await checkUser(ctx);
  if (user === false) {
    return;
  }

  let emailAccount: (typeof user.gmailAccounts)[0];
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
  try {
    await deleteEmailMessage(emailAccount, id);
    return true;
  } catch (e) {
    error(`Error in deleting email`, { id, emailHash, e });
    return false;
  }
};

export default deleteMessage;
