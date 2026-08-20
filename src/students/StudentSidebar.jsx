import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { broadcastSessionLogout } from "../utils/sessionSync";

export default function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST"
      });
    } catch (e) {
      console.error("Logout error", e);
    }
    broadcastSessionLogout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ path, label, icon }) => {
    const active = isActive(path);
    return (
      <button 
        onClick={() => { setDrawerOpen(false); navigate(path); }} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          active 
            ? "bg-white/10 text-white shadow-sm border border-white/20" 
            : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
        }`}
      >
        <span className={`flex items-center justify-center ${active ? "text-white" : "text-white/60"}`}>
          {icon}
        </span>
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 shadow-sm shrink-0 z-40 relative">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#6d0f16] hover:bg-gray-100 transition-colors"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#6d0f16] text-white flex items-center justify-center">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">Outpass Portal</h1>
        </div>
      </header>

      {/* Mobile Overlay */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity" />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-72 bg-[#6d0f16] text-white flex flex-col shadow-2xl lg:shadow-none transform transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {/* Brand */}
        <div className="p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Outpass</h1>
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mt-0.5">NIT Hamirpur</p>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="lg:hidden w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-2">Menu</div>
          <NavItem 
            path="/" 
            label="Dashboard" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
          />
          <NavItem 
            path="/outpasses" 
            label="My Outpasses" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <NavItem 
            path="/add-outpass" 
            label="Add Outpass" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
          />
          {/* <NavItem 
            path="/complaint" 
            label="Complaints" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          /> */}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-white/10 bg-black/10 mt-auto">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white text-white hover:text-[#6d0f16] py-3 rounded-xl font-bold transition-all duration-200 border border-white/20 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
