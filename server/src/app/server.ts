import "dotenv/config";

import app from "./app";
import { env } from "./config/env";

const PORT = Number(env.PORT) || 8001;

const serverStarter = async () => {
  try {
    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Server listening at port ${PORT}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Server closing...");
      console.error("Failed to start server:", error.message);
      process.exit(1);
    }
  }
};

serverStarter();
