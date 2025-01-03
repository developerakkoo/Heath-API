const express = require("express");
const {
  uploadFile,
  deleteFile,
  getUserFiles,
  getAllFiles,
} = require("../controllers/fileController");
const { IsAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

// router.post("/post/upload", IsAuthenticatedUser, uploadFile);
// router.delete("/delete/file/:fileName", IsAuthenticatedUser, deleteFile);
// router.get("/get/files/:id", IsAuthenticatedUser, getUserFiles);
// router.get('/get/all-files',IsAuthenticatedUser,getAllFiles)

router.route("/post/upload").post(IsAuthenticatedUser, uploadFile);
router.route("/delete/file/:fileName").delete(IsAuthenticatedUser, deleteFile);
router.route("/get/files/:id").get(IsAuthenticatedUser, getUserFiles);
router.route("/get/all-files").get(IsAuthenticatedUser, getAllFiles);

module.exports = router;
