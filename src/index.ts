import { Bot, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { api } from "./api";
import { DB } from "./db";
import { createMessageFromIsland } from "./helpers";

const bot = new Bot(process.env.BOT_TOKEN!);
const db = new DB();

const debugEscopes = [
  "boot",
  "commands",
  "details",
  "updating",
  "sending",
  "error",
] as const;

type DebugScope = typeof debugEscopes[number];

const activeDebugScopes =
  (Boolean(process.env.DEBUG) && process.env.DEBUG_SCOPES?.split(",")) || [];

function debugLog(scope: DebugScope, ...args: any[]) {
  if (activeDebugScopes.includes(scope)) console.log(...args);
}

async function updateAndSendIslands() {
  debugLog("updating", "===== Updating islands =====");
  const users = await db.getUsersWithPrices();

  if (Object.keys(users).length === 0) return;

  const islands = (await api.getIslands()).islands;

  if (islands.every((i) => i.name === "No Islands")) {
    debugLog("updating", "No islands found");
    return;
  }

  await db.setIslands(islands);

  debugLog(
    "updating",
    `Islands updated (${islands.length}): ${JSON.stringify(islands)}`
  );

  try {
    const messagesSent: ReturnType<typeof bot.api.sendMessage>[] = [];
    for (const user in users) {
      const userPrice = Number(users[user]);
      const islandsToSend = islands.filter((i) => i.turnipPrice >= userPrice);

      if (islandsToSend.length === 0) continue;

      const message =
        "Hey, we found some islands with the price you are looking for:\n\n" +
        islandsToSend.map((i) => createMessageFromIsland(i)).join("\n") +
        "\nClick on the island name bellow to see more details.";

      const inlineKeyboard = new InlineKeyboard();

      for (const island of islandsToSend) {
        inlineKeyboard.text(island.name, `details:${island.name}`);
      }

      debugLog("sending", `Sending islands to ${user}`);

      messagesSent.push(
        bot.api.sendMessage(user, message, {
          parse_mode: "HTML",
          reply_markup: inlineKeyboard,
        })
      );
    }
    await Promise.all(messagesSent);
  } catch (e) {
    debugLog("error", `Error sending message: ${e}`);
    if (e instanceof GrammyError) {
      if (e.error_code === 403) {
        const userId = e.payload.chat_id as number;
        if (userId) {
          await db.delUserPrice(userId);
        }
      }
    }
  }
}

debugLog("boot", `Starting bot in ${process.env.INIT_TIME} seconds`);

setTimeout(() => {
  debugLog("boot", "Starting bot...");

  bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "price", description: "See the current price" },
    { command: "watchprice", description: "Set price to watch" },
    { command: "clearprice", description: "Stops watching price" },
    { command: "help", description: "Show a help message" },
    { command: "credits", description: "Show the credits of this bot" },
  ]);

  bot.command("start", (ctx) => {
    debugLog("commands", "Start command received");
    ctx.reply(`Hello ${ctx.from?.first_name}! Welcome to the Turnip Exchange Notifier Bot.
This bot will notify you when a new island is created with the price you are watching for.
Islands are updated every 10 minutes.
This bot use, but is not related to the Turnip.Exchange website: https://turnip.exchange (please support the creator of Turnip.Exchange at https://www.patreon.com/TurnipExchange).
To start, use /watchprice {price} to set the price you want to watch for.
Everytime we found a new island with the price you are watching for, we will send you a message with the island information.

Please note that this bot is just a notifier, it will not help you to join the queue on the official website, you will need to join the queue by yourself.`);
  });

  bot.command("help", (ctx) => {
    debugLog("commands", "Help command received");
    ctx.reply(`This bot will notify you when a new island is created with the price you are watching for.

List of commands:
/start - Start the bot
/price - See the current price
/watchprice {price} - Set price to watch
/clearprice - Stops watching price
/help - Show this message
/credits - Show the credits of this bot`);
  });

  bot.command("price", async (ctx) => {
    debugLog("commands", "Price command received");
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
  });

  bot.command("watchprice", (ctx) => {
    debugLog("commands", "Watchprice command received");
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
  });

  bot.command("clearprice", (ctx) => {
    debugLog("commands", "Clearprice command received");
    ctx.from?.id && db.delUserPrice(ctx.from.id);
    ctx.reply(
      "We are no longer watching for prices, if you want to start again, use /watchprice {price}"
    );
  });

  bot.command("credits", (ctx) => {
    debugLog("commands", "Credits command received");
    ctx.reply(
      `This bot was developed by: @joaomrsouza.
This bot use, but is not related to the Turnip.Exchange website: https://turnip.exchange (please support the creator of Turnip.Exchange at https://www.patreon.com/TurnipExchange).`
    );
  });

  bot.callbackQuery(/details\:./, async (ctx) => {
    debugLog("details", "Details callback received");
    const islandName = ctx.callbackQuery.data.replace("details:", "");
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
  });

  setInterval(
    updateAndSendIslands,
    1000 * Number(process.env.UPDATE_INTERVAL_SECONDS ?? 10 * 60)
  );

  bot.on("message", async (ctx) => {
    ctx.reply(
      "Please use one of the commands available (/help to see the commands or access the menu button)"
    );
  });

  bot.catch((err) => {
    const ctx = err.ctx;
    debugLog("error", `Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      debugLog("error", "Error in request:", e.description);
    } else if (e instanceof HttpError) {
      debugLog("error", "Could not contact Telegram:", e);
    } else {
      debugLog("error", "Unknown error:", e);
    }
  });

  bot.start({
    drop_pending_updates: true,
    onStart: (_ctx) => {
      debugLog("boot", "===== Bot started =====");
      debugLog(
        "boot",
        `Current update interval: ${process.env.UPDATE_INTERVAL_SECONDS} seconds`
      );
      updateAndSendIslands();
    },
  });
}, (Number(process.env.INIT_TIME) || 30) * 1000);
