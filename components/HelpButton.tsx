

import React from 'react';

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  return (
    <button
      id="help-button"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 bg-white text-brand-primary rounded-lg px-4 py-2 shadow-lg hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark transition-all text-sm font-semibold"
      aria-label="Need Help?"
      title="Need Help?"
    >
      Need Help?
    </button>
  );
};