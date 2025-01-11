const handleFileUpload = require("../middleware/fileUploadMiddleware");
const ErrorHandler = require("../utils/ErrorHandling");
const tryCatch = require("../middleware/tryCatch");
const fileUpload = require("../models/FileUploadModel");
const fs = require("fs");
const path = require("path");


// Upload files handler..
exports.uploadFile = tryCatch(async (req, res, next) => {
  const userId = req.user?.id;

  handleFileUpload(req, res, async (err) => {
    if (err) {
      return next(new ErrorHandler(err.message, 400)); // Handle multer errors
    }
    if (!req.files || req.files.length === 0) {
      return next(new ErrorHandler("No files uploaded.", 400));
    }

    // Process uploaded files
    const uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      userId,
    }));

    await fileUpload.insertMany(uploadedFiles);

    res.status(200).json({
      success: true,
      uploadedFiles,
    });
  });
});

// delete file..
exports.deleteFile = tryCatch(async (req, res, next) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, "..", "public", "uploads", fileName);

  await fs.unlink(filePath, (err) => {
    if (err) {
      // If an error occurs (e.g., file not found)
      return next(new ErrorHandler("File not found or unable to delete.", 404));
    }

    // If file is successfully deleted
    res.status(200).json({
      success: true,
      message: "File deleted successfully.",
    });
  });
});

// retrive filse based on user ID..
exports.getUserFiles = tryCatch(async (req, res, next) => {
  const userId = req.user?.id;
  const userFile = await fileUpload.find({ userId });
  if (!userFile || userFile === 0) {
    return next(new ErrorHandler("No file Found for this user", 404));
  }
  res.status(200).json({
    success: true,
    files: userFile,
  });
});

// retrive all files
exports.getAllFiles = tryCatch(async (req, res, next) => {
  const allFiles = await fileUpload.find();

  if (!allFiles || allFiles === 0) {
    return next(new ErrorHandler("No files found", 404));
  }
  res.status(200).json({
    success: true,
    fileCount:allFiles.length,
    files: allFiles,
  });
});
