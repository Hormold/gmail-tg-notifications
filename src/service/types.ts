import { OAuth2Client } from "google-auth-library";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

export interface IAuthObject {
  oauth: OAuth2Client;
  authorized: boolean;
}

export interface IMailObject {
  id: string;
  message: string;
  attachments: { name: string; data: Buffer }[];
  from: string | undefined;
  date: string;
  title: string | undefined;
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
  importantUrls?: { url: string; text: string }[];
  actionSteps?: string[];
  deadline?: string;
}

export interface TelegramMessageOutput {
  success: boolean;
  error?: string;
  messageText?: string;
  messageId?: number;
  messageButtons?: InlineKeyboardButton[][];
}

export interface TemplateData {
  importanceEmoji: string;
  from: string;
  emailTo: string;
  importance: number;
  title: string;
  importanceText?: string;
  category: string;
  summary: string;
  actionSteps?: string[];
  deadline?: string;
}

export interface TelegramMessageObject {
  text: string;
  id: string;
  unsubscribeLink?: string;
  importantUrls?: { url: string; text: string }[];
}

export interface BotCommand {
  description: string;
  command: string;
}

export interface Chat {
  type: string;
  id: number;
}
