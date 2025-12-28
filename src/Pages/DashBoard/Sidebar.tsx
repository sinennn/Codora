import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../../../firebase';
import { LogOut, UserRound, Settings, Trophy, Home } from 'lucide-react';
import logo from '/assets/Start.png';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  function leave() {
    auth.signOut();
    navigate('/login');
  }

  return (
    <motion.aside
      className="w-56 lg:w-64 h-screen bg-gradient-to-r from-gray-1000 to-gray-900 p-4 lg:p-6 shadow-lg hidden md:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 lg:gap-4 mb-8 lg:mb-10 pt-4 lg:pt-6">
        <motion.img
          src={logo}
          alt="Codora Logo"
          className="h-20 lg:h-24 w-auto"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
        <h2 className="text-2xl lg:text-3xl font-bold text-orange-400 tracking-tight">Codora</h2>
      </div>

      <nav className="flex flex-col gap-4 lg:gap-6 text-white">
        <SidebarLink to="/dashboard" icon={<Home size={18} />} label="Home" currentPath={location.pathname} />
        <SidebarLink to="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" currentPath={location.pathname} />
        <SidebarLink to="/settings" icon={<Settings size={18} />} label="Settings" currentPath={location.pathname} />
        <SidebarLink to="/profile" icon={<UserRound size={18} />} label="Profile" currentPath={location.pathname} />

        <button
          onClick={leave}
          className="flex items-center gap-3 text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all mt-4 lg:mt-6 min-h-[44px]"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm lg:text-base">Log out</span>
        </button>
      </nav>
    </motion.aside>
  );
}

function SidebarLink({ to, icon, label, currentPath }: { to: string; icon: React.ReactNode; label: string; currentPath: string }) {
  const isActive = currentPath === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all min-h-[44px]
        ${isActive ? 'bg-orange-500/20 text-orange-400 font-semibold' : 'hover:bg-gray-700/50'}
      `}
    >
      <div className="text-orange-400">{icon}</div>
      <span className="text-sm lg:text-base">{label}</span>
    </Link>
  );
}
