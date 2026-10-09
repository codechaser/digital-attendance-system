const getFaceServiceUrl = () => {
    const url = process.env.FACE_SERVICE_URL?.trim();
    if (!url) {
        const error = new Error("FACE_SERVICE_URL is not configured.");
        error.statusCode = 503;
        throw error;
    }
    return url.replace(/\/+$/, "");
};

module.exports = { getFaceServiceUrl };
