export const BASE_URL = "https://data-dbg.krx.co.kr";

export interface KrxRequestOptions {
  readonly endpoint: string;
  readonly params: Record<string, string>;
  readonly apiKey: string;
}

export interface KrxResponse<T = Record<string, string>> {
  readonly success: boolean;
  readonly data: readonly T[];
  readonly error?: string;
  readonly errorCode?: string;
}

interface KrxErrorBody {
  readonly respMsg?: string;
  readonly respCode?: string;
}

export async function krxFetch<T = Record<string, string>>(
  options: KrxRequestOptions,
): Promise<KrxResponse<T>> {
  const { checkRateLimit, incrementCallCount } =
    await import("./rate-limit.js");
  const rateStatus = checkRateLimit();

  if (!rateStatus.allowed) {
    return {
      success: false,
      data: [],
      error: `Daily rate limit exceeded (${rateStatus.count}/${rateStatus.limit})`,
      errorCode: "RATE_LIMIT",
    };
  }

  if (rateStatus.warning) {
    process.stderr.write(
      `Warning: ${rateStatus.count}/${rateStatus.limit} API calls used today\n`,
    );
  }

  const url = `${BASE_URL}${options.endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      AUTH_KEY: options.apiKey,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(options.params),
  });

  incrementCallCount();

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorBody = (await response.json()) as KrxErrorBody;
      if (errorBody.respMsg) {
        errorMsg = errorBody.respMsg;
      }
      errorCode = errorBody.respCode;
    } catch {
      // response body is not JSON, use default error message
    }

    return {
      success: false,
      data: [],
      error: errorMsg,
      errorCode,
    };
  }

  const body = (await response.json()) as Record<string, unknown>;

  const outBlock = body["OutBlock_1"];
  if (!Array.isArray(outBlock)) {
    return {
      success: false,
      data: [],
      error: "Unexpected response format: missing OutBlock_1",
    };
  }

  return {
    success: true,
    data: outBlock as T[],
  };
}
