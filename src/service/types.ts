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

export interface GmailHistoryEntry {
  email: string;
  historyId: number;
  timestamp: number;
}

export interface AnalysisResult {
  category: string;
  summary: string;
  importance: number;
  actionLinkUrl?: string;
  actionLinkText?: string;
  actionSteps?: string[];
}

export interface TelegramMessageObject {
  text: string;
  id: string;
  unsubscribeLink?: string;
  actionLink?: string;
  actionLinkText?: string;
}
