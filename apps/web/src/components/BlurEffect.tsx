import React from 'react';

interface BlurEffectProps {
  isBlurred: boolean;
  children: React.ReactNode;
  blurStrength?: number;
}

export default function BlurEffect({ isBlurred, children, blurStrength = 10 }: BlurEffectProps) {
  return (
    <div className={`relative ${isBlurred ? 'blur-container' : ''}`}>
      <div 
        className={`transition-all duration-300 ${isBlurred ? `filter blur(${blurStrength}px)` : ''}`}
      >
        {children}
      </div>
      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-md text-sm text-gray-600">
            观察员模式隐藏
          </div>
        </div>
      )}
    </div>
  );
}
