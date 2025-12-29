const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UnityController = require("../Controller/unityController");
const findAvailableDrive = require("../utils/findAvailableDrive");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const drive = await findAvailableDrive();
    const folder = path.join(drive, "unity_builds");

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      fs.chmodSync(folder, 0o444); // lock folder
    }

    req.unityDrive = drive;
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("zip"), UnityController.uploadBuild);
router.get("/", UnityController.getAll);
router.get("/batch/:batch_no", UnityController.getByBatch);
router.get("/download/:id", UnityController.download);
router.delete("/:id", UnityController.delete);

module.exports = router;
