import { CreateUser, FindUserById } from "@controller/user";
import { BotCommand } from "@service/types";
import { Middleware, Context } from "telegraf";

const start: Middleware<Context> = async function (ctx) {
  if (ctx.chat.type !== "private") {
    return ctx.reply(
      "To start using this service you should send command start in private chat"
    );
  }
  const user = await FindUserById(ctx.chat.id);
  if (user === false) {
    const newUser = await CreateUser({
      telegramID: ctx.chat.id,
      chatsId: [ctx.chat.id],
      gmailAccounts: [],
    });
    if (!newUser) {
      return ctx.reply("Error ocurred while registering");
    }
  }
  if (typeof user === "undefined") {
    return ctx.reply("Error ocurred, contact to maintainer");
  }

  ctx.reply(
    "Hey! Welcome to Gmail Bot, you are registered now. You can add your GMail account by sending /connect",
    {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Share location to set correct timezone",
              request_location: true,
            },
          ],
        ],
        resize_keyboard: true,
      },
    }
  );
};

export const description: BotCommand = {
  command: "start",
  description: "Start using this bot",
};

export default start;
