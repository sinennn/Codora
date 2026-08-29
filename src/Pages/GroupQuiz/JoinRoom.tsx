import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { auth } from '../../../firebase';
import roomService from '../../Services/Rooms';
import { toast } from 'sonner';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error('Please log in first');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const roomData = await roomService.joinRoom(roomCode.toUpperCase(), user.displayName || 'Player');
      navigate('/quiz/group/waiting', { 
        state: { 
          roomCode: roomCode.toUpperCase(),
          roomData,
          isHost: false,
        } 
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <motion.button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 mb-8"
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join Quiz Room</h1>
          <p className="text-gray-400">Enter the room code to join your friends</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            maxLength={6}
            className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-center text-2xl tracking-widest uppercase placeholder:text-gray-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-purple-500"
          />

          <motion.button
            onClick={handleJoin}
            disabled={loading || !roomCode.trim()}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
