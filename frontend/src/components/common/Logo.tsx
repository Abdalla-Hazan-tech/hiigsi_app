import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 60 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src="/logo.svg"
        alt="Hiigsi logo"
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
};

export default Logo;

