const upload = require("../utils/multer"); // Import multer config
const ErrorHandler = require("../utils/ErrorHandling"); // Custom error handler
const tryCatch = require("../middleware/tryCatch"); // Error handling middleware
const fs = require('fs');
const path = require('path');

// Upload files handler..
exports.uploadFile = tryCatch(async (req, res, next) => {
  // Use multer middleware for file upload
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      return next(new ErrorHandler(err.message, 400)); // Pass error to next middleware
    }
    if (!req.files || req.files.length === 0) {
      return next(new ErrorHandler("No files uploaded.", 400));
    }

    // Map over uploaded files and send back their details
    const uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
    }));

    // Send response with uploaded file details
    res.status(200).json({
      uploadedFiles,
    });
  });
});


// delete file..
exports.deleteFile = tryCatch(async(req,res,next) =>{
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      // If an error occurs (e.g., file not found)
      return next(new ErrorHandler("File not found or unable to delete.", 404));
    }

    // If file is successfully deleted
    res.status(200).json({
      success: true,
      message: "File deleted successfully."
    });
  });
})