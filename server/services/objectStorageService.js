const crypto = require("crypto");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
let configured = false;

const configureCloudinary = () => {
    if (configured) return;

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        const error = new Error("Cloud image storage is not configured.");
        error.statusCode = 503;
        throw error;
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });
    configured = true;
};

const uploadImage = async (file, folder) => {
    if (!file?.buffer?.length) {
        const error = new Error("An image file is required.");
        error.statusCode = 400;
        throw error;
    }

    const extension = path.extname(file.originalname || "").toLowerCase();
    if (!allowedExtensions.has(extension)) {
        const error = new Error("Please upload a JPG, JPEG, PNG, or WEBP image.");
        error.statusCode = 400;
        throw error;
    }

    configureCloudinary();
    const publicId = `${folder}/${crypto.randomUUID()}`;
    let result;
    try {
        result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    public_id: publicId,
                    overwrite: false,
                    use_filename: false,
                    unique_filename: false,
                    allowed_formats: ["jpg", "jpeg", "png", "webp"]
                },
                (error, uploaded) => error ? reject(error) : resolve(uploaded)
            );
            stream.end(file.buffer);
        });
    } catch (error) {
        error.statusCode = error.statusCode || 502;
        error.publicMessage = "Photo storage is temporarily unavailable. Please try again.";
        throw error;
    }

    return { url: result.secure_url, publicId: result.public_id };
};

const saveFacePhoto = (file) => uploadImage(file, "face-photos");
const saveGroupPhoto = (file) => uploadImage(file, "group-photos");

const getCloudinaryPublicId = (url) => {
    if (!url || typeof url !== "string") return null;
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== "res.cloudinary.com") return null;
        const match = parsed.pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
        if (!match) return null;
        return match[1].replace(/\.[^/.]+$/, "");
    } catch {
        return null;
    }
};

const removeStoredImage = async (url) => {
    const publicId = getCloudinaryPublicId(url);
    if (!publicId) return;
    try {
        configureCloudinary();
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true
        });
    } catch (error) {
        // Storage cleanup is best effort; never fail a saved profile update.
        console.error("Cloud image cleanup failed:", error.message);
    }
};

module.exports = { saveFacePhoto, saveGroupPhoto, removeStoredImage };
