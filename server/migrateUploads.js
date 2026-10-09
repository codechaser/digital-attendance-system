require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
const {
    saveFacePhoto,
    saveGroupPhoto
} = require("./services/objectStorageService");

const oldUploadPath = (url, kind) => {
    const prefix = `/uploads/${kind}/`;
    if (typeof url !== "string" || !url.startsWith(prefix)) return null;
    const fileName = url.slice(prefix.length);
    if (!fileName || path.basename(fileName) !== fileName) return null;
    const directory = kind === "face-photos" ? "face-photos" : "group-photos";
    return path.join(__dirname, "uploads", directory, fileName);
};

const getMimeType = (filePath) => ({
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
}[path.extname(filePath).toLowerCase()] || "application/octet-stream");

const migrateCollection = async ({ Model, field, kind, saveImage, imageCache }) => {
    let migrated = 0;
    let missing = 0;
    let failed = 0;
    const records = await Model.find({ [field]: { $regex: `^/uploads/${kind}/` } });

    for (const record of records) {
        const oldUrl = record[field];
        const localPath = oldUploadPath(oldUrl, kind);
        if (!localPath || !fs.existsSync(localPath)) {
            missing += 1;
            continue;
        }

        try {
            let newUrl = imageCache.get(oldUrl);
            if (!newUrl) {
                const file = {
                    buffer: await fs.promises.readFile(localPath),
                    originalname: path.basename(localPath),
                    mimetype: getMimeType(localPath)
                };
                newUrl = (await saveImage(file)).url;
                imageCache.set(oldUrl, newUrl);
            }

            record[field] = newUrl;
            await record.save();
            migrated += 1;
        } catch (error) {
            failed += 1;
            console.error(`Upload migration failed for one ${kind} record:`, error.message);
        }
    }

    return { migrated, missing, failed };
};

const main = async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
    await mongoose.connect(process.env.MONGO_URI);

    const facePhotos = await migrateCollection({
        Model: User,
        field: "facePhotoUrl",
        kind: "face-photos",
        saveImage: saveFacePhoto,
        imageCache: new Map()
    });
    const groupPhotos = await migrateCollection({
        Model: Attendance,
        field: "groupPhotoUrl",
        kind: "group-photos",
        saveImage: saveGroupPhoto,
        imageCache: new Map()
    });

    console.log("Legacy upload migration complete:", { facePhotos, groupPhotos });
    if (facePhotos.failed || groupPhotos.failed) process.exitCode = 1;
    if (facePhotos.missing || groupPhotos.missing) {
        console.warn("Some legacy URLs had no matching local files; those records were left unchanged.");
    }
};

main()
    .catch((error) => {
        console.error("Legacy upload migration could not complete:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
