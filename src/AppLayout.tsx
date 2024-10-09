import { Outlet } from "react-router-dom"
import Footer from "./components/nav/Footer"
import Header from "./components/nav/Header"
import { WebSocketProvider } from "./context/WebSocketContext"

const AppLayout = () => {
  return (
    <WebSocketProvider url={(process.env.BACKEND_HOST as string)}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 container mx-auto flex items-center">
          <Outlet />
        </div>
        <Footer />
      </div>
    </WebSocketProvider>
  )
}

export default AppLayout