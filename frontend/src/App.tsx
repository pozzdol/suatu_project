import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import DashboardIndexPage from "./pages/dashboard/Index";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/Layout";
import SetupRoutes from "./routes/SetupRoutes";
import { ConfigProvider } from "antd";
import NotFound from "./components/NotFound";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#30d681",
            colorPrimaryHover: "#33cf97",
            colorPrimaryBorder: "#66dbb1",
          },
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route
            path="/app/*"
            element={
              <Layout isActive={"/app"}>
                <DashboardIndexPage />
              </Layout>
            }
          />
          <Route path="/general-setup/*" element={<SetupRoutes />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ConfigProvider>
    </>
  );
}

export default App;
