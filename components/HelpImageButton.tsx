
import React from 'react';
import { motion } from 'framer-motion';

interface HelpImageButtonProps {
  onClick: () => void;
}

export const HelpImageButton: React.FC<HelpImageButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      id="help-image-button"
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-y-1 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary rounded-full p-1"
      aria-label="Need Assistance?"
      title="Need Assistance?"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className="w-14 h-14 rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-300 bg-white/30 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center">
        <img
          src="https://i.ibb.co/nsgFTnGT/customer-service-1.png"
          alt="Support agent illustration"
          className="w-full h-full object-contain p-1"
        />
      </div>
      <span className="text-[10px] font-semibold text-gray-800 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm pointer-events-none">
        Need Assistance?
      </span>
    </motion.button>
  );
};