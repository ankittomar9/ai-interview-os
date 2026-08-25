export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  apiKey?: string;
}

export const fetchJson = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  const {
    timeoutMs = 15000,
    retries = options.method === 'GET' || !options.method ? 1 : 0,
    apiKey,
    headers: customHeaders,
    ...rest
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>)
  };

  if (apiKey) {
    headers['X-InterviewOS-Key'] = apiKey;
  }

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...rest,
        headers,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        let errorData: any;
        try {
          errorData = await res.json();
        } catch {
          errorData = await res.text();
        }
        const errorMsg =
          typeof errorData === 'object' && errorData?.message
            ? errorData.message
            : typeof errorData === 'string' && errorData.length > 0
            ? errorData
            : `HTTP ${res.status} error from ${url}`;
        throw new ApiError(errorMsg, res.status, errorData);
      }

      if (res.status === 204) {
        return {} as T;
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new ApiError(`Request to ${url} timed out after ${timeoutMs}ms`, 408);
      }
      if (attempt < retries && (err instanceof TypeError || err.status >= 500)) {
        attempt++;
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }

  throw new ApiError(`Failed to fetch from ${url}`, 500);
};