import { Api, Bot, Context, GrammyError, HttpError, RawApi } from "grammy";
import { CallbackQueryName, callbackQueries } from "./callbackQueries";
import { commands, commandsDescription, commandsNames } from "./commands";
import { debugLog } from "./debug";

export const bot = new Bot(process.env.BOT_TOKEN!);

export function startBot(onStart?: (bot: Bot<Context, Api<RawApi>>) => void) {
  debugLog("boot", "Starting bot...");

  debugLog("boot", "Setting commands description...");
  bot.api.setMyCommands(commandsDescription);

  debugLog("boot", "Registering commands...");
  for (const command of commandsNames) {
    bot.command(command, (ctx) => {
      debugLog("commands", `Command ${command} received`);
      commands[command](ctx);
    });
  }

  debugLog("boot", "Registering callback queries...");
  bot.callbackQuery(/.*/, (ctx) => {
    const [callbackQueryName, callbackQueryInfo] = ctx.callbackQuery.data.split(
      ":"
    ) as [CallbackQueryName, string];

    debugLog("callbackQueries", `Callback query ${callbackQueryName} received`);

    if (!callbackQueries[callbackQueryName]) {
      debugLog("error", "Callback query not found");
      ctx.reply(
        "Sorry, I couldn't understand your request. Try again using the buttons provided."
      );
      return;
    }

    callbackQueries[callbackQueryName](ctx, callbackQueryInfo);
  });

  debugLog("boot", "Registering other events...");
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
      onStart?.(bot);
    },
  });
}
