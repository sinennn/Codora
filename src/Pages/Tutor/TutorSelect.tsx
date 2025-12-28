// ============================================
// TUTOR SELECT PAGE
// Users select a field or technology to learn
// ============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, BookOpen, Code, Sparkles, GraduationCap } from 'lucide-react';
import FooterNav from '../DashBoard/Footer';
import fieldsData from '../../Data/Fields.json';
import technologiesData from '../../Data/Technologies.json';

type TabType = 'fields' | 'technologies';
type DifficultyType = 'beginner' | 'intermediate' | 'advanced';

const difficultyConfig = {
  beginner: { label: 'Beginner', color: 'from-green-500 to-emerald-500', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'from-orange-500 to-amber-500', icon: '🔥' },
  advanced: { label: 'Advanced', color: 'from-purple-500 to-pink-500', icon: '⚡' },
};

export default function TutorSelect() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('fields');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType>('beginner');

  const fields = fieldsData.fields;
  const technologies = technologiesData;

  const filteredItems = useMemo(() => {
    const items = activeTab === 'fields' ? fields : technologies;
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, fields, technologies]);

  const handleStartLesson = () => {
    if (!selectedItem) return;
    navigate('/tutor/lesson', {
      state: {
        topic: selectedItem,
        category: activeTab === 'fields' ? 'field' : 'technology',
        difficulty: selectedDifficulty,
      },
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-black via-gray-900 to-black safe-top">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-28 sm:pb-32 max-w-lg mx-auto w-full">
        {/* Header */}
        <motion.header
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-gray-800/50 text-gray-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-orange-400" />
              AI Tutor
            </h1>
            <p className="text-sm text-gray-400">Choose what you want to learn</p>
          </div>
        </motion.header>

        {/* Tutor Avatars */}
        <motion.div
          className="flex justify-center gap-4 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
              🦊
            </div>
            <p className="text-xs text-gray-400 mt-1">Nime</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
              🦅
            </div>
            <p className="text-xs text-gray-400 mt-1">Nesto</p>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex bg-gray-800/50 rounded-xl p-1 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => { setActiveTab('fields'); setSelectedItem(null); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'fields' ? 'bg-orange-500 text-white' : 'text-gray-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Fields
          </button>
          <button
            onClick={() => { setActiveTab('technologies'); setSelectedItem(null); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'technologies' ? 'bg-orange-500 text-white' : 'text-gray-400'
            }`}
          >
            <Code className="w-4 h-4" />
            Technologies
          </button>
        </motion.div>

        {/* Search */}
        <motion.div
          className="relative mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
        </motion.div>

        {/* Difficulty Selection */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <p className="text-sm text-gray-400 mb-2">Difficulty Level</p>
          <div className="flex gap-2">
            {(Object.keys(difficultyConfig) as DifficultyType[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  selectedDifficulty === diff
                    ? `bg-gradient-to-r ${difficultyConfig[diff].color} text-white`
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
                }`}
              >
                {difficultyConfig[diff].icon} {difficultyConfig[diff].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Items Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6 max-h-[40vh] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setSelectedItem(item.name)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedItem === item.name
                    ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-2 border-orange-500'
                    : 'bg-gray-800/30 border border-gray-700/50 hover:border-gray-600'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <p className={`text-sm font-medium truncate ${
                  selectedItem === item.name ? 'text-orange-400' : 'text-white'
                }`}>
                  {item.name}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Start Button */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto"
            >
              <button
                onClick={handleStartLesson}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Learning {selectedItem}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FooterNav />
    </div>
  );
}
