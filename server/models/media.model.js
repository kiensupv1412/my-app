const { query } = require('./db')

// Helper build WHERE
function buildWhere({ q, media_type, site, user_id, folder_id }) {
    const where = []
    const params = []

    if (q && q.trim()) {
        where.push('(name LIKE ? OR original_name LIKE ? OR file_name LIKE ?)')
        const like = `%${q.trim()}%`
        params.push(like, like, like)
    }
    if (media_type) {
        where.push('media_type = ?')
        params.push(media_type)
    }
    if (Number.isFinite(site)) {
        where.push('site = ?')
        params.push(site)
    }
    if (Number.isFinite(user_id)) {
        where.push('user_id = ?')
        params.push(user_id)
    }

    // folder_id: undefined = không lọc; null = folder gốc; number = đúng folder
    if (folder_id === null) {
        where.push('folder_id IS NULL')
    } else if (Number.isFinite(folder_id)) {
        where.push('folder_id = ?')
        params.push(folder_id)
    }

    const clause = where.length ? ('WHERE ' + where.join(' AND ')) : ''
    return { clause, params }
}

async function insertMedia(payload) {
    const now = new Date()
        // nz an toàn
    const nz = (v, d) => (v === undefined || v === null ? d : v)

    const data = {
        site: nz(payload.site, 0),
        user_id: nz(payload.user_id, 0),
        folder_id: nz(payload.folder_id, null),
        media_type: nz(payload.media_type, 'image'),
        uuid: nz(payload.uuid, String(Date.now()) + String(Math.random()).slice(2, 8)),
        name: nz(payload.name, payload.original_name || payload.file_name || 'Untitled'),
        alt: nz(payload.alt, null),
        caption: nz(payload.caption, null),
        link: nz(payload.link, null),
        thumbnail: nz(payload.thumbnail, null),
        file_name: payload.file_name,
        file_url: payload.file_url, // lưu relative như /uploads/...
        file_size: nz(payload.file_size, null),
        extension: nz(payload.extension, null),
        mime: payload.mime,
        height: nz(payload.height, null),
        width: nz(payload.width, null),
        duration: nz(payload.duration, null),
        orientation: nz(payload.orientation, null),
        version: nz(payload.version, null),
        created_at: now,
        updated_at: now,
    }

    const cols = Object.keys(data)
    const vals = Object.values(data)
    const sql = `
    INSERT INTO media_storage (${cols.join(',')})
    VALUES (${cols.map(() => '?').join(',')})
  `
    const res = await query(sql, vals)
    return res.insertId
}

async function countMedia(filters = {}) {
    const { clause, params } = buildWhere(filters)
    const rows = await query(`SELECT COUNT(*) AS total FROM media_storage ${clause}`, params)
    return (rows[0] && rows[0].total) || 0
}

async function listMedia({ page, pageSize, ...filters }) {
    const offset = (page - 1) * pageSize
    const { clause, params } = buildWhere(filters)
    const sql = `
    SELECT * FROM media_storage
    ${clause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `
    return query(sql, [...params, pageSize, offset])
}

async function getMediaById(id) {
    const rows = await query(`SELECT * FROM media_storage WHERE id=?`, [id])
    return rows[0] || null
}

async function deleteMedia(id) {
    return query(`DELETE FROM media_storage WHERE id=?`, [id])
}

module.exports = {
    insertMedia,
    countMedia,
    listMedia,
    getMediaById,
    deleteMedia
}