import Layout from "@/components/layout/Layout";
import SPKIndexPage from "@/pages/application/spk/Index";
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
    </Routes>
  );
}

export default SPKRoutes;
