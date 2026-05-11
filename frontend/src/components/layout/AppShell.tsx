import { Outlet } from "react-router-dom";
import TopBanner from "./TopBanner";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="flex h-full flex-col">
      <TopBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-cream p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
