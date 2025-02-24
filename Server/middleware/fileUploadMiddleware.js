const upload = require("../utils/multer");

const handleFileUpload = upload.single("files", 10); 

module.exports = handleFileUpload;
