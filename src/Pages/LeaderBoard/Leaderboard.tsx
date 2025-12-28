// ============================================
// LEADERBOARD PAGE
// Uses original userScores collection for existing data
// ============================================

import { motion } from 'framer-motion';
import { Trophy, Award, ChevronUp, ChevronDown, User, Crown, Star, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Footer from '../DashBoard/Footer';
import { getTopScores, getUserScore, LeaderboardEntry } from '../../Services/scoreService';
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
            setUserRank(null);
            const scoreData = await getUserScore(currentUser.uid);
            if (scoreData) {
              setUserScore(scoreData.totalScore);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen min-h-[100dvh] flex flex-col justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading leaderboard...</p>
      </div>
    );
  }

  const podiumUsers = leaderboardData.slice(0, 3);
  const otherUsers = leaderboardData.slice(3);
  const currentUserId = auth.currentUser?.uid;

  return (
    <div className="w-full min-h-screen min-h-[100dvh] flex flex-col items-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-x-hidden px-4 sm:px-6 pb-28 sm:pb-32 safe-top">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-orange-700/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl py-6 sm:py-8 text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-orange-500/20">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400 max-w-md text-sm sm:text-base px-4">
            Top performers of the week. Climb the ranks by taking more quizzes! 🏆
          </p>
        </motion.div>
      </header>

      {/* Podium */}
      {podiumUsers.length >= 3 && (
        <div className="w-full max-w-4xl relative z-10 mb-8 sm:mb-12">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-end h-48 sm:h-60 md:h-72 px-2 sm:px-4">
            {/* Reorder for podium display: 2nd, 1st, 3rd */}
            {[podiumUsers[1], podiumUsers[0], podiumUsers[2]].map((user, displayIndex) => {
              if (!user) return null;
              const actualRank = user.rank;
              const heightClass =
                actualRank === 1 ? 'h-[85%]' :
                actualRank === 2 ? 'h-[75%]' :
                'h-[65%]';

              return (
                <motion.div
                  key={user.id}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: displayIndex * 0.1 }}
                  className={`flex flex-col items-center ${heightClass}`}
                >
                  <div className={`w-full h-full rounded-t-xl sm:rounded-t-2xl flex flex-col items-center justify-end pb-3 sm:pb-6 ${
                    actualRank === 1 ? 'bg-gradient-to-t from-amber-600/20 to-amber-600/5' :
                    actualRank === 2 ? 'bg-gradient-to-t from-gray-700/20 to-gray-700/5' :
                    'bg-gradient-to-t from-amber-800/20 to-amber-800/5'
                  } border border-white/5 backdrop-blur-sm`}>
                    
                    {/* Avatar */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 ${
                      actualRank === 1 ? 'bg-amber-500/20 text-amber-400' :
                      actualRank === 2 ? 'bg-gray-600/20 text-gray-300' :
                      'bg-amber-700/20 text-amber-600'
                    }`}>
                      <span className="font-bold text-lg">{user.name[0]?.toUpperCase() || '?'}</span>
                    </div>
                    
                    {/* Medal Icon */}
                    <div className={`w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 rounded-full flex items-center justify-center mb-1 sm:mb-2 ${
                      actualRank === 1 ? 'bg-amber-500/20 text-[#D4AF37]' :
                      actualRank === 2 ? 'bg-gray-600/20 text-gray-300' :
                      'bg-amber-700/20 text-[#CD7F32]'
                    }`}>
                      {actualRank === 1 ? (
                        <Crown className="w-4 h-4 sm:w-5 md:w-6 sm:h-5 md:h-6" fill="currentColor" />
                      ) : actualRank === 2 ? (
                        <Star className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                      ) : (
                        <Award className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                      )}
                    </div>
                    
                    <div className="text-center px-1 sm:px-2">
                      <p className="font-medium text-white text-xs sm:text-sm md:text-base truncate max-w-[60px] sm:max-w-[80px] md:max-w-full">
                        {user.name.split(' ')[0]}
                      </p>
                      <p className="text-xs sm:text-sm text-orange-400 font-semibold">{user.score} pts</p>
                    </div>
                  </div>
                  <div className={`w-full py-1.5 sm:py-2 text-center font-bold text-xs sm:text-sm ${
                    actualRank === 1 ? 'bg-amber-600/30 text-[#D4AF37]' :
                    actualRank === 2 ? 'bg-gray-700/30 text-gray-300' :
                    'bg-amber-800/30 text-[#CD7F32]'
                  } rounded-b-lg`}>
                    #{actualRank}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* User rank card */}
      <div className="w-full max-w-2xl relative z-10">
        {auth.currentUser && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-500/5 to-transparent border-l-4 border-orange-500/50 rounded-r-lg p-3 sm:p-4 mb-6 sm:mb-8 backdrop-blur-sm"
          >
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {auth.currentUser.photoURL ? (
                  <img 
                    src={auth.currentUser.photoURL}
                    alt="You"
                    className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-orange-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm sm:text-base">Your Rank</p>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {userRank ? `#${userRank} • ${userScore} points` : `${userScore} points`}
                    {!userRank && userScore > 0 && ' (Not in top 10)'}
                  </p>
                </div>
              </div>
              <button
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-orange-400 hover:text-white transition-colors min-h-[44px] flex-shrink-0"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                View Top
              </button>
            </div>
          </motion.div>
        )}

        {/* Leaderboard entries (4-10) */}
        <div className="space-y-2">
          {otherUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + (index * 0.05) }}
              className={`group flex items-center justify-between p-3 sm:p-4 rounded-xl transition-colors border ${
                user.id === currentUserId 
                  ? 'bg-orange-500/10 border-orange-500/30' 
                  : 'hover:bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-400 flex-shrink-0">
                  {user.rank}
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs sm:text-sm font-medium text-white flex-shrink-0">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-white text-sm sm:text-base truncate block">
                    {user.name}
                    {user.id === currentUserId && <span className="text-orange-400 ml-1">(You)</span>}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-orange-400 font-semibold text-sm sm:text-base">{user.score}</span>
                {user.change && (
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                    user.change === 'up' ? 'bg-green-500/20 text-green-400' : 
                    user.change === 'down' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.change === 'up' ? (
                      <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : user.change === 'down' ? (
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : null}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {leaderboardData.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No rankings yet</p>
            <p className="text-gray-500 text-sm">Be the first to earn points!</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
