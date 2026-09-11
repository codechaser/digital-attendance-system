const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ];

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const isValidMimeType =
        allowedMimeTypes.includes(file.mimetype);

    const isValidExtension =
        allowedExtensions.includes(extension);

    if (isValidMimeType || isValidExtension) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed."));
    }
};

const uploadFace = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadFace;