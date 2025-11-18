import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import { Route, Routes } from "react-router-dom";
import AdminWindowCreatePage from "@/pages/admin/windows/Create";
import AdminWindowEditPage from "@/pages/admin/windows/Edit";
import AdminRoleCreatePage from "@/pages/admin/roles/Create";
import AdminRoleEditPage from "@/pages/admin/roles/Edit";
import AdminUserIndexPage from "@/pages/admin/users/Index";
import AdminUserCreatePage from "@/pages/admin/users/Create";
import AdminRoleIndexPage from "@/pages/admin/roles/Index";
import AdminUserEditPage from "@/pages/admin/users/Edit";
import AdminWindowIndexPage from "@/pages/admin/windows";
import AdminDepartmentIndexPage from "@/pages/admin/department/Index";
import AdminDepartmentCreatePage from "@/pages/admin/department/Create";
import AdminOrganizationIndexPage from "@/pages/admin/organization/Index";
import AdminOrganizationCreatePage from "@/pages/admin/organization/Create";

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

      <Route
        path="/user-management"
        element={
          <Layout isActive="/general-setup/user-management">
            <AdminUserIndexPage />
          </Layout>
        }
      />
      <Route
        path="/user-management/create"
        element={
          <Layout isActive="/general-setup/user-management">
            <AdminUserCreatePage />
          </Layout>
        }
      />
      <Route
        path="/user-management/:id"
        element={
          <Layout isActive="/general-setup/user-management">
            <AdminUserEditPage />
          </Layout>
        }
      />

      <Route
        path="/department"
        element={
          <Layout isActive="/general-setup/department">
            <AdminDepartmentIndexPage />
          </Layout>
        }
      />
      <Route
        path="/department/create"
        element={
          <Layout isActive="/general-setup/department">
            <AdminDepartmentCreatePage />
          </Layout>
        }
      />
      <Route
        path="/user-management/:id"
        element={
          <Layout isActive="/general-setup/user-management">
            <AdminUserEditPage />
          </Layout>
        }
      />

      <Route
        path="/organization"
        element={
          <Layout isActive="/general-setup/organization">
            <AdminOrganizationIndexPage />
          </Layout>
        }
      />
      <Route
        path="/organization/create"
        element={
          <Layout isActive="/general-setup/organization">
            <AdminOrganizationCreatePage />
          </Layout>
        }
      />
      <Route
        path="/user-management/:id"
        element={
          <Layout isActive="/general-setup/user-management">
            <AdminUserEditPage />
          </Layout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default SetupRoutes;
