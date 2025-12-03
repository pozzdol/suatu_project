import Layout from "@/components/layout/Layout";
import NotFound from "@/components/NotFound";
import DetailSpkPage from "@/pages/application/spk/Detail";
import SPKIndexPage from "@/pages/application/spk/Index";
import SPKShowPage from "@/pages/application/spk/Show";
import { Route, Routes } from "react-router-dom";

function SPKRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout isActive="/spk">
            <SPKIndexPage />
          </Layout>
        }
      />

      <Route
        path="/:id"
        element={
          <Layout isActive="/spk">
            <SPKShowPage />
          </Layout>
        }
      />

      <Route
        path="/detail/:id"
        element={
          <Layout isActive="/spk">
            <DetailSpkPage />
          </Layout>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default SPKRoutes;
