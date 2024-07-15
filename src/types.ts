import { OAuth2Client } from "google-auth-library";

export interface IAuthObject {
  oauth: OAuth2Client;
  authorized: boolean;
}

export interface IMailObject {
  id: string;
  message: string;
  attachments: { name: string; data: Buffer }[];
  from: string | undefined;
  title: string | undefined;
  rawMessage: string;
  unsubscribeLink: string | null;
}
