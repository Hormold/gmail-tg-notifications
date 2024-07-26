import User, { IUser } from "@model/user";
import { error } from "@service/logging";

export interface ICreateUserInput {
  telegramID: IUser["telegramID"];
  chatsId?: IUser["chatsId"];
  gmailAccounts?: IUser["gmailAccounts"];
}

export async function CreateUser(obj: ICreateUserInput) {
  return User.create({
    telegramID: obj.telegramID,
    chatsId: obj.chatsId,
    gmailAccounts: [],
  })
    .then((data: IUser) => {
      return data;
    })
    .catch((e: Error) => {
      error("CreateUser", e);
    });
}

export async function FindUserById(tgId: IUser["telegramID"]) {
  return User.findOne({ telegramID: tgId })
    .then((data: IUser) => {
      return data || false;
    })
    .catch((e: Error) => {
      error("FindUserById", e);
    });
}

export async function FindAll() {
  return User.find({})
    .then((x) => x)
    .catch((e) => (error(e), false));
}

export async function FindUserByEmailNew(sanitizedEmail: string) {
  return User.findOne({ "gmailAccounts.email": sanitizedEmail })
    .then((data: IUser) => {
      return data || false;
    })
    .catch((e: Error) => {
      error("FindUserByEmail", e);
    });
}

export async function SetChatsId(
  tgId: IUser["telegramID"],
  chatsId: IUser["chatsId"]
) {
  return User.findOneAndUpdate(
    { telegramID: tgId },
    { $set: { chatsId } },
    { upsert: true }
  )
    .then(() => true)
    .catch((e) => (error(e), false));
}

export async function addSenderToBlackList(
  tgId: IUser["telegramID"],
  blackListEmails?: IUser["blackListEmails"]
) {
  return User.findOneAndUpdate(
    { telegramID: tgId },
    {
      $set: { blackListEmails },
    },
    { upsert: true }
  )
    .then(() => true)
    .catch((e) => (error(e), false));
}

export async function DeleteUser(tgId: IUser["telegramID"]) {
  return User.deleteOne({ telegramID: tgId })
    .then((res) => {
      return res.ok === 1;
    })
    .catch((e: Error) => {
      error("DeleteUser", e);
      return false;
    });
}

export async function AddGmailAccount(
  tgId: IUser["telegramID"],
  email: string,
  token: string,
  historyId: number = 0
) {
  return User.findOneAndUpdate(
    { telegramID: tgId },
    { $push: { gmailAccounts: { email, token, historyId } } },
    { new: true }
  )
    .then(() => true)
    .catch((e) => (error(e), false));
}

export async function RemoveGmailAccount(
  tgId: IUser["telegramID"],
  email: string
) {
  return User.findOneAndUpdate(
    { telegramID: tgId },
    { $pull: { gmailAccounts: { email } } },
    { new: true }
  )
    .then(() => true)
    .catch((e) => (error(e), false));
}

export async function UpdateGmailAccount(
  tgId: IUser["telegramID"],
  email: string,
  updates: Partial<{ token: string; historyId: number }>
) {
  const updateObj = Object.fromEntries(
    Object.entries(updates).map(([key, value]) => [
      `gmailAccounts.$.${key}`,
      value,
    ])
  );

  return User.findOneAndUpdate(
    { telegramID: tgId, "gmailAccounts.email": email },
    { $set: updateObj },
    { new: true }
  )
    .then(() => true)
    .catch((e) => (error(e), false));
}

export async function SetUserTimeUTCOffset(
  tgId: IUser["telegramID"],
  offset: IUser["timezoneUTCDiff"]
) {
  return User.findOneAndUpdate(
    { telegramID: tgId },
    { $set: { timezoneUTCDiff: offset } },
    { upsert: true }
  )
    .then(() => true)
    .catch((e) => (error(e), false));
}
