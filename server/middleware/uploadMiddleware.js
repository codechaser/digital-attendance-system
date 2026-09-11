const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Upload folder
const uploadDir = path.join(__dirname, "../uploads/group-photos");

// Create folder automatically if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});


// Only allow image files
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


    // Accept if either MIME type OR extension is valid
    if (isValidMimeType || isValidExtension) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed."));
    }
};


// Multer configuration
const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


module.exports = upload;