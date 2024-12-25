const express = require("express");
const errorMiddleware = require("./middleware/error");

const app = express();
app.use(express.json());


const user = require('./routes/userRoutes.js')
app.use('/api/v1',user)


app.use(errorMiddleware);
module.exports = app;