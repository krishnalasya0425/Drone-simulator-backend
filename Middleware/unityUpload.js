const multer = require("multer");
const path = require("path");
const fs = require("fs");
const findAvailableDrive = require("../utils/findAvailableDrive");
const createUnityBuildFolder = require("../utils/createUnityBuildFolder");

const storage = multer.diskStorage({
  async destination(req, file, cb) {
    try {
      const drive = await findAvailableDrive();
      const baseFolder = createUnityBuildFolder(drive);

      // remove read-only before writing
      fs.chmodSync(baseFolder, 0o666);

      req.unityDrive = drive;
      cb(null, baseFolder);
    } catch (err) {
      cb(err);
    }
  },

  filename(req, file, cb) {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname) !== ".zip") {
    return cb(new Error("Only ZIP files are allowed"));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB
});
