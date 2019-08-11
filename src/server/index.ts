import Express from "express";
import { bot } from "@telegram/index";
import { router as gmailRouter } from "@gmail/index";
import url from "url";

export const app = Express();

app.use(bot.webhookCallback(process.env.WEBHOOK_TG_PATH));
bot.telegram.setWebhook(url.resolve(process.env.SERVER_PATH, process.env.WEBHOOK_TG_PATH));

app.use(Express.static("assets/secure"));
app.use(Express.static("assets"));
app.use(gmailRouter);
