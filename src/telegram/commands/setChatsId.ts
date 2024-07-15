import { bot } from "@telegram/index";
import { Context, Middleware } from "telegraf";
import { SetChatsId as SetChatsIdController } from "@controller/user";
import { checkUser, BotCommand } from "@telegram/common";
import { error } from "@service/logging";
interface Chat {
  type: string;
  id: number;
}

const setChatsId: Middleware<Context> = async (ctx) => {
  const user = await checkUser(ctx);
  if (!user || !("text" in ctx.message)) {
    return;
  }

  const chatsId = parseInput(ctx.message.text);
  if (!chatsId) {
    ctx.reply("Invalid input. Expected a list of chat IDs on the second line.");
    return;
  }

  const validChats = await getValidChats(chatsId, user.telegramID);

  if (await SetChatsIdController(user.telegramID, validChats)) {
    ctx.reply(validChats.join("\n"));
  } else {
    ctx.reply("An error occurred while setting chat IDs.");
  }
};

function parseInput(text: string): number[] | null {
  const lines = text.split(/[\r\n]+/);
  if (lines.length !== 2) return null;

  const chatIds = lines[1].match(/\S+/g) || [];
  const parsedIds = chatIds.map(Number);

  return parsedIds.every(Number.isInteger) ? parsedIds : null;
}

async function getValidChats(
  chatsId: number[],
  userTelegramId: number
): Promise<number[]> {
  const botId = (await bot.telegram.getMe()).id;
  const validChats: number[] = [];

  for (const chatId of chatsId) {
    try {
      const chat = (await bot.telegram.getChat(chatId)) as Chat;
      if (await isValidChat(chat, userTelegramId, botId)) {
        validChats.push(chatId);
      }
    } catch (e) {
      error(e);
      // Skip invalid chats
    }
  }

  return validChats;
}

async function isValidChat(
  chat: Chat,
  userTelegramId: number,
  botId: number
): Promise<boolean> {
  if (chat.type === "private") return true;

  const admins = await bot.telegram.getChatAdministrators(chat.id);
  const isUserAdmin = admins.some((admin) => admin.user.id === userTelegramId);
  const isBotAdmin = admins.some((admin) => admin.user.id === botId);

  return isUserAdmin && isBotAdmin;
}

export const description: BotCommand = {
  command: "set_chats",
  description: "Set chats IDs where to forward emails",
};

export default setChatsId;
