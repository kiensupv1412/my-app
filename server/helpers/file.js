const path = require('path')

function publicUrl(req) {
    return process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
}

function filePublicUrl(req, filename) {
    return `${publicUrl(req)}/uploads/${filename}`
}

module.exports = { filePublicUrl }