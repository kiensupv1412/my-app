// path: server/workers/gsc.worker.js (CJS)
const { Worker } = require('bullmq');
const { connection } = require('../lib/queue');
const { index } = require('../modules/gsc'); // chính là server/modules/gsc/index.js của bạn

new Worker(
  'gsc',
  async (job) => {
    const { siteUrl, path, client_email, private_key, urls, from, to, dryRun, quota } = job.data;

    // Log vào console để bạn thấy
    console.log('[GSC Worker] start', { id: job.id, siteUrl, urlsCount: urls?.length || 0, dryRun });

    // Gọi hàm index của module bạn (đã CJS)
    const result = await index('cli', {
      siteUrl,
      path,
      client_email,
      private_key,
      urls,
      from,
      to,
      dryRun,
      quota,
    });

    console.log('[GSC Worker] done', { id: job.id });
    return result; // sẽ được lưu vào job.returnvalue
  },
  connection
);

// (optional) bắt error để dễ debug
process.on('unhandledRejection', (e) => console.error('[worker:unhandledRejection]', e));
process.on('uncaughtException',  (e) => console.error('[worker:uncaughtException]', e));