import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import OrdersCreatePage from "@/pages/application/orders/Create";
import OrdersEditPage from "@/pages/application/orders/Edit";
import OrdersIndexPage from "@/pages/application/orders/Index";
import { Route, Routes } from "react-router-dom";

function OrdersRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout isActive="/orders">
            <OrdersIndexPage />
          </Layout>
        }
      />

      <Route
        path="/create"
        element={
          <Layout isActive="/orders">
            <OrdersCreatePage />
          </Layout>
        }
      />

      <Route
        path="/:id"
        element={
          <Layout isActive="/orders">
            <OrdersEditPage />
          </Layout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default OrdersRoutes;
