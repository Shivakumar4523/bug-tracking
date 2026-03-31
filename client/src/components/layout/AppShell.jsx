import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

const AppShell = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="mx-auto min-w-0 max-w-[1760px] px-3 pb-10 pt-6 sm:px-4 sm:pb-12 sm:pt-8 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
