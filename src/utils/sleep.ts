export const sleep = (duration = 300): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
