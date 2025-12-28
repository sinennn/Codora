// ============================================
// PROFILE PAGE - User Stats & Achievements
// Now integrated with Firebase for real user data
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, ChevronLeft, LogOut, Bug, Trash2, Loader2 } from 'lucide-react';
import { auth, onAuthStateChanged, signOut } from '../../../firebase';
import { deleteUser } from 'firebase/auth';
import { toast } from '../../components/ui/toast';
import { ClipLoader } from 'react-spinners';

import { XPRing } from '../../components/Home/XPRing';
import { StreakBadge } from '../../components/Home/StreakBadge';
import { StreakCalendar, SkillCard, AchievementBadge, StatsOverview } from '../../components/Profile';
import FooterNav from '../DashBoard/Footer';
import { calculateLevel } from '../../Types/user';
import { useUserProgress } from '../../Context/UserProgressContext';

export default function ProfileNew() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'achievements'>('stats');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Get real user progress from context
  const { userProgress, loading, isPracticedToday } = useUserProgress();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsDeletingAccount(true);
      try {
        if (user) {
          await deleteUser(user);
          toast.success('Account deleted successfully!');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Failed to delete account. You may need to re-authenticate.');
      } finally {
        setIsDeletingAccount(false);
      }
    }
  };

  // Generate active days from user's activity (last 30 days approximation)
  const getActiveDays = () => {
    if (!userProgress) return [];
    
    const days: string[] = [];
    const today = new Date();
    
    // Add today if practiced
    if (isPracticedToday) {
      days.push(today.toISOString().split('T')[0]);
    }
    
    // Add previous days based on streak
    for (let i = 1; i < userProgress.currentStreak; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const levelInfo = calculateLevel(userProgress?.xp || 0);
  const firstName = user?.displayName?.split(' ')[0] || 'Developer';

  const tabs = [
    { id: 'stats', label: 'Stats' },
    { id: 'skills', label: 'Skills' },
    { id: 'achievements', label: 'Badges' },
  ] as const;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black safe-top">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-28 sm:pb-32 max-w-lg mx-auto w-full">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-800/50 text-gray-400 touch-target flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-white">Profile</h1>
          <button className="p-2 rounded-full bg-gray-800/50 text-gray-400 touch-target flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
        </motion.header>

        {/* Profile Card */}
        <motion.div
          className="bg-gray-800/30 rounded-2xl p-4 sm:p-6 border border-gray-700/50 mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            {/* Avatar */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-orange-500 object-cover flex-shrink-0"
                onError={(e) => { e.currentTarget.src = '/assets/navuser.png'; }}
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0">
                {firstName[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{user?.displayName || 'Developer'}</h2>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-orange-400 font-medium">{levelInfo.title}</span>
                <StreakBadge 
                  streak={userProgress?.currentStreak || 0} 
                  isActive={isPracticedToday}
                  size="sm" 
                />
              </div>
            </div>
          </div>

          {/* XP Ring */}
          <div className="flex justify-center">
            <XPRing
              progress={levelInfo.progress}
              level={levelInfo.level}
              title={levelInfo.title}
              xpToNext={levelInfo.xpToNext}
              size="lg"
            />
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex bg-gray-800/50 rounded-xl p-1 mb-4 sm:mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2.5 sm:py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all touch-target
                ${activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <StatsOverview
                totalXP={userProgress?.xp || 0}
                totalQuestions={userProgress?.totalQuestions || 0}
                accuracy={userProgress?.accuracy || 0}
                totalTime={userProgress?.totalTimeSpent || 0}
              />
              <StreakCalendar
                activeDays={getActiveDays()}
                currentStreak={userProgress?.currentStreak || 0}
                longestStreak={userProgress?.longestStreak || 0}
              />
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-3">
              {userProgress?.skills && userProgress.skills.length > 0 ? (
                userProgress.skills.map((skill) => (
                  <SkillCard
                    key={skill.skillId}
                    skill={skill}
                    onTap={() => navigate('/tutor', { state: { preselectedTopic: skill.name } })}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No skills tracked yet</p>
                  <button
                    onClick={() => navigate('/tutor')}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium"
                  >
                    Start Learning
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-3 xs:grid-cols-4 gap-3 sm:gap-4">
              {userProgress?.achievements && userProgress.achievements.length > 0 ? (
                userProgress.achievements.map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    size="md"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">Complete quizzes to unlock achievements!</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="mt-6 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Sign Out */}
          <motion.button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full py-3.5 min-h-[48px] bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/90 hover:to-gray-600/90 text-white font-medium rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-sm sm:text-base border border-gray-600/30 shadow-lg shadow-black/20 backdrop-blur-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSigningOut ? (
              <ClipLoader color="#ffffff" size={20} cssOverride={{ borderWidth: '3px' }} />
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-600/50 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-gray-300" />
                </div>
                <span>Sign Out</span>
              </>
            )}
          </motion.button>

          {/* Report Bug */}
          <Link to="/ReportBug" className="block">
            <motion.div
              className="w-full py-3.5 min-h-[48px] bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 text-orange-400 font-medium rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-sm sm:text-base border border-orange-500/20 shadow-lg shadow-orange-500/5 backdrop-blur-sm cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Bug className="w-4 h-4 text-orange-400" />
              </div>
              <span>Report a Bug</span>
            </motion.div>
          </Link>

          {/* Twitter */}
          <a href="https://x.com/_codora_xyz" target="_blank" rel="noopener noreferrer" className="block">
            <motion.div
              className="w-full py-3.5 min-h-[48px] bg-gradient-to-r from-blue-500/10 to-sky-500/10 hover:from-blue-500/20 hover:to-sky-500/20 text-blue-400 font-medium rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-sm sm:text-base border border-blue-500/20 shadow-lg shadow-blue-500/5 backdrop-blur-sm cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span>Follow us on X</span>
            </motion.div>
          </a>

          {/* Delete Account */}
          <motion.button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="w-full py-3.5 min-h-[48px] bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 text-red-400 font-medium rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-sm sm:text-base border border-red-500/20 shadow-lg shadow-red-500/5 backdrop-blur-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {isDeletingAccount ? (
              <ClipLoader color="#f87171" size={20} cssOverride={{ borderWidth: '3px' }} />
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <span>Delete Account</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      <FooterNav />
    </div>
  );
}
