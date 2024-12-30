const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const databaseConnection = require("./config/database");
const app = require("./app");


// uncaughtException
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to an uncaught exception");
  process.exit(1);
});

// Connectiong to database
databaseConnection();

const Server = app.listen(process.env.PORT, () => {
  console.log("Server started listening on port", process.env.PORT);
});

// unhandledRejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to unhandled promise rejection`);

  Server.close(() => {
    process.exit(1);
  });
});
