const mongoose = require("mongoose");

const databaseConnection = () => {
  mongoose
    .connect(process.env.DB_URL)
    .then((data) => {
      console.log(`mongoDB Connected :${data.connection.host}`);
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = databaseConnection;