import axios from "axios";
import type { AxiosResponse, AxiosRequestConfig } from "axios";
import { getToken } from "./auth";

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  status?: boolean;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: "/api", // This matches your Vite proxy config
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// Enhanced request function with body support for all methods
export const requestApi = {
  get: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    // For GET requests with body, we need to use the `data` property in config
    const requestConfig: AxiosRequestConfig = {
      ...config,
      ...(data && { data }), // Add data to request config if provided
    };
    return apiClient.get(url, requestConfig);
  },

  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post(url, data, config);
  },

  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put(url, data, config);
  },

  delete: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    // For DELETE requests with body, we need to use the `data` property in config
    const requestConfig: AxiosRequestConfig = {
      ...config,
      ...(data && { data }), // Add data to request config if provided
    };
    return apiClient.delete(url, requestConfig);
  },

  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch(url, data, config);
  },

  // Additional method for more explicit body handling
  request: async <T = any>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS",
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const requestConfig: AxiosRequestConfig = {
      method,
      url,
      ...config,
      ...(data && { data }), // Always include data if provided
    };
    return apiClient.request(requestConfig);
  },
};

// Enhanced legacy function with body support for all methods
export const requestApiLegacy = async (
  url: string,
  method: string = "GET",
  data?: any,
  config?: AxiosRequestConfig
) => {
  const token = getToken();

  try {
    const requestConfig: AxiosRequestConfig = {
      url: `/api${url}`, // Add /api prefix to match your proxy
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(config?.headers || {}),
      },
      ...config,
      ...(data && { data }), // Include data for all methods if provided
    };

    const response = await axios(requestConfig);
    return response.data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// Convenience methods for common use cases
export const apiHelpers = {
  // GET with query parameters (traditional approach)
  getWithParams: async <T = any>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return requestApi.get(url, undefined, { ...config, params });
  },

  // GET with body (for APIs that require it)
  getWithBody: async <T = any>(
    url: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return requestApi.get(url, data, config);
  },

  // DELETE with body (for APIs that require it)
  deleteWithBody: async <T = any>(
    url: string,
    data: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return requestApi.delete(url, data, config);
  },

  // Batch requests
  batch: async (
    requests: Array<{
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      url: string;
      data?: any;
      config?: AxiosRequestConfig;
    }>
  ) => {
    const promises = requests.map((req) =>
      requestApi.request(req.method, req.url, req.data, req.config)
    );
    return Promise.allSettled(promises);
  },
};

export default requestApi;
