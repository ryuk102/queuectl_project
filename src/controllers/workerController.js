import { startWorkers } from "../services/workerService.js";

export const launchWorkers = async (count, baseBackoff) => {
  await startWorkers(count, baseBackoff);
};