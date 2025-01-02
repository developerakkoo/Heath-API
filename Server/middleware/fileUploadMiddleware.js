const upload = require("../utils/multer");

const handleFileUpload = upload.array("files", 10); 

module.exports = handleFileUpload;
