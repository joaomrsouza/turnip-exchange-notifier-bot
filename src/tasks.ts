import { Api, Bot, Context, GrammyError, InlineKeyboard, RawApi } from "grammy";
import { api } from "./api";
import { db } from "./db";
import { debugLog } from "./debug";
import { createMessageFromIsland } from "./helpers";

const tasksNames = ["updateAndSendIslands"] as const;

type TaskName = typeof tasksNames[number];

type Task = {
  execute: (bot: Bot<Context, Api<RawApi>>) => Promise<void>;
  interval: number;
  executeOnStart: boolean;
};

const tasks: Record<TaskName, Task> = {
  updateAndSendIslands: {
    async execute(bot) {
      debugLog("api", "===== Updating islands =====");
      const users = await db.getUsersWithPrices();

      if (Object.keys(users).length === 0) return;

      const islands = (await api.getIslands()).islands;

      if (islands.every((i) => i.name === "No Islands")) {
        debugLog("api", "No islands found");
        return;
      }

      await db.setIslands(islands);

      debugLog(
        "api",
        `Islands updated (${islands.length}): ${JSON.stringify(islands)}`
      );

      try {
        const messagesSent: ReturnType<Api<RawApi>["sendMessage"]>[] = [];
        for (const user in users) {
          const userPrice = Number(users[user]);
          const islandsToSend = islands.filter(
            (i) => i.turnipPrice >= userPrice
          );

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
    },
    interval: 1000 * Number(process.env.UPDATE_INTERVAL_SECONDS ?? 10 * 60),
    executeOnStart: true,
  },
};

export function startTasks(bot: Bot<Context, Api<RawApi>>) {
  debugLog("tasks", "Starting tasks");
  for (const taskName of tasksNames) {
    const task = tasks[taskName];

    const executeTask = () => {
      debugLog("tasks", `Executing task ${taskName}`);
      task.execute(bot);
    };

    task.executeOnStart && executeTask();
    setInterval(executeTask, task.interval);
  }
}
