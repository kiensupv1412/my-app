// path: server/routes/gsc.routes.js (CJS)
const router = require('express').Router()
const { gscQueue, gscQueueEvents } = require('../lib/queue');

// Enqueue job
router.post('/refresh', async (req, res, next) => {
  try {
    const {
      siteUrl,                      // "https://example.com"
      path, client_email, private_key,
      urls,                         // ["https://example.com/a", ...]
      from, to,                     // "YYYY-MM-DD"
      dryRun,                       // boolean
      quota                         // { rpmRetry: boolean, ... }
    } = req.body || {};

    if (!siteUrl && !dryRun) {
      return res.status(400).json({ ok: false, error: 'siteUrl required (or use dryRun=true)' });
    }

    const job = await gscQueue.add(
      'refresh',
      { siteUrl, path, client_email, private_key, urls, from, to, dryRun, quota },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      }
    );

    res.json({ ok: true, jobId: job.id });
  } catch (e) {
    next(e);
  }
});

// Lấy trạng thái job
router.get('/status/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const job = await gscQueue.getJob(id);
    if (!job) return res.status(404).json({ ok: false, error: 'job not found' });

    const state = await job.getState();
    const progress = job.progress;
    const returnvalue = state === 'completed' ? job.returnvalue : undefined;

    res.json({ ok: true, id, state, progress, returnvalue });
  } catch (e) {
    next(e);
  }
});

module.exports = router;