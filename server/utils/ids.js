exports.parseId = (v) => {
  const id = Number(v);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
};
