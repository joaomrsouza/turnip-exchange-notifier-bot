import { TurnipExchangeAPIIsland } from "./api";
import { redisDb } from "./redis";

class DB {
  async getUsersWithPrices() {
    const users = await redisDb.hGetAll("users");
    const result: Map<string, number> = new Map();
    for (const user of Object.keys(users)) {
      result.set(user, Number(users[user]));
    }
    return Object.fromEntries(result.entries());
  }
  async getUserPrice(userId: number) {
    return Number(await redisDb.hGet("users", userId.toString()));
  }
  async setUserPrice(userId: number, price: number) {
    return await redisDb.hSet("users", userId.toString(), price);
  }
  async delUserPrice(userId: number) {
    return await redisDb.hDel("users", userId.toString());
  }
  async setIslands(islands: TurnipExchangeAPIIsland[]) {
    await redisDb.del("islands");
    const redisCalls: Promise<number>[] = [];
    for (const island of islands) {
      redisCalls.push(
        redisDb.hSet("islands", island.name, JSON.stringify(island))
      );
    }
    await Promise.all(redisCalls);
  }
  async getIsland(islandName: string) {
    return JSON.parse(
      (await redisDb.hGet("islands", islandName)) ?? "{}"
    ) as TurnipExchangeAPIIsland;
  }
}

export const db = new DB();
