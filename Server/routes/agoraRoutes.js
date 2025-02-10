const express = require("express");
const { IsAuthenticatedUser } = require("../middleware/auth");
const { agoraTokenGenerate } = require("../controllers/agoraController");
const router = express.Router();

router
  .route("/post/generate-token")
  .post(IsAuthenticatedUser, agoraTokenGenerate);

module.exports = router;
