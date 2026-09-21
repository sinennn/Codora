import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, LogIn, Loader2 } from 'lucide-react';
import { auth } from '../../../firebase';
import roomService from '../../Services/Rooms';
import { generateQuizQuestions } from '../../Services/aiService';
import { toast } from 'sonner';
import FieldsData from '../../Data/Fields.json';
import TechnologiesData from '../../Data/Technologies.json';

type Tab = 'create' | 'join';

export default function GroupQuizSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('create');
  const [loading, setLoading] = useState(false);

  // Create room state
  const [roomName, setRoomName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicType, setTopicType] = useState<'field' | 'technology'>('technology');
  const [questionCount, setQuestionCount] = useState(10);
  const [quizTime, setQuizTime] = useState(120);

  // Join room state
  const [roomCode, setRoomCode] = useState('');

  const topics = topicType === 'field' 
    ? FieldsData.fields 
    : TechnologiesData.technologies;

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!selectedTopic) {
      toast.error('Please select a topic');
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
      // Generate questions
      const result = await generateQuizQuestions({
        topic: selectedTopic,
        optionType: topicType,
        difficulty: 'intermediate',
        numberOfQuestions: questionCount,
      });
      
      const code = generateRoomCode();
      await roomService.createRoom({
        roomCode: code,
        roomName: roomName || `${selectedTopic} Quiz`,
        questions: result.questions,
        quizTime,
      });

      navigate('/quiz/group/waiting', {
        state: {
          roomCode: code,
          roomData: { questions: result.questions, quizTime },
          isHost: true,
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

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
        },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 pb-24">
      <motion.button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-400 mb-6"
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
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Group Quiz</h1>
          <p className="text-gray-400 text-sm">Challenge your friends</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800/50 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'create' ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create Room
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'join' ? 'bg-purple-600 text-white' : 'text-gray-400'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <div className="space-y-4">
            {/* Room Name */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Room Name (optional)</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="My Quiz Room"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Topic Type */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Topic Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTopicType('technology')}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    topicType === 'technology'
                      ? 'bg-orange-500/20 border border-orange-500 text-orange-400'
                      : 'bg-gray-800 border border-gray-700 text-gray-400'
                  }`}
                >
                  Technology
                </button>
                <button
                  onClick={() => setTopicType('field')}
                  className={`flex-1 py-2 rounded-lg text-sm ${
                    topicType === 'field'
                      ? 'bg-orange-500/20 border border-orange-500 text-orange-400'
                      : 'bg-gray-800 border border-gray-700 text-gray-400'
                  }`}
                >
                  Field
                </button>
              </div>
            </div>

            {/* Topic Selection */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Select Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Choose a topic...</option>
                {topics.map((t: any) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Questions: {questionCount}</label>
              <input
                type="range"
                min={5}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Time Limit */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Time: {quizTime}s</label>
              <input
                type="range"
                min={60}
                max={300}
                step={30}
                value={quizTime}
                onChange={(e) => setQuizTime(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <motion.button
              onClick={handleCreate}
              disabled={loading || !selectedTopic}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Room
                </>
              )}
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-center text-2xl tracking-widest uppercase placeholder:text-gray-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-purple-500"
              />
            </div>

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
                <>
                  <LogIn className="w-5 h-5" />
                  Join Room
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
