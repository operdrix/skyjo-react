import AuthHeader from "@/components/nav/AuthHeader";
import Footer from "@/components/nav/Footer";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <div className="flex flex-col min-h-screen font-kalam">
        <AuthHeader />
        <Outlet />
        <Footer />
      </div>
    </>
  );
}