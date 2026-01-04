interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'icon' | 'image';
}

const sizeMap = {
  sm: { icon: 16, text: 'text-sm', container: 'w-8 h-8' },
  md: { icon: 20, text: 'text-base', container: 'w-10 h-10' },
  lg: { icon: 24, text: 'text-xl', container: 'w-12 h-12' },
  xl: { icon: 32, text: 'text-2xl', container: 'w-16 h-16' },
};

export const Logo = ({ size = 'md', showText = false, className = '', variant = 'image' }: LogoProps) => {
  const sizes = sizeMap[size];
  const iconSize = sizes.icon;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes.container} rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-all duration-300`}>
        {variant === 'image' ? (
          <img 
            src="/images/women-safety-logo.svg" 
            alt="Women Safety Device Logo" 
            className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
            style={{ width: iconSize, height: iconSize }}
          />
        ) : (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 512 512" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary transition-transform duration-300 hover:scale-105"
          >
            <defs>
              <linearGradient id="logoGrad1" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f46e5"/>
                <stop offset="100%" stopColor="#a5b4fc"/>
              </linearGradient>
            </defs>
            <path d="M256 24L40 108v152c0 150.5 121.5 272 272 272s272-121.5 272-272V108L256 24z" fill="url(#logoGrad1)" opacity="0.95"/>
            <path d="M256 48L88 128v128c0 132.5 107.5 240 240 240s240-107.5 240-240V128L256 48z" fill="url(#logoGrad1)"/>
            <circle cx="256" cy="240" r="72" fill="white" opacity="0.95"/>
            <g stroke="#4f46e5" strokeWidth="12" strokeLinecap="round">
              <line x1="256" y1="200" x2="256" y2="280"/>
              <line x1="216" y1="240" x2="296" y2="240"/>
            </g>
          </svg>
        )}
      </div>
      {showText && (
        <span className={`font-display font-bold ${sizes.text} bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent`}>
          SafeHer
        </span>
      )}
    </div>
  );
};

export default Logo;

