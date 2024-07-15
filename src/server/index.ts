import { bot } from "@telegram/index";
import Fastify from "fastify";
import { googlePushEndpoint, resubRoute } from "@gmail/pushUpdates";

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

  app.get("/", async (request, reply) => {
    if (request.query["code"]) {
      // Return with html with <h1>
      return reply
        .type("text/html")
        .send(
          `<h1>Send this code back to bot:<br /><br />${request.query["code"]}</h1>`
        );
    }
    return `Nothing here`;
  });

  return app;
};

export default main;
