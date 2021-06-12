const express = require("express");
const app = express();
const morgan = require("morgan");

const cors = require("cors");
// for parsing from form data
const multer = require("multer");
const upload = multer();

app.use(morgan("dev")); //loggin passage to log incoming passage and view it in the terminal
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads_image", express.static("uploads_image"));

const campaignRouter = require("./api/controllers/campaignController");
const paymentAccountRouter = require("./api/controllers/paymentAccountController");
const paymentTransferRouter = require("./api/controllers/paymentTransferController");
const userAccountRouter = require("./api/controllers/userAccountController");

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: " TbC Sever is working",
  });
});

app.use("/campaigns", campaignRouter);
app.use("/paymentAccount", paymentAccountRouter);
app.use("/paymentTransfer", paymentTransferRouter);
app.use("/userAccount", userAccountRouter);

app.use("*", (req, res, next) => {
  const error = new Error("Error ... likely route path not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
