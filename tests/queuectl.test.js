import { expect } from "chai";
import { enqueueJob, listJobs } from "../src/services/jobService.js";
import connectDB from "../src/config/db.js";
import mongoose from "mongoose";

describe("QueueCTL CLI Job System", () => {
  before(async () => {
    await connectDB();
  });

  it("should enqueue a new job", async () => {
    const job = await enqueueJob({
      id: "job1",
      command: "echo Hello",
      max_retries: 2,
    });
    expect(job).to.have.property("id", "job1");
  });

  it("should list all jobs", async () => {
    const jobs = await listJobs();
    expect(jobs).to.be.an("array");
  });

  after(async () => {
    await mongoose.connection.close();
  });
});