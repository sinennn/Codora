import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, Trophy, User } from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/tutor", icon: GraduationCap, label: "Learn" },
  { to: "/leaderboard", icon: Trophy, label: "Ranks" },
];

export default function FooterNav() {
  const location = useLocation();

  const isActive = (to: string) =>
    location.pathname === to ||
    (to === "/tutor" && location.pathname.startsWith("/tutor"));

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
      }}
    >
      <div className="flex items-end justify-center gap-3 px-4">
        {/* Main navigation pill */}
        <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5 text-white shadow-2xl shadow-black/20 backdrop-blur-2xl ring-1 ring-white/20">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);

            return (
              <Link
                key={to}
                to={to}
                className={`flex h-14 min-w-[72px] flex-col items-center justify-center gap-0.5 rounded-full px-4 transition-all ${
                  active
                    ? "bg-white/10 text-white shadow-sm shadow-white/5"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active ? "text-orange-500" : "text-gray-400"
                    }`}
                  />

                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <Link
          to="/profile"
          className={`pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-2xl ring-1 ring-white/20 transition-all ${
            isActive("/profile")
              ? "text-orange-500"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <User className="h-5 w-5" />
        </Link>
      </div>
    </motion.footer>
  );
}