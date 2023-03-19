import { CommandContext, Context } from "grammy";
import { db } from "./db";

export const commandsNames = [
  "start",
  "price",
  "watchprice",
  "clearprice",
  "help",
  "credits",
] as const;

export type CommandName = typeof commandsNames[number];

export const commandsDescription: {
  command: CommandName;
  description: string;
}[] = [
  { command: "start", description: "Start the bot" },
  { command: "price", description: "See the current price" },
  { command: "watchprice", description: "Set price to watch" },
  { command: "clearprice", description: "Stops watching price" },
  { command: "help", description: "Show a help message" },
  { command: "credits", description: "Show the credits of this bot" },
];

export const commands: Record<
  CommandName,
  (ctx: CommandContext<Context>) => void
> = {
  async start(ctx) {
    ctx.reply(`Hello ${ctx.from?.first_name}! Welcome to the Turnip Exchange Notifier Bot.
This bot will notify you when a new island is created with the price you are watching for.
Islands are updated every 10 minutes.
This bot use, but is not related to the Turnip.Exchange website: https://turnip.exchange (please support the creator of Turnip.Exchange at https://www.patreon.com/TurnipExchange).
To start, use /watchprice {price} to set the price you want to watch for.
Everytime we found a new island with the price you are watching for, we will send you a message with the island information.

Please note that this bot is just a notifier, it will not help you to join the queue on the official website, you will need to join the queue by yourself.`);
  },
  async help(ctx) {
    ctx.reply(`This bot will notify you when a new island is created with the price you are watching for.

List of commands:
/start - Start the bot
/price - See the current price
/watchprice {price} - Set price to watch
/clearprice - Stops watching price
/help - Show this message
/credits - Show the credits of this bot`);
  },
  async price(ctx) {
    const price = ctx.from?.id && (await db.getUserPrice(ctx.from.id));

    if (price) {
      ctx.reply(
        `The current price we are watching is: ${price} bells/turnip or higher`
      );
    } else {
      ctx.reply(
        "We are not watching for prices, if you want to start, use /watchprice {price}"
      );
    }
  },
  async watchprice(ctx) {
    const price = Number(ctx.match);

    if (isNaN(price)) {
      ctx.reply("Invalid price, please use a number");
      return;
    }

    if (price < 1) {
      ctx.reply("Invalid price, please use a number greater than 0");
      return;
    }

    if (price > 660) {
      ctx.reply("Invalid price, the maximum turnip price is 660");
      return;
    }

    ctx.from?.id && db.setUserPrice(ctx.from.id, price);

    ctx.reply(
      `The price we are watching now is: ${price} bells/turnip or higher`
    );
  },
  async clearprice(ctx) {
    ctx.from?.id && db.delUserPrice(ctx.from.id);
    ctx.reply(
      "We are no longer watching for prices, if you want to start again, use /watchprice {price}"
    );
  },
  async credits(ctx) {
    ctx.reply(
      `This bot was developed by: @joaomrsouza.
This bot use, but is not related to the Turnip.Exchange website: https://turnip.exchange (please support the creator of Turnip.Exchange at https://www.patreon.com/TurnipExchange).`
    );
  },
};
