import { api, ApiClientError } from './api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: string[];
  };
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiResponse<T>> {
  try {
    let cleanPath = path;
    if (cleanPath.startsWith('/api/v1')) {
      cleanPath = cleanPath.replace('/api/v1', '');
    }

    const parsedBody =
      typeof options.body === 'string' ? JSON.parse(options.body) : options.body;

    const data = await api<T>(cleanPath, {
      method: options.method ?? 'GET',
      body: parsedBody,
    });

    return {
      success: true,
      data,
    };
  } catch (err: any) {
    if (err instanceof ApiClientError) {
      return {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Unknown error occurred',
      },
    };
  }
}
