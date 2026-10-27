import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-wrapper">
        <Navbar onToggleMobile={() => setMobileOpen((prev) => !prev)} />
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
