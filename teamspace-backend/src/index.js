import dotenv from "dotenv";

dotenv.config();

import connectDB from "./db/index.js";
import { app } from "./app.js";

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Startup failed, MongoDB connection error: ", err);
    process.exit(1);
  });
