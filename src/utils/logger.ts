const isProd = import.meta.env.PROD;

export const logDebug = (...args: unknown[]) => {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.debug(...args);
  }
};

export const logError = (...args: unknown[]) => {
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};
