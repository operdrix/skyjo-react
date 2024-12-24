import Footer from "@/components/nav/Footer";
import Header from "@/components/nav/Header";
import { Outlet } from "react-router-dom";
import Drawer from "./components/Drawer";

const AppLayout = () => {


  return (
    <Drawer>

      <div className="flex flex-col min-h-screen font-kalam">
        <Header />
        <div className="flex-1 container mx-auto flex items-center">
          <Outlet />
        </div>
        <Footer />
      </div>

    </Drawer>
  )
}

export default AppLayout