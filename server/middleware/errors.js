function multerErrorHandler(err, req, res, next) {
    if (!err) return next()
    if (err.name === 'MulterError' || err.message === 'Unsupported file type') {
        return res.status(400).json({ error: err.message })
    }
    return next(err)
}

function errorHandler(err, req, res, next) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
}

module.exports = { multerErrorHandler, errorHandler }