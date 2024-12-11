import { Outlet } from "react-router-dom";
import Header from "../../components/nav/Header";

export default function Layout() {
  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col justify-center">
        <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-xl">
          <Outlet />
        </div>
      </div>
    </>
  );
}