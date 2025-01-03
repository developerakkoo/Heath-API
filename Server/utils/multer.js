const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const fs = require("fs");
const uploadPath = "./public/uploads";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads"); // Directory to save uploaded files
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, name) {
      if (err) {
        return cb(err);
      }
      const fileName = name.toString("hex") + path.extname(file.originalname); // Create a unique file name
      cb(null, fileName);
    });
  },
});

// Allowed file types
const allowedFileTypes = /pdf|jpg|jpeg|png/;

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const extName = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedFileTypes.test(file.mimetype);
    if (extName && mimeType) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed."), false);
  },
});

module.exports = upload;
