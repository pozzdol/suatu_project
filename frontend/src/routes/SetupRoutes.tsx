import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import { Route, Routes } from "react-router-dom";
import AdminRoleIndexPage from "@/pages/admin/roles";
import AdminWindowIndexPage from "@/pages/admin/windows";
import AdminWindowCreatePage from "@/pages/admin/windows/Create";
import AdminWindowEditPage from "@/pages/admin/windows/Edit";
import AdminRoleCreatePage from "@/pages/admin/roles/Create";
import AdminRoleEditPage from "@/pages/admin/roles/Edit";

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
      <Route
        path="/role"
        element={
          <Layout isActive="/general-setup/role">
            <AdminRoleIndexPage />
          </Layout>
        }
      />
      <Route
        path="/role/create"
        element={
          <Layout isActive="/general-setup/role">
            <AdminRoleCreatePage />
          </Layout>
        }
      />
      <Route
        path="/role/:id"
        element={
          <Layout isActive="/general-setup/role">
            <AdminRoleEditPage />
          </Layout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default SetupRoutes;
