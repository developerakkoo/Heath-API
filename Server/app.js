const express = require("express");
const cors = require("cors")
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser")

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }));
app.use(express.json());
app.use(cookieParser());


const user = require('./routes/userRoutes.js')
app.use('/api/v1',user)

const fileRoutes = require("./routes/fileRoutes");
app.use("/api/v1", fileRoutes);


app.use(errorMiddleware);
module.exports = app;