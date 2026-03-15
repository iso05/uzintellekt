import { Outlet } from "react-router-dom";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar always visible */}
      <TopNavbar />

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer always visible */}
      <Footer />
    </div>
  );
};

export default MainLayout;
