import { Outlet } from "react-router-dom";
import AuthHeader from "../components/auth/AuthHeader";

export default function Layout() {
  return (
    <>
      <AuthHeader />
      <div className="min-h-screen flex flex-col justify-center">
        <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-xl">
          <Outlet />
        </div>
      </div>
    </>
  );
}