import { requestApi } from "@/utils/api";
import { forceLogout } from "@/utils/auth";

// Base validation response interface
interface BaseValidationResponse {
  success: boolean;
  message?: string;
  data: Record<string, any>; // More flexible data structure
}

// Type guard to check if response has session property
const hasSession = (data: any): data is { session: boolean } => {
  return data && typeof data.session === "boolean";
};

export const SessionValidation = async (permit: string): Promise<boolean> => {
  try {
    const response = await requestApi.post<BaseValidationResponse>(
      `/validation/permit/${permit}`,
      { withCredentials: true }
    );

    // Check if session is invalid using type guard
    if (
      hasSession(response.data.data) &&
      response.data.data.session === false
    ) {
      forceLogout();
      return false;
    }

    return (
      response.data.success &&
      hasSession(response.data.data) &&
      response.data.data.session === true
    );
  } catch (error: any) {
    console.error("Session validation failed:", error);

    // If it's a 401 or 403, force logout
    if (error.response?.status === 401 || error.response?.status === 403) {
      forceLogout();
    }

    return false;
  }
};

export const validatePermit = async (
  permit: string
): Promise<BaseValidationResponse | false> => {
  try {
    const response = await requestApi.post<BaseValidationResponse>(
      `/validation/permit/${permit}`,
      { withCredentials: true }
    );

    // Check session validity first using type guard
    if (
      hasSession(response.data.data) &&
      response.data.data.session === false
    ) {
      forceLogout();
      return false;
    }

    return response.data;
  } catch (error: any) {
    console.error("Permit validation failed:", error);

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      forceLogout();
    }

    return false;
  }
};
