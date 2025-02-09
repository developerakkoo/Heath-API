const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const user = require("./routes/userRoutes.js");
app.use("/api/v1", user);

const fileRoutes = require("./routes/fileRoutes");
app.use("/api/v1", fileRoutes);

const userProfile = require("./routes/userProfile");
app.use("/api/v1", userProfile);

const doctor = require("./routes/doctorRoutes");
app.use("/api/v1", doctor);

const appointment = require("./routes/appointmentRoutes");
app.use("/api/v1", appointment);

const medicines = require("./routes/medicinRoutes.js");
app.use("/api/v1", medicines);

const order = require("./routes/orderRoutes.js");
app.use("/api/v1", order);

const addToCart = require("./routes/addToCartRoutes.js");
app.use("/api/v1", addToCart);

app.use(errorMiddleware);
module.exports = app;
