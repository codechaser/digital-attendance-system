const crypto = require("crypto");

const enrollmentDiagnostics = (req, res, next) => {
    const requestId = crypto.randomUUID();
    const startedAt = process.hrtime.bigint();

    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    console.info("Enrollment request received", {
        requestId,
        method: req.method,
        path: req.path
    });

    res.once("finish", () => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        console.info("Enrollment request completed", {
            requestId,
            status: res.statusCode,
            elapsedMs: Math.round(elapsedMs)
        });
    });

    res.once("close", () => {
        if (!res.writableFinished) {
            const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
            console.warn("Enrollment request connection closed before response", {
                requestId,
                elapsedMs: Math.round(elapsedMs)
            });
        }
    });

    next();
};

module.exports = enrollmentDiagnostics;
