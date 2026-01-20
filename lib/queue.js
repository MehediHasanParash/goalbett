import { Queue, Worker } from "bullmq"
import { getRedisClient } from "./redis"

const queues = {}
const workers = {}

// Get or create a queue
export function getQueue(queueName) {
  if (queues[queueName]) {
    return queues[queueName]
  }

  const redis = getRedisClient()
  if (!redis) {
    console.warn(`[v0] Queue ${queueName} cannot be created - Redis not available`)
    return null
  }

  queues[queueName] = new Queue(queueName, {
    connection: redis,
  })

  console.log(`[v0] Queue created: ${queueName}`)
  return queues[queueName]
}

// Add job to queue
export async function addJob(queueName, jobName, data, options = {}) {
  const queue = getQueue(queueName)
  if (!queue) {
    console.error(`[v0] Cannot add job to ${queueName} - queue not available`)
    return null
  }

  try {
    const job = await queue.add(jobName, data, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      ...options,
    })

    console.log(`[v0] Job added to ${queueName}: ${jobName} (${job.id})`)
    return job
  } catch (error) {
    console.error(`[v0] Failed to add job to ${queueName}:`, error)
    return null
  }
}

// Create worker for processing jobs
export function createWorker(queueName, processor) {
  if (workers[queueName]) {
    return workers[queueName]
  }

  const redis = getRedisClient()
  if (!redis) {
    console.warn(`[v0] Worker for ${queueName} cannot be created - Redis not available`)
    return null
  }

  workers[queueName] = new Worker(queueName, processor, {
    connection: redis,
  })

  workers[queueName].on("completed", (job) => {
    console.log(`[v0] Job completed: ${queueName}/${job.name} (${job.id})`)
  })

  workers[queueName].on("failed", (job, err) => {
    console.error(`[v0] Job failed: ${queueName}/${job.name} (${job.id})`, err)
  })

  console.log(`[v0] Worker created for queue: ${queueName}`)
  return workers[queueName]
}

// Predefined queues
export const QUEUES = {
  TENANT: "tenant-operations",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
  TRANSACTIONS: "transactions",
  BETS: "bet-processing",
}

// Initialize default workers (optional - can be done in separate worker process)
export function initializeWorkers() {
  // Tenant operations worker
  createWorker(QUEUES.TENANT, async (job) => {
    console.log(`[v0] Processing tenant job: ${job.name}`, job.data)

    switch (job.name) {
      case "create-tenant":
        // Handle tenant creation tasks
        break
      case "suspend-tenant":
        // Handle tenant suspension
        break
      case "delete-tenant":
        // Handle tenant deletion and cleanup
        break
      default:
        console.warn(`[v0] Unknown tenant job type: ${job.name}`)
    }
  })

  // Notifications worker
  createWorker(QUEUES.NOTIFICATIONS, async (job) => {
    console.log(`[v0] Processing notification job: ${job.name}`, job.data)
    // Handle notification sending
  })

  console.log("[v0] All workers initialized")
}
