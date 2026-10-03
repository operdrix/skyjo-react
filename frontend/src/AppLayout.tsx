import Footer from "@/components/nav/Footer";
import Header from "@/components/nav/Header";
import Drawer from "./components/nav/Drawer";
import RequirePseudo from "@/components/auth/RequirePseudo";

const AppLayout = () => {
  return (
    <Drawer>
      <div className="flex flex-col min-h-screen font-kalam">
        <Header />
        <RequirePseudo />
        <Footer />
      </div>
    </Drawer>
  );
};

export default AppLayout;
