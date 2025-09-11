// server/helpers/paths.js
const path = require('path');
const fs = require('fs');

const ROOT_PUBLIC = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(ROOT_PUBLIC, 'uploads');

function safeSlug(s) {
    const x = String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return x.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function ensureDir(abs) {
    if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
}

function folderAbsPath(slug) {
    const safe = safeSlug(slug);
    const p = path.join(UPLOADS_DIR, safe);
    const rel = path.relative(UPLOADS_DIR, p);
    if (rel.startsWith('..')) throw new Error('Invalid folder path');
    return p;
}

module.exports = { ROOT_PUBLIC, UPLOADS_DIR, safeSlug, ensureDir, folderAbsPath };