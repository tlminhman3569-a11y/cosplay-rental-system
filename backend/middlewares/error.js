export const httpError = (status, code, message) => {
    const err = new Error(message)
    err.status = status
    err.code = code
    return err
}

// Middleware bắt lỗi cuối cùng của Express
export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`)
    res.status(err.status || 500).json({
        success: false,
        error: err.code || 'internal_error',
        message: err.message || 'Lỗi server'
    })
}

// Wrapper bắt lỗi cho async controller
export const ah = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}