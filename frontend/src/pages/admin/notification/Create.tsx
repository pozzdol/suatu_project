import useDocumentTitle from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";

import Loading from "@/components/Loading";
import Permit from "@/components/Permit";

function NotificationCreatePage() {
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
        const pageData = await validatePermit("46f6c4a0a50146f1b40ea9798aab9738");

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
        toast.error("Failed to validate permissions");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  useDocumentTitle(title);

  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [user, setUser] = useState<[]>([]);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get('/general/setup/users/list');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchUser();
    }
  }, [permit]);
  // EFFECTS END

  //  HELPERS
  // HELPERS END

  // FUNCTIONS
  // FUNCTIONS END

  // TABLE
  // TABLE END

  // PAGE LOAD RENDER
  if (loading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }
  // PAGE LOAD RENDER END

  return (
    <div className="pt-6 px-8 pb-14 min-h-[calc(100vh-64px)] md:py-6">
      <div className="text-gray-500 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        <div className="flex justify-between">
          {user.map ((item: any) => (
            <div key={item.id}>
              <p>{item.name}</p>
              <input type="checkbox" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotificationCreatePage;