exports.ok = (res, data) => res.json(data);

exports.created = (res, data, location) => {
  if (location) res.set("Location", location);
  return res.status(201).json({ data });
};
exports.badRequest = (res, msg = "Bad request") =>
  res.status(400).json({ error: msg });

exports.notFound = (res, msg = "Not found") =>
  res.status(404).json({ error: msg });
