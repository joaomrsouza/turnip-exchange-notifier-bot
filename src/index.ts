import { startBot } from "./bot";
import { debugLog } from "./debug";
import { startTasks } from "./tasks";

function logEnv() {
  debugLog("boot", "===== Environment variables =====");
  for (const envVar in process.env) {
    debugLog("boot", `${envVar}: ${process.env[envVar]}`);
  }
}

logEnv();

startBot((bot) => {
  startTasks(bot);
});
