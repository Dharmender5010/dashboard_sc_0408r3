
import React from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from './icons';

interface AIAssistantButtonProps {
  onClick: () => void;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
      aria-label="Open AI Assistant"
      title="AI Assistant"
      whileHover={{ scale: 1.1, rotate: 10 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{ animation: 'ai-glow 3s infinite ease-in-out' }}
    >
      <SparklesIcon className="h-8 w-8" />
    </motion.button>
  );
};
