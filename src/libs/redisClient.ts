import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://localhost:6379`,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

redisClient
  .connect()
  .then(() => console.log("Connected to Redis"))
  .catch(console.error);

export default redisClient;