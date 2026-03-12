interface RetryOptions {
  readonly maxRetries?: number;
  readonly baseDelay?: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("econnrefused") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("network")
    );
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options?.baseDelay ?? DEFAULT_BASE_DELAY;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isNetworkError(err) || attempt === maxRetries) {
        throw err;
      }

      const waitMs = baseDelay * Math.pow(2, attempt);
      await delay(waitMs);
    }
  }

  throw lastError;
}
