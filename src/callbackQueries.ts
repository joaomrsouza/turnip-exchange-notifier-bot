import { CallbackQueryContext, Context, InlineKeyboard } from "grammy";
import { db } from "./db";
import { createMessageFromIsland } from "./helpers";

export const callbackQueryNames = ["details"] as const;

export type CallbackQueryName = typeof callbackQueryNames[number];

export const callbackQueries: Record<
  CallbackQueryName,
  (ctx: CallbackQueryContext<Context>, info: string) => void
> = {
  async details(ctx, islandName) {
    const island = await db.getIsland(islandName);
    if (island) {
      const inlineKeyboard = new InlineKeyboard().url(
        "Go to island on Turnip.Exchange",
        `https://turnip.exchange/island/${island.turnipCode}`
      );
      ctx.reply(createMessageFromIsland(island, true), {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });
    } else {
      ctx.reply("Island not found");
    }
    await ctx.answerCallbackQuery();
  },
};
