import {
  AddGmailAccount,
  FindUserById,
  UpdateGmailAccount,
} from "@controller/user";
import { checkUser } from "@telegram/common";
import { Middleware, Scenes, Context } from "telegraf";
import {
  authorizeUser,
  generateUrlToGetToken,
  getNewToken,
} from "@gmail/index";
import { getEmailAdress, watchMails } from "@gmail/index";
import { BotCommand, IAuthObject } from "@service/types";

const gmailConnectScene = new Scenes.BaseScene<Scenes.SceneContext>("connect");
gmailConnectScene.enter(async (ctx) => {
  const user = await FindUserById(ctx.chat.id);
  if (!user) {
    ctx.reply("Error ocurred");
    return ctx.scene.leave();
  }

  if (!user.gmailAccounts.length) {
    await ctx.reply(
      "Ok, now we need to autorize access from bot to GMail! Ready? Click /new to get link!"
    );
  } else {
    for (let i = 0; i < user.gmailAccounts.length; i++) {
      const obj = await authorizeUser(user.gmailAccounts[i].token);
      await ctx.reply(`Email: ${user.gmailAccounts[i].email}`);
      await ctx.reply("Successfully authorized from cache");
      if (
        await watchMails(
          user.telegramID,
          user.gmailAccounts[i].email,
          obj.oauth
        )
      ) {
        await ctx.reply("Subscribed for new emails successfully");
      } else {
        await ctx.reply("Error ocurred, couldn't subscribe");
      }
      ctx.reply("To add new account click /new or /cancel to exit");
    }
  }
});

gmailConnectScene.command("new", async (ctx) => {
  const obj = await authorizeUser("");
  const url = generateUrlToGetToken(obj.oauth);
  await ctx.reply(
    "Cool! Now you need to authorize at GMail. Open link below to get token. After redirect, copy full token and send me back! To cancel tap: /cancel"
  );
  await ctx.reply(url);
  await ctx.reply("Enter token from GMail:");
  ctx.scene.session.state = obj;
});

gmailConnectScene.command("cancel", Scenes.Stage.leave<Scenes.SceneContext>());
gmailConnectScene.leave((ctx) => ctx.reply("Gmail config finished, exiting"));

gmailConnectScene.on("text", async (ctx) => {
  const user = await FindUserById(ctx.chat.id);
  if (!user) {
    ctx.reply("Error ocurred");
    return ctx.scene.leave();
  }
  const obj = ctx.scene.session.state as IAuthObject;
  try {
    const { oAuth2Client: auth, token } = await getNewToken(
      obj.oauth,
      ctx.message.text
    );

    if (auth === null) {
      ctx.reply("Error ocurred, bad token");
      return ctx.scene.leave();
    } else {
      await ctx.reply("Successfully authorized");
      const email = await getEmailAdress(auth);
      if (!email) {
        await ctx.reply("Error ocurred, couldn't get email");
        return ctx.scene.leave();
      }

      // Check if email is already set
      if (user.gmailAccounts.find((x) => x.email === email)) {
        const emailUpdateStatus = await UpdateGmailAccount(
          user.telegramID,
          email,
          { token }
        );

        if (!emailUpdateStatus) {
          await ctx.reply("Error ocurred, couldn't subscribe");
          return ctx.scene.leave();
        }
      } else {
        const emailSetStatus = await AddGmailAccount(
          user.telegramID,
          email,
          token,
          null
        );
        if (!emailSetStatus) {
          await ctx.reply("Error ocurred, couldn't subscribe");
          return ctx.scene.leave();
        }
      }
      if (await watchMails(user.telegramID, email, auth)) {
        await ctx.reply("Subscribed for new emails successfully");
        return ctx.scene.leave();
      } else {
        await ctx.reply("Error ocurred, couldn't subscribe");
        return ctx.scene.leave();
      }
    }
  } catch (e) {
    console.error(e);
    ctx.reply("Error ocurred, couldn't subscribe. Try again: /connect");
    return ctx.scene.leave();
  }
});

export const stage = new Scenes.Stage<Scenes.SceneContext>([gmailConnectScene]);

const connectGmail: Middleware<Scenes.SceneContext> = async function (ctx) {
  const user = await checkUser(ctx);
  if (user !== false) {
    ctx.scene.enter("connect");
  }
};

export const description: BotCommand = {
  command: "connect",
  description: "Subscribe to watch new emails",
};

export default connectGmail;
