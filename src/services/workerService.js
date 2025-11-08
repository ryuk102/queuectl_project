import { exec } from "child_process";
import Job from "../models/Job.js";
import { getBackoffDelay } from "./retryService.js";

export const startWorkers = async (count, baseBackoff) => {
  console.log(` Starting ${count} worker(s)...`);
  const workers = Array.from({ length: count }, (_, i) => runWorker(i + 1, baseBackoff));
  await Promise.all(workers);
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const runWorker = async (workerId, baseBackoff) => {
  while (true) {
    const job = await Job.findOneAndUpdate(
      { state: "pending" },
      { state: "processing" },
      { new: true }
    );

    if (!job) {
      await delay(2000);
      continue;
    }

    console.log(` Worker ${workerId} executing job ${job.id}...`);
    exec(job.command, async (err) => {
      if (!err) {
        job.state = "completed";
        console.log(` Job ${job.id} completed`);
      } else {
        job.attempts += 1;
        if (job.attempts >= job.max_retries) {
          job.state = "dead";
          console.log(` Job ${job.id} moved to DLQ`);
        } else {
          job.state = "failed";
          const delayMs = getBackoffDelay(job.attempts, baseBackoff);
          console.log(` Retrying job ${job.id} in ${delayMs / 1000}s`);
          setTimeout(async () => {
            job.state = "pending";
            await job.save();
          }, delayMs);
        }
      }
      job.updated_at = new Date();
      await job.save();
    });
  }
};