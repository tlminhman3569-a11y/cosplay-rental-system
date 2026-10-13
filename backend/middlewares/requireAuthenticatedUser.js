function requireAuthenticatedUser(req, res, next) {
    if (!req.user?.id) {
        return res.status(401).json({
            error: {
                code: 'UNAUTHENTICATED',
                message: 'Bạn cần đăng nhập để thực hiện thao tác này.'
            }
        });
    }

    next();
}

module.exports = requireAuthenticatedUser;
