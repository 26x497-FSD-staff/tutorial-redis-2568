import express, {type Request, type Response} from "express";
import morgan from "morgan";

// import routes
import userRouter from "./routes/users.js";

const PORT = process.env.PORT || 3000;
const app = express();

// use middlewares
app.use(morgan("dev", { immediate: false }));
app.use(express.json());

// add user route
app.use("/api/v1/users", userRouter);

app.get("/", (req:Request, res:Response) => {
    res.send('Hello world');
})

app
  .listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
  })
  .on("error", (err) => {
    throw new Error(err.message);
  });