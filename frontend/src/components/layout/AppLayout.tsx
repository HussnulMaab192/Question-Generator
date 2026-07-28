import { Outlet } from "react-router-dom";

import Toaster from "@/components/common/Toaster";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { ToastProvider } from "@/contexts/ToastContext";

/**
 * Shared page shell (header + content + footer) used by every route.
 * Keep this responsive: it must render well on Windows laptops,
 * Android tablets, and iPads.
 */
export default function AppLayout() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </ToastProvider>
  );
}
