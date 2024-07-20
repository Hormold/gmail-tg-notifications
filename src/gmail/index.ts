import { UpdateGmailAccount } from "@controller/user";
import { OAuth2Client } from "google-auth-library";
import { google, gmail_v1 } from "googleapis";
import { error } from "@service/logging";
import { fromString as htmlToText } from "html-to-text";
import { toFormatedString } from "@service/date";
import { IUser } from "@model/user";
import { IAuthObject, IMailObject } from "@service/types";
import { SCOPES } from "@service/projectConstants";

const createOAuth2Client = () => {
  const { client_secret, client_id, redirect_uris } = JSON.parse(
    process.env.GOOGLE_CREDENTIALS
  ).installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
};

export const authorizeUser = async (
  token: string
): Promise<IAuthObject | null> => {
  const oAuth2Client = createOAuth2Client();

  try {
    if (!token) return { oauth: oAuth2Client, authorized: false };
    oAuth2Client.setCredentials(JSON.parse(token));
    return { oauth: oAuth2Client, authorized: true };
  } catch (e) {
    error(e);
    return null;
  }
};

export const generateUrlToGetToken = (oAuth2Client: OAuth2Client) =>
  oAuth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });

export const getNewToken = async (
  oAuth2Client: OAuth2Client,
  code: string
): Promise<{ oAuth2Client: OAuth2Client; token: string } | null> => {
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    return { oAuth2Client, token: JSON.stringify(tokens) };
  } catch (err) {
    error(err);
    return null;
  }
};

export const getEmailAdress = async (auth: OAuth2Client) => {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const res = await gmail.users.getProfile({ userId: "me" });
    return res.status === 200 ? res.data.emailAddress : false;
  } catch (e) {
    error(e);
    return false;
  }
};

export const stopNotifications = async (auth: OAuth2Client) => {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const res = await gmail.users.stop({ userId: "me" });
    return res.status === 200 || res.status === 204;
  } catch (e) {
    error(e);
    return false;
  }
};

export const watchMails = async (
  tgId: IUser["telegramID"],
  email: string,
  auth: OAuth2Client
) => {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const res = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: process.env.PUB_SUB_TOPIC,
        labelIds: ["INBOX"],
      },
    });
    if (res.status !== 200) return false;
    const hId = Number.parseInt(res.data.historyId, 10);
    return await UpdateGmailAccount(tgId, email, { historyId: hId });
  } catch (e) {
    error(e);
    return false;
  }
};

const base64ToString = (x: string) =>
  Buffer.from(x, "base64").toString("utf-8");

const retriveAttachment = async (
  gmail: gmail_v1.Gmail,
  messageId: string,
  attId: string
) => {
  try {
    const resp = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attId,
    });
    if (resp.status !== 200) throw new Error(resp.statusText);
    return resp.data;
  } catch (e) {
    error(e);
    return false;
  }
};

const retriveEmailsFromIds = async (gmail: gmail_v1.Gmail, arr: string[]) => {
  const results = await Promise.all(
    arr.map(async (id) => {
      try {
        const resp = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "FULL",
        });
        if (resp.status === 200) return resp.data;
      } catch (e) {
        error(e);
      }
      return null;
    })
  );
  return results.filter(Boolean);
};

const asyncListHistory = (
  gmail: gmail_v1.Gmail,
  startHistoryId: number
): Promise<gmail_v1.Schema$History[]> => {
  const listHistory = async (
    pageToken?: string
  ): Promise<gmail_v1.Schema$History[]> => {
    const resp = await gmail.users.history.list({
      userId: "me",
      labelId: "INBOX",
      startHistoryId: startHistoryId.toString(),
      pageToken,
    });

    if (resp.status !== 200) throw new Error(resp.statusText);

    const results = resp.data.history || [];
    if (resp.data.nextPageToken) {
      return results.concat(await listHistory(resp.data.nextPageToken));
    }
    return results;
  };

  return listHistory();
};

export const deleteEmailMessage = async (
  email: IUser["gmailAccounts"][0],
  emailId: string
): Promise<boolean> => {
  if (!email || email.token === " ") return false;

  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(JSON.parse(email.token));

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  try {
    const res = await gmail.users.messages.delete({
      userId: "me",
      id: emailId,
    });
    return res.status === 204;
  } catch (e) {
    error(e);
    return false;
  }
};

