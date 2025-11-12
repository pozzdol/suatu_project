import { useEffect } from "react";

const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const originalTitle = document.title;
    const appName = import.meta.env.VITE_APP_NAME || "HSE";
    document.title = `${title} | ${appName}`;

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
