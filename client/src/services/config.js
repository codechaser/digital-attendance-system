const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");

if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is required.");
}

try {
    const parsedApiUrl = new URL(API_BASE_URL);
    if (!["http:", "https:"].includes(parsedApiUrl.protocol)) {
        throw new Error("Unsupported URL protocol");
    }
} catch {
    throw new Error("VITE_API_BASE_URL must be an absolute URL.");
}

const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, "");
const mediaUrl = (url) => {
    if (!url) return "";
    try {
        const resolvedUrl = new URL(url, API_ORIGIN);
        if (!["http:", "https:"].includes(resolvedUrl.protocol)) return "";
        return resolvedUrl.toString();
    } catch {
        return "";
    }
};

export {
    API_BASE_URL,
    API_ORIGIN,
    mediaUrl
};
