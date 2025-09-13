// path: server/lib/queue.js (CJS)
const { Queue, Worker, QueueEvents } = require('bullmq');

const connection = process.env.REDIS_URL
  ? { connection: { url: process.env.REDIS_URL } }
  : { connection: { host: process.env.REDIS_HOST || '127.0.0.1', port: +(process.env.REDIS_PORT || 6379) } };

const gscQueue = new Queue('gsc', connection);
const gscQueueEvents = new QueueEvents('gsc', connection);

module.exports = { gscQueue, gscQueueEvents, connection };