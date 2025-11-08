import Job from "../models/Job.js";

export const enqueueJob = async (jobData) => {
  const job = new Job(jobData);
  return await job.save();
};

export const listJobs = async (state) => {
  const filter = state ? { state } : {};
  return await Job.find(filter);
};