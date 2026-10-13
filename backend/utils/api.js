function success(res, data, status = 200) {
    return res.status(status).json({ data });
}

function fail(res, status, code, message) {
    return res.status(status).json({ error: { code, message } });
}

function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { success, fail, asyncHandler };
