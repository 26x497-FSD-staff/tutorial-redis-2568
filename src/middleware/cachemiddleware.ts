import { type Request, type Response, type NextFunction } from "express";
import redisClient from "../libs/redisClient.js";

const cacheMiddleware = (keyPrefix: string, expirySeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    
    const key = `${keyPrefix}:${req.params.id || req.originalUrl}`; // Example key generation

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log("Cache Hit!");
        return res.status(200).json(JSON.parse(cachedData));
      }
      
      console.log("Cache Miss!");
    
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (body: any) {
        redisClient.setEx(key, expirySeconds, JSON.stringify(body));
        return originalJson.call(this, body);
      };
      next();
      
    } catch (error) {
      console.error("Cache middleware error:", error);
      next(); // Continue to the route handler even if caching fails
    }
  };
};

export default cacheMiddleware;