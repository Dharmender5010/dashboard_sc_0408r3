
import React, { useMemo } from 'react';

interface AnimatedBackgroundProps {
    shapeColor?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = React.memo(({ shapeColor }) => {
    const shapes = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => {
            const size = Math.random() * 60 + 20;
            const left = Math.random() * 100;
            const animationDelay = Math.random() * 15;
            const animationDuration = Math.random() * 10 + 15;

            const style: React.CSSProperties = {
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${animationDelay}s`,
                animationDuration: `${animationDuration}s`,
            };
            
            if (shapeColor) {
                style.background = shapeColor;
            }

            return {
                id: i,
                style: style
            };
        });
    }, [shapeColor]);

    return (
        <div className="animated-shapes-container" aria-hidden="true">
            <ul className="h-full w-full relative">
                {shapes.map(shape => <li key={shape.id} style={shape.style}></li>)}
            </ul>
        </div>
    );
});
