import express, { Request, Response } from "express";
import cors from "cors";
import router from "./app/routes/router";

const app = express();

/* ======================
   Global Middlewares
====================== */

// ✅ CORS (সবচেয়ে জরুরি)
app.use(
  cors({
    origin: "http://localhost:5173", // frontend
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

/* ======================
   Routes
====================== */
app.use("/", router);

/* ======================
   Health Check
====================== */
app.get("/api", (req: Request, res: Response) => {
  res.send({
    status: true,
    message: "Server running on port 8000",
  });
});

export default app;
