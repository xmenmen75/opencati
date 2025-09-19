/**
 * Centralized API client with error handling and authentication
 */

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 10000;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('opencati_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorData: { error?: string; message?: string };
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'An error occurred' };
      }

      throw new ApiError(
        response.status,
        errorData.error || errorData.message || `HTTP ${response.status}`,
        errorData
      );
    }

    // Handle empty responses (like 204 No Content)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      return this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      return this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      return this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      throw error;
    }
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      return this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
