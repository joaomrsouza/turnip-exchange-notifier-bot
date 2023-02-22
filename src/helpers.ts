import { encode } from "html-entities";
import { TurnipExchangeAPIIsland } from "./api";

function getQueueColor(queue: string): string {
  const queueRating = Number(queue.split("/")[0]) / Number(queue.split("/")[1]);
  if (queueRating <= 0.2) return "🟩";
  if (queueRating <= 0.5) return "🟨";
  return "🟥";
}

export function createMessageFromIsland(
  i: TurnipExchangeAPIIsland,
  description = false
): string {
  return `🏝 <b>${encode(i.name)} - <i>${i.creationTime}</i></b>
<b>Turnip Price: 💰 ${i.turnipPrice} bells/turnip</b>
<b>Fee:</b> ${i.fee ? "✅ Has fee" : "🚫 No fee"}
Island rating: ${
    i.ratingCount
      ? `${"⭐️".repeat(i.rating)} (${i.ratingCount} votes)`
      : "Nothing yet"
  }
<b>Hemisphere:</b> ${i.hemisphere}
<b>Queue:</b> ${getQueueColor(i.queued)} ${i.queued}${
    description
      ? `
<b>Description:</b> ${encode(i.description).replace(/&apos;/g, "'")}`
      : ""
  }
  `;
}
