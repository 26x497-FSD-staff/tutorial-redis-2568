import express, {type Request, type Response} from "express";
import axios from "axios";

import cacheMiddleware from "../middleware/cachemiddleware.js";

const getUser = async (n: number = 1) => {
  const res = await axios.get(`https://randomuser.me/api/?results=${n}`);

  const users = res.data.results;
  return users;
};

const router = express.Router();

// GET /api/v1/users
router.get("/", cacheMiddleware("data", 30), async (req: Request, res: Response) => {
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





export default router;