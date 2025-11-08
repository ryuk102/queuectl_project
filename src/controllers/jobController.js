import { enqueueJob, listJobs } from "../services/jobService.js";

export const addJob = async (jsonData) => {
  let jobData;
  try {
    jobData = JSON.parse(jsonData.trim());
  } catch (err) {
    console.error("Invalid JSON input. Example format:");
    console.error('{"id":"job1","command":"sleep 2"}');
    throw err;
  }


  return await enqueueJob(jobData);
};

export const getJobs = async (state) => {
  return await listJobs(state);
};
