import { Context, MiddlewareFn } from "telegraf";
import { DeleteUser } from "@controller/user";
import { checkUser, BotCommand } from "@telegram/common";


const deleteProfile: MiddlewareFn<Context> = async function(ctx) {
    const user = await checkUser(ctx);
    if (user === false) {
        return;
    }

    if ((await DeleteUser(user.telegramID))) {
        await ctx.reply("successfully deleted user from db");
    } else {
        await ctx.reply("error ocurred");
    }
};

export const desrciption: BotCommand = {
    command: "delete_profile",
    description: "Delete your profile with creds"
};

export default deleteProfile;
