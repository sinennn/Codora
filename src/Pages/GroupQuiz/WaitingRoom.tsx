import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Copy, Play, Loader2 } from 'lucide-react';
import roomService from '../../Services/Rooms';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export default function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, roomData, isHost } = location.state || {};

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!roomCode) {
      navigate('/quiz/group');
      return;
    }

    const unsubscribeParticipants = roomService.listenForParticipants(roomCode, setParticipants);
    const unsubscribeStatus = roomService.listenForQuizStatus(roomCode, (status) => {
      if (status === 'active') {
        navigate('/quiz/group/play', { 
          state: { roomCode, roomData, isHost } 
        });
      }
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeStatus();
    };
  }, [roomCode, navigate, roomData, isHost]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const startQuiz = async () => {
    if (participants.length < 2) {
      toast.error('Need at least 2 players to start');
      return;
    }

    setStarting(true);
    try {
      await roomService.startQuiz(roomCode);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start quiz');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <motion.button
        onClick={() => navigate('/quiz/group')}
        className="flex items-center gap-2 text-gray-400 mb-6"
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Leave Room
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Room Code Display */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-white tracking-widest">{roomCode}</span>
            <motion.button
              onClick={copyRoomCode}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              whileTap={{ scale: 0.95 }}
            >
              <Copy className="w-5 h-5 text-gray-300" />
            </motion.button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Players ({participants.length})</span>
          </div>

          <div className="space-y-2">
            {participants.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold">
                  {p.name[0].toUpperCase()}
                </div>
                <span className="text-white flex-1">{p.name}</span>
                {p.isHost && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {participants.length < 2 && (
            <p className="text-gray-500 text-sm text-center mt-4">
              Waiting for more players...
            </p>
          )}
        </div>

        {/* Start Button (Host Only) */}
        {isHost && (
          <motion.button
            onClick={startQuiz}
            disabled={starting || participants.length < 2}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            {starting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Quiz
              </>
            )}
          </motion.button>
        )}

        {!isHost && (
          <div className="text-center text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Waiting for host to start...
          </div>
        )}
      </motion.div>
    </div>
  );
}
