const express = require("express");
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser")

const app = express();
app.use(express.json());
app.use(cookieParser());


const user = require('./routes/userRoutes.js')
app.use('/api/v1',user)


app.use(errorMiddleware);
module.exports = app;