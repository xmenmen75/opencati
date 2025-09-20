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
    // Check if we're in the browser before accessing localStorage
    if (typeof window === 'undefined') return {};
    
    const token = localStorage.getItem('opencati_auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private shouldMakeAuthenticatedRequest(endpoint: string): boolean {
    // Allow certain endpoints to be called without authentication
    const publicEndpoints = ['/api/auth/nonce'];
    return !publicEndpoints.some(ep => endpoint.includes(ep));
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
    // Check if this endpoint requires authentication and we don't have a token
    if (this.shouldMakeAuthenticatedRequest(endpoint) && 
        (typeof window === 'undefined' || !localStorage.getItem('opencati_auth_token'))) {
      throw new ApiError(401, 'No authentication token available');
    }

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
    // Check if this endpoint requires authentication and we don't have a token
    // Allow auth verification and logout even without token
    const authEndpoints = ['/api/auth/verify', '/api/auth/logout'];
    if (this.shouldMakeAuthenticatedRequest(endpoint) && 
        !authEndpoints.some(ep => endpoint.includes(ep)) && 
        (typeof window === 'undefined' || !localStorage.getItem('opencati_auth_token'))) {
      throw new ApiError(401, 'No authentication token available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Handle FormData differently
      const isFormData = data instanceof FormData;
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
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
      // Handle FormData differently
      const isFormData = data instanceof FormData;
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
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
