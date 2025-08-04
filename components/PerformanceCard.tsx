
import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, latest => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 1.2,
            ease: "easeOut"
        });
        return controls.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
}

interface PerformanceCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  onClick?: () => void;
}

const cardVariants = {
    rest: {
        y: 0,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0px rgba(79, 70, 229, 0)",
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 30
        }
    },
    hover: {
        y: -8,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 20px rgba(79, 70, 229, 0.5)",
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 10
        }
    }
};

const iconContainerVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: { scale: 1.15, rotate: -10, transition: { type: "spring" as const, stiffness: 400, damping: 10 } }
};

const shineVariants = {
    rest: {
        x: "-100%",
        skewX: "20deg",
        transition: { duration: 0.5, ease: "circOut" as const }
    },
    hover: {
        x: "100%",
        skewX: "20deg",
        transition: { duration: 0.7, ease: "circIn" as const }
    }
}


export const PerformanceCard: React.FC<PerformanceCardProps> = ({ title, value, icon, onClick }) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, '')) || 0;
  
  return (
    <motion.div 
      className={`group bg-white rounded-xl px-4 py-6 flex items-center space-x-3 border-l-4 border-brand-primary h-full overflow-hidden relative ${onClick ? 'cursor-pointer' : ''}`}
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={cardVariants}
      onClick={onClick}
    >
        {onClick && (
            <div className="absolute top-2 right-2 px-2.5 py-1 bg-brand-primary text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 shadow-md">
                Report
            </div>
        )}

        <motion.div
            className="absolute top-0 left-0 w-full h-full bg-white opacity-20 pointer-events-none"
            variants={shineVariants}
        />

      <motion.div 
        className="flex-shrink-0 bg-brand-light text-brand-primary rounded-full p-3 z-10"
        variants={iconContainerVariants}
      >
        {icon}
      </motion.div>
      <div className="min-w-0 flex-1 z-10 flex flex-col">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
           <AnimatedNumber value={numericValue} />
        </p>
      </div>
    </motion.div>
  );
};
