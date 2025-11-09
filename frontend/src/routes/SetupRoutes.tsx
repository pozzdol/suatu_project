import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import AdminWindowIndexPage from "@/pages/admin/windows/Index";
import AdminWindowCreatePage from "@/pages/admin/windows/Create";
import { Route, Routes } from "react-router-dom";
import AdminWindowEditPage from "@/pages/admin/windows/Edit";

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
      <Route
        path="/window/create"
        element={
          <Layout isActive="/general-setup/window">
            <AdminWindowCreatePage />
          </Layout>
        }
      />
      <Route
        path="/window/:id"
        element={
          <Layout isActive="/general-setup/window">
            <AdminWindowEditPage />
          </Layout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default SetupRoutes;
