/**
 * BullMQ Queue Setup
 * Gracefully handles missing Redis configuration
 */

let Queue: typeof import("bullmq").Queue | null = null;


async function initBullMQ() {
  if (!process.env.REDIS_URL) {
    console.warn("REDIS_URL not set — queue system disabled");
    return null;
  }

  try {
    const bullmq = await import("bullmq");
    const IORedis = (await import("ioredis")).default;

    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    Queue = bullmq.Queue;

    return connection;
  } catch (error) {
    console.error("Failed to initialize BullMQ:", error);
    return null;
  }
}

export async function getPostingQueue() {
  const connection = await initBullMQ();
  if (!connection || !Queue) return null;

  return new Queue("posting", { connection });
}

export async function addToPostingQueue(data: {
  calendar_item_id: string;
  org_id: string;
  delay?: number;
}) {
  const queue = await getPostingQueue();
  if (!queue) {
    console.warn("Posting queue not available — post will need manual publishing");
    return null;
  }

  return queue.add(
    "publish-post",
    {
      calendar_item_id: data.calendar_item_id,
      org_id: data.org_id,
    },
    {
      delay: data.delay || 0,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 30000, // Start with 30s, then 60s, then 120s
      },
    }
  );
}
