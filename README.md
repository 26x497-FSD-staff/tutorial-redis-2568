# Full Stack Dev : Express + Redis API Tutorial

## Create Simple API with Express Framework

### Create an Express project with dependeicies

```bash
// create project folder
mkdir redislab
cd redislab

// initialize project with pnpm
pnpm init

// install run-time dependenicies
pnpm i express morgan redis

// install development dependencies
pnpm i -D @types/express @types/node tsx typescript

// open project with VSCode
code .
```

### Create `tsconfig.json`

```json
{
  "compilerOptions": {
    /* Base Options: */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    /* Strictness */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    /* If transpiling with TypeScript: */
    "module": "NodeNext",
    "outDir": "dist",
    "sourceMap": true,

    /* If your code doesn't run in the DOM: */
    "lib": ["es2022"]
  }
}
```

Find more detail about `tsconfig.json` [here](https://www.totaltypescript.com/tsconfig-cheat-sheet)

### Edit `package.json` and add `"type"` and `"scripts"`sections

```json
{
  ...
  "type": "module",
  "scripts": {
    "dev": "npx nodemon --exec tsx watch --env-file .env src/index.ts",
    "build": "tsc",
    "start": "node --env-file .env dist/index.js"
  }
  ...
}


```

### Creat a simple Express app in `src/index.ts`

```typescript
import express from "express";
import morgan from "morgan";

const PORT = process.env.PORT || 3000;
const app = express();

// use middlewares
app.use(morgan("dev", { immediate: false }));
app.use(express.json());

app
  .listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
  })
  .on("error", (err) => {
    throw new Error(err.message);
  });
```

### Create routes on separate files

Create `src/routes/users.ts` with the following code

```typescript
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello world");
});

export default router;
```

Add routes for `users` in the `src/index.ts`

```typescript
// src/index.ts
import express from "express";
import morgan from "morgan";

// import routes
import userRouter from "./routes/users.js";

const PORT = process.env.PORT || 3000;
const app = express();

// add middlewares
app.use(morgan("dev", { immediate: false }));
app.use(express.json());

// add user route
app.use("/api/v1/users", userRouter);

...

```

### Create `GET /api/v1/users` that returns collection of users data in `src/routes/users.ts`

Create `getUser()` function that get data from API (a way to simulate database delay)

```typescript
import axios from "axios";

const getUser = async (n: number = 1) => {
  const res = await axios.get(`https://randomuser.me/api/?results=${n}`);

  const users = res.data.results;
  return users;
};
```

Use `getUser()` function in `GET /api/v1/users`

```typescript
router.get("/", async (req: Request, res: Response) => {
    try {
      const amount = req.query.amount;

      if (amount) {
        const users = await getUser(parseInt(amount as string));
        const data = {
          amount: amount,
          users: users,
        };
        res.status(200).json(data);
        
      } else if (amount == undefined) {
        // amount is undefined
        const users = await getUser();
        const data = {
          amount: 1,
          users: users,
        };
        res.status(200).json(data);
        
      } else {
        // amount is something else
        res.status(400).json({
          sucesss: false,
          message: "Bad request",
        });
      }
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Something is wrong!",
      });
    }
  }
);
```
Test the endpoint with RESTful API client and see the `response time`

---

## Implement Cache Solution with Redis

### Create a Redis server with Redis-stack Docker container

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

Open a redis-stack using a web browser at `http://localhost:8001/`

### Create a redis client in `libs/redisClient.ts` using the following code

```typescript
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
```

### Create a middleware for **caching** in `src/middleware/cacheMiddleware.ts`

```typescript
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
```

Apply the **cache middleware** with the `GET /api/v1/users` endpoint

```typescript
router.get("/", cacheMiddleware("data", 30),  async (req: Request, res: Response) => {
  
  ...
  // existing codes
  ...
  
  }
);

```

Test the endpoint with RESTful API client again and see the different in `response time`

### 


---
## References

- [Modern Redis Crash Course (YouTube)](https://youtu.be/dQV0xzOeGzU?si=FQ-qN38_F5SN3cPq)
- [Redis Stack on Docker](https://hub.docker.com/r/redis/redis-stack)
- [The TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet)
- [Node .gitignore](https://github.com/github/gitignore/blob/main/Node.gitignore)
