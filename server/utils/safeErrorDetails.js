const getSafeErrorDetails = (error) => {
    const message = String(error?.message || "Unexpected error")
        .replace(/(token|secret|password|authorization)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
        .slice(0, 240);

    return {
        errorName: error?.name || "Error",
        errorCode: error?.code || null,
        message
    };
};

module.exports = getSafeErrorDetails;
