import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// routes import
import healthRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.routes.js";
import teamRouter from "./routes/team.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import commentRouter from "./routes/comment.routes.js";
import activityRouter from "./routes/activity.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

// routes declaration
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/teams/:teamId/projects", projectRouter);
app.use("/api/v1/teams/:teamId/projects/:projectId/tasks", taskRouter);
app.use("/api/v1/teams/:teamId/projects/:projectId/tasks/:taskId/comments", commentRouter);
app.use("/api/v1/teams/:teamId/activity", activityRouter);
app.use("/api/v1/teams/:teamId/dashboard", dashboardRouter);

// global error handler
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export { app };
