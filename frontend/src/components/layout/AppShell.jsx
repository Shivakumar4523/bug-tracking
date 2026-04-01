import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const AppShell = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />

      <div className="mx-auto flex min-h-[calc(100vh-98px)] w-full max-w-[1880px] gap-4 px-3 pb-6 pt-4 sm:px-4 sm:pb-8 lg:px-6">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
