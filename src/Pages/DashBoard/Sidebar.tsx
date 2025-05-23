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
    className="w-64 h-screen bg-gradient-to-r from-gray-1000 to-gray-900 p-6 shadow-lg hidden md:block"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
<div className="flex items-center gap-4 mb-10 pt-6">
  <motion.img
    src={logo}
    alt="Codora Logo"
    className="h-30 w-auto"
    whileHover={{ scale: 1.05 }}
    transition={{ type: 'spring', stiffness: 300 }}
  />
  <h2 className="text-3xl font-bold text-orange-400 tracking-tight">Codora</h2>
</div>
  
    <nav className="flex flex-col gap-6 text-white">
      <SidebarLink to="/dashboard" icon={<Home size={20} />} label="Home" currentPath={location.pathname} />
      <SidebarLink to="/leaderboard" icon={<Trophy size={20} />} label="Leaderboard" currentPath={location.pathname} />
      <SidebarLink to="/settings" icon={<Settings size={20} />} label="Settings" currentPath={location.pathname} />
      <SidebarLink to="/profile" icon={<UserRound size={20} />} label="Profile" currentPath={location.pathname} />
        
      <button
        onClick={leave}
        className="flex items-center gap-3 text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all mt-6"
      >
        <LogOut size={20} />
        <span className="font-medium">Log out</span>
      </button>
    </nav>
  </motion.aside>
  );
}

function SidebarLink({ to, icon, label, currentPath }) {
  const isActive = currentPath === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all 
        ${isActive ? 'bg-orange-500/20 text-orange-400 font-semibold' : 'hover:bg-gray-700/50'}
      `}
    >
      <div className="text-orange-400">{icon}</div>
      <span>{label}</span>
    </Link>
  );
}
