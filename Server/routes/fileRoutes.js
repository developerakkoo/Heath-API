const express = require("express");
const { uploadFile, deleteFile } = require("../controllers/fileController"); 
const { IsAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

// POST route to handle file upload
router.post("/post/upload",IsAuthenticatedUser, uploadFile);
router.delete("/delete/file/:fileName", IsAuthenticatedUser, deleteFile)

module.exports = router;
