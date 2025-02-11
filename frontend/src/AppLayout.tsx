import Footer from "@/components/nav/Footer";
import Header from "@/components/nav/Header";
import { Outlet } from "react-router-dom";
import Drawer from "./components/nav/Drawer";

const AppLayout = () => {


  return (
    <Drawer>
      <div className="flex flex-col min-h-screen font-kalam">
        <Header />
        <Outlet />
        <Footer />
      </div>
    </Drawer>
  )
}

export default AppLayout