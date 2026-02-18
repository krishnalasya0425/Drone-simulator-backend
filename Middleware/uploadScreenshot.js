const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/screenshots";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const uploadScreenshot = multer({
    storage,
    fileFilter(req, file, cb) {
        const allowedTypes = [".png", ".jpg", ".jpeg"];
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedTypes.includes(ext)) {
            return cb(new Error("Only image files allowed"));
        }

        cb(null, true);
    }
});

module.exports = uploadScreenshot;
