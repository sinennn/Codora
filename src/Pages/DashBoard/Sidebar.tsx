import { Link } from 'react-router-dom';
import { auth } from '../../../firebase'; 
import { useNavigate } from 'react-router-dom'
export default function Sidebar() {
    const Navigate = useNavigate()
    function leave() {
        Navigate('/login');
    }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 p-6 space-y-6 hidden md:block">
      <h2 className="text-xl font-bold text-orange-500">Codora</h2>
      <nav className="flex flex-col space-y-4 text-white">
      <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/profile">Profile</Link>        
        <Link to="/settings">Settings</Link>
        <button
          className="text-left text-red-400 hover:text-red-500"
          onClick={() => {
            auth.signOut();
            leave();
          }}
        >
          Log out
        </button>
      </nav>
    </aside>
  );
}
