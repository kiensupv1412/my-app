// media.model.js
const { query } = require('./db');

function guessExtension(fileName) {
    if (!fileName) return null;
    const i = fileName.lastIndexOf('.');
    return i > -1 ? fileName.slice(i + 1).toLowerCase() : null;
}

function nz(value, fallback) {
    return value !== undefined && value !== null ? value : fallback;
}

async function insertMedia(payload) {
    const now = new Date();

    const data = {
        site: payload.site,
        user_id: payload.user_id,
        folder_id: nz(payload.folder_id, null),
        media_type: payload.media_type ? payload.media_type : 'image',
        uuid: crypto.randomUUID(),
        name: payload.name,
        alt: payload.alt ? payload.alt : null,
        caption: payload.caption ? payload.caption : null,
        link: payload.link ? payload.link : null,
        thumbnail: payload.thumbnail ? payload.thumbnail : null,
        file_name: payload.file_name,
        file_url: payload.file_url,
        file_size: payload.file_size ? payload.file_size : null,
        extension: payload.extension ? payload.extension : guessExtension(payload.file_name),
        mime: payload.mime,
        height: payload.height ? payload.height : null,
        width: payload.width ? payload.width : null,
        duration: payload.duration ? payload.duration : null,
        orientation: payload.orientation ? payload.orientation : null,
        version: payload.version ? payload.version : null,
        created_at: now,
        updated_at: now,
    };

    const cols = Object.keys(data);
    const vals = Object.values(data);

    const sql = `
      INSERT INTO media_storage (${cols.join(',')})
      VALUES (${cols.map(() => '?').join(',')})
    `;

    try {
        const res = await query(sql, vals);
        return res.insertId;
    } catch (err) {
        console.error('InsertMedia ERROR:', err);
        throw err;
    }
}

async function listMediaByFolder({ page, pageSize, folder_id, q = '' }) {
    const offset = (page - 1) * pageSize;
    if (q) {
        return query(
            'SELECT * FROM media_storage WHERE folder_id <=> ? AND name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?', [folder_id, '%' + q + '%', pageSize, offset]
        );
    }
    return query(
        'SELECT * FROM media_storage WHERE folder_id <=> ? ORDER BY id DESC LIMIT ? OFFSET ?', [folder_id, pageSize, offset]
    );
}

async function countMediaByFolder(folder_id, q = '') {
    if (q) {
        const rows = await query('SELECT COUNT(*) AS total FROM media_storage WHERE folder_id <=> ? AND name LIKE ?', [folder_id, '%' + q + '%']);
        return (rows[0] && rows[0].total) || 0;
    }
    const rows = await query('SELECT COUNT(*) AS total FROM media_storage WHERE folder_id <=> ?', [folder_id]);
    return (rows[0] && rows[0].total) || 0;
}

/**
 * rows: Array<{
 *  site, user_id, media_type?, uuid?, name,
 *  alt?, caption?, link?, thumbnail?,
 *  file_name, file_url, file_size?, extension?, mime,
 *  height?, width?, duration?, orientation?, version?
 * }>
 */
async function bulkInsertMedia(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return { affectedRows: 0 };

    const now = new Date();

    const mapped = rows.map(r => ([
        r.site,
        r.user_id,
        (r.media_type === undefined ? 'image' : r.media_type),
        (r.uuid = crypto.randomUUID()),
        r.name,
        (r.alt === undefined ? null : r.alt),
        (r.caption === undefined ? null : r.caption),
        (r.link === undefined ? null : r.link),
        (r.thumbnail === undefined ? null : r.thumbnail),
        r.file_name,
        r.file_url,
        (r.file_size === undefined ? null : r.file_size),
        (r.extension === undefined ? guessExtension(r.file_name) : r.extension),
        r.mime,
        (r.height === undefined ? null : r.height),
        (r.width === undefined ? null : r.width),
        (r.duration === undefined ? null : r.duration),
        (r.orientation === undefined ? null : r.orientation),
        (r.version === undefined ? null : r.version),
        now, // created_at
        now, // updated_at
    ]));

    const sql = `
    INSERT INTO media_storage (
      site, user_id, media_type, uuid, name, alt, caption, link, thumbnail,
      file_name, file_url, file_size, extension, mime,
      height, width, duration, orientation, version,
      created_at, updated_at
    ) VALUES ?
  `;

    return query(sql, [mapped]);
}

async function countMedia({ q = '', media_type, site, user_id } = {}) {
    const where = [];
    const params = [];
    if (q) {
        where.push('(name LIKE ? OR file_name LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
    }
    if (media_type) {
        where.push('media_type = ?');
        params.push(media_type);
    }
    if (site != null) {
        where.push('site = ?');
        params.push(site);
    }
    if (user_id != null) {
        where.push('user_id = ?');
        params.push(user_id);
    }
    const rows = await query(`SELECT COUNT(*) AS total FROM media_storage ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`, params);
    return (rows[0] && rows[0].total) || 0;
}

async function listMedia({ page = 1, pageSize = 20, q = '', media_type, site, user_id } = {}) {
    const offset = (page - 1) * pageSize;
    const where = [];
    const params = [];
    if (q) {
        where.push('(name LIKE ? OR file_name LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
    }
    if (media_type) {
        where.push('media_type = ?');
        params.push(media_type);
    }
    if (site != null) {
        where.push('site = ?');
        params.push(site);
    }
    if (user_id != null) {
        where.push('user_id = ?');
        params.push(user_id);
    }
    params.push(pageSize, offset);
    const sql = `
    SELECT * FROM media_storage
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
    return query(sql, params);
}

async function getMediaById(id) {
    const rows = await query(`SELECT * FROM media_storage WHERE id=?`, [id]);
    return rows[0] || null;
}

async function deleteMedia(id) {
    return query(`DELETE FROM media_storage WHERE id=?`, [id]);
}

module.exports = {
    insertMedia,
    listMediaByFolder,
    countMediaByFolder,
    bulkInsertMedia,
    countMedia,
    listMedia,
    getMediaById,
    deleteMedia,
};