export const getEmailDetailsById = async (
  email: IUser["gmailAccounts"][0],
  emailId: string
) => {
  if (!email) return false;

  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(JSON.parse(email.token));

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id: emailId,
      format: "FULL",
    });

    if (res.status !== 200)
      throw new Error(`Gmail API error: ${res.statusText}`);
    let emailText = res.data.snippet;
    if (res.data.payload.parts) {
      const htmlParts = res.data.payload.parts.filter((x) =>
        x.mimeType.includes("text/html")
      );
      const message = htmlParts.reduce(
        (prev, cur) => prev + base64ToString(cur.body.data),
        ""
      );
      emailText = htmlToText(message);
    }

    return {
      from: res.data.payload.headers.find((x) => x.name === "From")?.value,
      subject: res.data.payload.headers.find((x) => x.name === "Subject")
        ?.value,
      date: res.data.payload.headers.find((x) => x.name === "Date")?.value,
      message: emailText,
    };
  } catch (e) {
    let message = "Unknown Error";
    if (error instanceof Error) message = error.message;
    error(`getEmailDetailsById`, message);
    return false;
  }
};

export const getEmailById = async (
  email: IUser["gmailAccounts"][0],
  emailId: string,
  type: "From" | "Subject" | "Date" | "message"
): Promise<string | false> => {
  if (!email || email.token === " ") return false;

  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(JSON.parse(email.token));

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  try {
    const res = await gmail.users.messages.get({
      userId: "me",
      id: emailId,
      format: "FULL",
    });

    if (res.status !== 200) return false;

    if (["From", "Subject", "Date"].includes(type)) {
      const header = res.data.payload.headers.find((x) => x.name === type);
      return header?.value || false;
    } else {
      const parts = res.data.payload.parts;
      if (!parts) return res.data.snippet;
      const htmlParts = parts.filter((x) => x.mimeType.includes("text/html"));
      const message = htmlParts.reduce(
        (prev, cur) => prev + base64ToString(cur.body.data),
        ""
      );
      return htmlToText(message);
    }
  } catch (e) {
    error(e);
    return false;
  }
};

function extractUnsubscribeUrl(header: string): string | null {
  const urlRegex = /<(https?:\/\/[^>]+)>/;
  const matches = header.match(urlRegex);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
}

export const getEmails = async (
  email: IUser["gmailAccounts"][0],
  historyId: number,
  user: IUser
): Promise<false | IMailObject[]> => {
  if (!email || email.token === " ") return false;

  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials(JSON.parse(email.token));
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  try {
    const res = await asyncListHistory(gmail, email.historyId);
    const emailsId = res.flatMap(
      (r) => r.messagesAdded?.map((mail) => mail.message.id) || []
    );
    const messagesDocuments = await retriveEmailsFromIds(gmail, emailsId);
    if (!messagesDocuments) return false;

    const result = await Promise.all(
      messagesDocuments.map(async (mail) => {
        let message = "";
        const attachments = [];

        if (mail.payload.parts) {
          const htmlParts = mail.payload.parts.filter((x) =>
            x.mimeType.includes("text/html")
          );
          message = htmlParts.reduce(
            (prev, cur) => prev + base64ToString(cur.body.data),
            ""
          );
          message = htmlToText(message);
        } else if (mail.payload.body) {
          message = htmlToText(base64ToString(mail.payload.body.data || ""));
        }

        if (mail.payload.headers) {
          const getHeader = (name: string) =>
            mail.payload.headers.find((x) => x.name === name)?.value;
          const subject = getHeader("Subject");
          const date = getHeader("Date");
          const from = getHeader("From");

          if (subject) message = `Subject: ${subject}\n\n\n\n${message}`;
          if (date)
            message = `Date: ${toFormatedString(new Date(date))}\n${message}`;
          if (from) {
            const fromValue = from.toLowerCase();
            message = `From: ${fromValue}\n${message}`;
          }
        }

        if (mail.payload && mail.payload.parts) {
          for (const part of mail.payload.parts) {
            if (part.filename) {
              let data;
              if (part.body.data) {
                data = Buffer.from(part.body.data, "base64");
              } else {
                const attachment = await retriveAttachment(
                  gmail,
                  mail.id,
                  part.body.attachmentId
                );
                if (!attachment) return false;
                data = Buffer.from(attachment.data, "base64");
              }
              attachments.push({ name: part.filename, data });
            }
          }
        }

        const from = mail.payload.headers.find((x) => x.name === "From");
        const title = mail.payload.headers.find((x) => x.name === "Subject");
        const rawMessage = mail.snippet || "";
        // Check for List-Unsubscribe
        const unsubscribeLink = mail.payload.headers.find(
          (header) => header.name === "List-Unsubscribe"
        )?.value;

        return {
          id: mail.id,
          message,
          attachments,
          from: from?.value,
          title: title?.value,
          rawMessage,
          unsubscribeLink: unsubscribeLink
            ? extractUnsubscribeUrl(unsubscribeLink)
            : null,
        };
      })
    );
    await UpdateGmailAccount(user.telegramID, email.email, { historyId });
    return result.filter(Boolean) as IMailObject[];
  } catch (e) {
    console.log(`Can't get emails`, e, { email, historyId, user });
    return false;
  }
};
