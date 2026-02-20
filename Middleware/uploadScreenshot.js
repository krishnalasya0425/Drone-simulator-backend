const multer = require("multer");
const path = require("path");

// Use memoryStorage so we get the buffer to store in MySQL as LONGBLOB
const storage = multer.memoryStorage();

const uploadScreenshot = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB max
    },
    fileFilter(req, file, cb) {
        const allowedTypes = [".png", ".jpg", ".jpeg", ".webp"];
        const ext = path.extname(file.originalname).toLowerCase();

        if (!allowedTypes.includes(ext)) {
            return cb(new Error("Only image files allowed (.png, .jpg, .jpeg, .webp)"));
        }

        cb(null, true);
    }
});

module.exports = uploadScreenshot;