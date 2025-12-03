import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import DeliveryOrderPage from "@/pages/application/delivery-order/Index";
import DeliveryOrderShowPage from "@/pages/application/delivery-order/Show";
import FinishedGoodsIndexPage from "@/pages/application/finished-goods/Index";
import { Route, Routes } from "react-router-dom";

function WarehouseRoutes() {
  return (
    <Routes>
      <Route
        path="/finished-goods"
        element={
          <Layout isActive="/warehouse/finished-goods">
            <FinishedGoodsIndexPage />
          </Layout>
        }
      />

      <Route
        path="/delivery-order"
        element={
          <Layout isActive="/warehouse/delivery-order">
            <DeliveryOrderPage />
          </Layout>
        }
      />

      <Route
        path="/delivery-order/:id"
        element={
          <Layout isActive="/warehouse/delivery-order">
            <DeliveryOrderShowPage />
          </Layout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default WarehouseRoutes;
