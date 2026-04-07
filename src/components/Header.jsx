import { useAuth } from "../utils/idb.jsx";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import CreateTicket from "./CreateTicket";
import { LogOut, CircleUserRound, Bell, Ticket, Users2, ChevronDown, User, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Header({fetchTickets}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = user?.name || user?.admin_name || user?.st_name || "User";
  const userEmail = user?.email || user?.email_id || user?.st_email || "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="mx-auto flex items-center justify-between px-6 h-16" style={{ maxWidth: "calc(100% - 150px)" }}>

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-800 hover:text-blue-600 transition-colors"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Ticket size={18} className="text-white -rotate-12" />
          </div>
          <span className="font-semibold text-[20px] tracking-tight">Ticket</span>
        </button>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-2">

            {/* Create Ticket */}
            <CreateTicket user={user} onTicketCreated={fetchTickets} />

            {/* Admin: Users button */}
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/users")}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Users2 size={15} />
                Users
              </button>
            )}

            {/* Profile dropdown */}
            <div className="relative"
              ref={dropdownRef}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                  {initials}
                </div>
                <span className="text-[14px] font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
                  {userName}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/60 overflow-hidden z-50"
                  >
                    {/* Profile info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-gray-800 truncate">{userName}</p>
                          <p className="text-[12px] text-gray-500 truncate">{userEmail}</p>
                        </div>
                      </div>
                      {user?.role === "admin" && (
                        <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-medium">
                          Admin
                        </span>
                      )}
                    </div>

                  
                    {/* Logout */}
                    <div className="py-1.5"> 
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        ) : (
          navigate("/login")
        )}
      </div>
    </header>
  );
}