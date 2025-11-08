#!/usr/bin/env node
import { Command } from "commander";
import connectDB from "../config/db.js";
import dotenv from "dotenv";
import chalk from "chalk";
import { addJob, getJobs } from "../controllers/jobController.js";
import { launchWorkers } from "../controllers/workerController.js";

dotenv.config();
await connectDB();

const program = new Command();

program
  .name("queuectl")
  .description("CLI-based background job queue system")
  .version("1.0.0");

program
  .command("enqueue")
  .argument("<json>", "Job data in JSON format")
  .action(async (json) => {
    try {
      const job = await addJob(json);
      console.log(chalk.green(` Enqueued job: ${job.id}`));
    } catch (err) {
      console.error(chalk.red("Error:"), err.message);
    }
  });

program
  .command("list")
  .option("--state <state>", "Filter by job state")
  .action(async (opts) => {
    const jobs = await getJobs(opts.state);
    console.table(jobs.map((j) => j.toObject()));
  });

program
  .command("worker:start")
  .option("--count <count>", "Number of workers", "1")
  .action(async (opts) => {
    await launchWorkers(Number(opts.count), process.env.BACKOFF_BASE);
  });

program.parse();