import { bot } from "@telegram/index";
import Fastify from "fastify";
import { googlePushEndpoint, resubRoute } from "@gmail/pushUpdates";
import { GetLinkByKey } from "@db/controller/links";

const app = Fastify({
  logger: true,
});

const main = async () => {
  const webhook = await bot.createWebhook({
    domain: process.env.SERVER_PATH,
    path: "/wh",
  });

  app.post("/wh", webhook as any);
  app.post("/ggle", googlePushEndpoint);
  app.get("/resub", resubRoute);

  app.get("/l/:key", async (req, res) => {
    const { key } = req.params as { key: string };
    const url = await GetLinkByKey(key);
    if (url) {
      return res.redirect(url);
    }

    return res.status(404).send("Not found");
  });

  app.get("/", async (request, reply) => {
    if (request.query["code"]) {
      return reply
        .type("text/html")
        .send(
          `<h1>Send this code back to bot:<br /><br />${request.query["code"]}</h1>`
        );
    }
    return reply.status(404).send("Not found");
  });

  return app;
};

export default main;
