// import useDocumentTitle from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import toast from "react-hot-toast";
import { Button } from "antd";
import { logout } from "@/utils/auth";
import { FileSearchIcon } from "@phosphor-icons/react";

// import Loading from "@components/Loading";
// import Permission from "@components/Permission";

function DashboardIndexPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "9e2ad4d2d55a4faab5a082386def0bee"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          setIndexUrl(pageData.data.page.url);
          setPermit(pageData.data.permit.permission);
          setIsEditable(pageData.data.permit.isEditable);
          setIsAdmin(pageData.data.permit.isAdmin);
        } else {
          setPermit(false);
          toast.error("You don't have permission to access this page");
        }
      } catch (error) {
        setPermit(false);
        console.error("Failed to validate permissions, ", error);
        toast.error("Failed to validate permissions");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [isLogout, setIsLogout] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      // fetchData();
    }
  }, [permit]);
  // EFFECTS END

  //  HELPERS
  // HELPERS END

  // FUNCTIONS
  const handleLogout = async () => {
    setIsLogout(true);
    try {
      await logout();
      toast.success("Logout berhasil!");
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  // FUNCTIONS END

  // TABLE
  // TABLE END

  // PAGE LOAD RENDER
  // if (loading) {
  //   return <Loading />;
  // }

  // if (!permit) {
  //   return <Permission />;
  // }
  // PAGE LOAD RENDER END

  return (
    <div className="pb-14 md:pb-0 min-h-[calc(100vh-64px)]">
      <div className="text-primary grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        <Button type="primary" icon={<FileSearchIcon />} onClick={handleLogout}>
          signout
        </Button>
      </div>
    </div>
  );
}

export default DashboardIndexPage;
