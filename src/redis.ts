import { createClient } from "redis";

const redisClient = createClient({
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

export const redisDb = {
  async connect() {
    await redisClient.connect();
  },
  async disconnect() {
    await redisClient.disconnect();
  },
  async verifyConnection() {
    !redisClient.isOpen && (await this.connect());
  },
  async hSet(key: string, field: string, value: string | number) {
    await this.verifyConnection();
    return await redisClient.hSet(key, field, value);
  },
  async hGet(key: string, field: string) {
    await this.verifyConnection();
    return await redisClient.hGet(key, field);
  },
  async hGetAll(key: string) {
    await this.verifyConnection();
    return await redisClient.hGetAll(key);
  },
  async hDel(key: string, field: string) {
    await this.verifyConnection();
    return await redisClient.hDel(key, field);
  },
  async del(key: string) {
    await this.verifyConnection();
    return await redisClient.del(key);
  },
};
