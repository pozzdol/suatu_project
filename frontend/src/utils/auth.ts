import Cookies from "js-cookie";
import axios from "axios";
// import crypto from 'crypto';

interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    expired: string;
  };
  message: string;
}

interface LoginError {
  message: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

let sessionValidationCache: {
  isValid: boolean;
  timestamp: number;
} | null = null;

const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const isAuthenticated = (): boolean => {
  const token = Cookies.get("COOKIE");
  const expiry = Cookies.get("COOKIE_EXPIRY");

  if (!token || !expiry) {
    return false;
  }

  // Check if token is expired
  const expiryDate = new Date(expiry);
  const now = new Date();

  if (now >= expiryDate) {
    removeToken();
    return false;
  }

  return true;
};

export const isAuthenticatedWithValidation = async (
  bypassCache: boolean = false
): Promise<boolean> => {
  if (!isAuthenticated()) {
    return false;
  }

  const now = Date.now();
  if (
    !bypassCache &&
    sessionValidationCache &&
    now - sessionValidationCache.timestamp < SESSION_CACHE_DURATION
  ) {
    return sessionValidationCache.isValid;
  }

  try {
    const { SessionValidation } = await import("./validation");
    const isSessionValid = await SessionValidation(
      "ehjljel9e18r71d452zc897kipgtl561"
    );

    sessionValidationCache = {
      isValid: isSessionValid,
      timestamp: now,
    };

    if (!isSessionValid) {
      forceLogout();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Session validation failed:", error);
    sessionValidationCache = null;
    forceLogout();
    return false;
  }
};

// Clear session cache when needed
export const clearSessionCache = (): void => {
  sessionValidationCache = null;
};

const encodeToken = (token: string): string => {
  return btoa(token); // Simple base64 encoding
};

const decodeToken = (encodedToken: string): string => {
  try {
    return atob(encodedToken); // Simple base64 decoding
  } catch (error) {
    console.error("Failed to decode token:", error);
    return encodedToken;
  }
};

export const getToken = (): string | undefined => {
  if (!isAuthenticated()) {
    return undefined;
  }

  const encodedToken = Cookies.get("COOKIE");
  if (!encodedToken) {
    return undefined;
  }

  try {
    return decodeToken(encodedToken);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return undefined;
  }
};

export const setToken = (token: string, expired: string): void => {
  const expiryDate = new Date(expired);
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Encode the token before storing
  const tokenEncoded = encodeToken(token);

  Cookies.set("COOKIE", tokenEncoded, {
    expires: daysUntilExpiry > 0 ? daysUntilExpiry : 1,
  });
  Cookies.set("COOKIE_EXPIRY", expired, {
    expires: daysUntilExpiry > 0 ? daysUntilExpiry : 1,
  });

  clearSessionCache();
};

export const removeToken = (): void => {
  Cookies.remove("COOKIE");
  Cookies.remove("COOKIE_EXPIRY");

  clearSessionCache();
};

export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "/api";

    const response = await axios.post<LoginResponse>(
      `${API_URL}/login`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      await setToken(response.data.data.token, response.data.data.expired);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data as LoginError;
      throw new Error(errorData.message || "Login failed");
    }
    throw new Error("Network error. Please try again.");
  }
};

export const logout = async (): Promise<void> => {
  const token = await getToken();

  try {
    if (token) {
      const response = await axios.post<LogoutResponse>(
        "/api/logout",
        { withCredentials: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );

      // Optionally handle specific response
      if (response.data.success) {
        console.log("Logout successful:", response.data.message);
      }
    }
  } catch (error) {
    console.warn("Logout API call failed:", error);
    // Continue with local logout regardless
  } finally {
    removeToken();
  }
};

// Get token expiry date
export const getTokenExpiry = (): Date | null => {
  const expiry = Cookies.get("COOKIE_EXPIRY");
  return expiry ? new Date(expiry) : null;
};

// Check if token expires soon (within 24 hours)
export const isTokenExpiringSoon = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return false;

  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return expiry <= twentyFourHoursFromNow;
};

// Force logout without API call (for token expiration, etc.)
export const forceLogout = (): void => {
  removeToken();

  // Redirect to login if we're not already there
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.includes("/auth/login")
  ) {
    window.location.href = "/auth/login";
  }
};
