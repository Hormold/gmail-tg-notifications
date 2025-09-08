import { Context } from "telegraf";
import { FindUserById, UpdateUser } from "@controller/user";
import { bot } from "..";

const gift = async (ctx: Context) => {
  const fromId = ctx.from?.id?.toString();
  const adminId = process.env.TG_ADMIN_ID;
  if (!adminId || fromId !== adminId) {
    return ctx.reply("Unauthorized: admin only");
  }

  // parse target ID from hears match: /gift_<id>
  const match = (ctx as any).match as string[];
  const idStr = match?.[1];
  if (!idStr) {
    return ctx.reply("Usage: /gift_<telegramID>");
  }
  const targetId = parseInt(idStr, 10);
  if (isNaN(targetId)) {
    return ctx.reply("Invalid user ID");
  }

  const user = await FindUserById(targetId);
  if (!user) {
    return ctx.reply(`User ${targetId} not found`);
  }

  const now = new Date();
  const tenYearsMs = 10 * 365 * 24 * 60 * 60 * 1000;
  const endDate = new Date(now.getTime() + tenYearsMs);

  const success = await UpdateUser(user.telegramID, {
    subscription: {
      isActive: true,
      startDate: now,
      endDate,
      paymentMethod: "gift",
      invoiceId: "gift",
    },
    isTrial: false,
  });

  if (success) {
    await ctx.reply(
      `Gifted 10-year subscription to ${targetId}, valid until ${endDate.toDateString()}`
    );
    await bot.telegram.sendMessage(
      user.telegramID,
      `You have been gifted a 10-year subscription to ${targetId}, valid until ${endDate.toDateString()}`
    );
  } else {
    await ctx.reply("Failed to gift subscription");
  }
};

export default gift; 