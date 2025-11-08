import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import AdminWindowIndexPage from "@/pages/admin/windows";
import { Route, Routes } from "react-router-dom";

function SetupRoutes() {
  return (
    <Routes>
      <Route
        path="/window"
        element={
          <Layout isActive="/general-setup/window">
            <AdminWindowIndexPage />
          </Layout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default SetupRoutes;
