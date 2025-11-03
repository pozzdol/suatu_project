import { Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import DashboardIndexPage from "./pages/dashboard/Index";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/Layout";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route
          path="/app/*"
          element={
            <Layout isActive={"/app"}>
              <DashboardIndexPage />
            </Layout>
          }
        />
      </Routes>
    </>
  );
}

export default App;
