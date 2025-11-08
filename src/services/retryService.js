export const getBackoffDelay = (attempts, base) => {
  return Math.pow(base, attempts) * 1000; // ms
};