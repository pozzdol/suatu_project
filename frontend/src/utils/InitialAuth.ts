import { useEffect } from "react";
import { isAuthenticatedWithValidation, forceLogout } from "@/utils/auth";

export const useInitialAuth = () => {
  useEffect(() => {
    const validateOnLoad = async () => {
      try {
        const isValid = await isAuthenticatedWithValidation();
        if (!isValid) {
          console.log("Initial auth validation failed 1");
          // forceLogout();
        }
      } catch (error) {
        console.error("Initial auth validation failed:", error);
        // forceLogout();
      }
    };

    validateOnLoad();
  }, []);
};
