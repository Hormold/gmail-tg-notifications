import { Scenes, Markup, Middleware, Context } from "telegraf";
import { BotCommand } from "@service/types";
import { FindUserById, UpdateUser } from "@controller/user";
import { SUBSCRIBTIONS, TRIAL_PERIOD } from "@service/projectConstants";

const subscriptionScene = new Scenes.BaseScene<Scenes.SceneContext>(
  "subscription"
);

subscriptionScene.enter(async (ctx) => {
  const user = await FindUserById(ctx.chat.id);

  if (!user) {
    ctx.reply(
      "Sorry, I couldn't find your user account. Please try again later."
    );
    return ctx.scene.leave();
  }

  if (user.isTrial && user.createdAt < new Date(Date.now() - TRIAL_PERIOD)) {
    ctx.reply(
      "You are currently on a trial subscription for 24h. Please complete the trial period before subscribing."
    );
    return ctx.scene.leave();
  }

  if (user.subscription.isActive) {
    ctx.reply(
      `You are already subscribed to our service. Your subscription is active until ${user.subscription.endDate.toDateString()}`
    );
    return ctx.scene.leave();
  }

  const keyboard = Markup.inlineKeyboard(
    SUBSCRIBTIONS.map((sub) => [
      Markup.button.callback(sub.name, `select_${sub.codename}`),
    ])
  );

  await ctx.reply(
    `Dear valued user,

We hope you're enjoying our service! To keep bringing you the best experience, we need your support. Your subscription helps us cover essential costs, including:

1. Server maintenance to ensure fast and reliable service
2. GPT integration for intelligent responses
3. Ongoing development and improvements

By subscribing, you're not just getting great features - you're helping us grow and innovate. Choose a plan that works for you and be a part of our journey!

Thank you for your support. Together, we can make this service even better!`,
    keyboard
  );
});

subscriptionScene.action(/^select_(.*)/, async (ctx) => {
  const selectedPlan = ctx.match[0].replace("select_", "");

  const subscription = SUBSCRIBTIONS.find(
    (sub) => sub.codename === selectedPlan
  );

  if (!subscription) {
    await ctx.answerCbQuery("Invalid selection. Please try again.");
    return;
  }

  await ctx.answerCbQuery();

  await ctx.replyWithInvoice({
    title: `${subscription.name} Subscription`,
    description: `Subscribe to our service for ${subscription.name}`,
    payload: subscription.name,
    provider_token: process.env.PAYMENT_TOKEN,
    currency: subscription.currency,
    prices: [{ label: subscription.name, amount: subscription.price }],
  });

  ctx.scene.leave();
});

export const onSuccessfulPayment = async (ctx) => {
  const user = await FindUserById(ctx.chat.id);
  if (!user) {
    return ctx.reply(`Sorry, I can't find you in my database`);
  }

  const payment = ctx.message.successful_payment;
  const subscription = SUBSCRIBTIONS.find(
    (sub) => sub.name === payment.invoice_payload
  );

  if (!subscription) {
    return ctx.reply(
      "An error occurred processing your payment. Please contact support."
    );
  }

  const now = new Date();
  const endDate = new Date(
    now.getTime() + subscription.period * 24 * 60 * 60 * 1000
  );

  const updatedUser = await UpdateUser(user.telegramID, {
    subscription: {
      isActive: true,
      startDate: now,
      endDate: endDate,
      paymentMethod: "telegram",
      invoiceId: payment.telegram_payment_charge_id,
    },
    isTrial: false,
  });

  if (updatedUser) {
    await ctx.reply(
      `Thank you for your purchase! Your ${
        subscription.name
      } subscription is now active until ${endDate.toDateString()}.`
    );
  } else {
    await ctx.reply(
      "An error occurred updating your subscription. Please contact support."
    );
  }
};

subscriptionScene.command("cancel", Scenes.Stage.leave<Scenes.SceneContext>());

export const stage = new Scenes.Stage<Scenes.SceneContext>([subscriptionScene]);

const startSubscription: Middleware<Scenes.SceneContext> = async function (
  ctx
) {
  const user = await FindUserById(ctx.chat.id);
  if (user) {
    ctx.scene.enter("subscription");
  } else {
    ctx.reply(
      "Sorry, I couldn't find your user account. Please try again later."
    );
  }
};

export const description: BotCommand = {
  command: "subscribe",
  description: "Choose a subscription plan",
};

export default startSubscription;
