const multer = require("multer");
const path = require("path");
const createVRFolder = require("../utils/getFreeDrive");

const storage = multer.diskStorage({
  async destination(req, file, cb) {
    const basePath = await createVRFolder();
    cb(null, basePath);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (path.extname(file.originalname) !== ".zip") {
      return cb(new Error("Only ZIP files allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;