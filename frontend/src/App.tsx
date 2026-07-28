import { Route, Routes } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import AdminPage from "@/pages/AdminPage";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import { ROUTES } from "@/routes/paths";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.admin} element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
