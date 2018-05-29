import Limiter from 'ratelimiter';
import { once } from 'lodash';
import redis from 'redis';
import thenify from 'thenify';

const getRedisClient = once(() => {
  return redis.createClient(process.env.REDIS_URL || 'redis://redis');
});

export default async function rateLimit({ category, id, max, duration }) {
  const redisClient = getRedisClient();
  let fullId = id;
  if (category) {
    fullId = `${category}:${id}`;
  }
  const limiter = new Limiter({
    db: redisClient,
    id: fullId,
    max,
    duration,
  });
  const getLimit = thenify(limiter.get.bind(limiter));
  const limit = await getLimit();
  if (!limit.remaining) {
    const error = new Error('Too many requests');
    error.status = 429;
    throw error;
  }
}
