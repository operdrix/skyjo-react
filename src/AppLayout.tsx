import { Outlet } from "react-router-dom"
import Footer from "./components/nav/Footer"
import Header from "./components/nav/Header"

const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 container mx-auto flex items-center">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default AppLayout