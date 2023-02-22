declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      REDIS_PASS: string;
      REDIS_USER: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      UPDATE_INTERVAL_SECONDS: string;
    }
  }
}
