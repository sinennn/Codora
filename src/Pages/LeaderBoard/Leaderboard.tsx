import { motion } from 'framer-motion';
import { Trophy, Award, ChevronUp, ChevronDown, User, Crown, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Footer from '../DashBoard/Footer';
import { getTopScores, LeaderboardEntry, getUserScore } from '../../Services/scoreService';
import { auth } from '../../../firebase';

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number>(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await getTopScores(10);
        setLeaderboardData(data);

        const currentUser = auth.currentUser;
        if (currentUser) {
          const userEntry = data.find(entry => entry.id === currentUser.uid);
          if (userEntry) {
            setUserRank(userEntry.rank);
            setUserScore(userEntry.score);
          } else {
            // If user is not in top 10, we'll just show their score without rank
            setUserRank(null);
            const userScore = await getUserScore(currentUser.uid);
            if (userScore) {
              setUserScore(userScore.totalScore);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
   //Fuck, I'll add an error flag later
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black">
        <ClipLoader color="#f97316" size={50} cssOverride={{ borderWidth: '4px' }} />
      </div>
    );
  }

  const podiumUsers = leaderboardData.slice(0, 3);
  const otherUsers = leaderboardData.slice(3);

  return (
    <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden px-4 sm:px-8 pb-24">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="w-full max-w-4xl py-8 text-center relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400 max-w-md">
            Top performers of the week. Climb the ranks by tanking more quizzes🤝!
          </p>
        </motion.div>
      </header>

      <div className="w-full max-w-4xl relative z-10 mb-12">
        <div className="grid grid-cols-3 gap-6 items-end h-72 px-4">
          {podiumUsers.map((user, index) => {
            const heightClass = 
              index === 0 ? 'h-[85%]' : 
              index === 1 ? 'h-[75%]' : 
              'h-[65%]';
              
            return (
              <motion.div
                key={user.id}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col items-center ${heightClass}`}
              >
                <div className={`w-full h-full rounded-t-2xl flex flex-col items-center justify-end pb-6 ${
                  index === 0 ? 'bg-gradient-to-t from-amber-600/20 to-amber-600/5' : 
                  index === 1 ? 'bg-gradient-to-t from-gray-700/20 to-gray-700/5' : 
                  'bg-gradient-to-t from-amber-800/20 to-amber-800/5'
                } border border-white/5 backdrop-blur-sm`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    index === 0 ? 'bg-amber-500/20 text-[#D4AF37]' : 
                    index === 1 ? 'bg-gray-600/20 text-gray-300' : 
                    'bg-amber-700/20 text-[#CD7F32]'
                  }`}>
                    {index === 0 ? (
                      <Crown className="w-6 h-6" fill="currentColor" />
                    ) : index === 1 ? (
                      <Star className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Award className="w-5 h-5" fill="currentColor" />
                    )}
                  </div>
                  <div className="text-center px-2">
                    <p className="font-medium text-white">{user.name.split(' ')[0]}</p>
                    <p className="text-sm text-gray-400">{user.score} pts</p>
                  </div>
                </div>
                <div className={`w-full py-2 text-center font-bold text-sm ${
                  index === 0 ? 'bg-amber-600/30 text-[#D4AF37]' : 
                  index === 1 ? 'bg-gray-700/30 text-gray-300' : 
                  'bg-amber-800/30 text-[#CD7F32]'
                } rounded-b-lg`}>
                  #{user.rank}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="w-full max-w-2xl relative z-10">
        {auth.currentUser && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-500/5 to-transparent border-l-4 border-orange-500/50 rounded-r-lg p-4 mb-8 backdrop-blur-sm"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Your Rank</p>
                  <p className="text-sm text-gray-400">
                    {userRank ? `#${userRank} • ${userScore} points` : `Score: ${userScore} points`}
                    {!userRank && ' (Not in top 10)'}
                  </p>
                </div>
              </div>
              <button 
                className="px-4 py-2 text-sm font-medium text-orange-400 hover:text-white transition-colors"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                View Top
              </button>
            </div>
          </motion.div>
        )}

        {/* Leaderboard entries */}
        <div className="space-y-2">
          {otherUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (index * 0.05) }}
              className="group flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-400">
                  {user.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-medium text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="font-medium text-white">{user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-orange-400 font-semibold">{user.score}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  user.change === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {user.change === 'up' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}