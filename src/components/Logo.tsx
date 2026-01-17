interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'icon' | 'image';
}

const sizeMap = {
  sm: { icon: 24, text: 'text-sm', container: 'w-10 h-10' },
  md: { icon: 32, text: 'text-lg', container: 'w-12 h-12' },
  lg: { icon: 48, text: 'text-2xl', container: 'w-16 h-16' },
  xl: { icon: 64, text: 'text-4xl', container: 'w-24 h-24' },
};

const Logo = ({ size = 'md', showText = false, className = '', variant = 'icon' }: LogoProps) => {
  const sizes = sizeMap[size];

  return (
    <div className={`flex items-center gap-4 ${className} group`}>
      <div className={`${sizes.container} relative flex items-center justify-center transition-all duration-500`}>
        {/* Subtle glow that matches the logo colors */}
        <div className="absolute inset-0 bg-[#FB7185]/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <svg
          width="100%"
          height="100%"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-700 hover:rotate-[3deg] hover:scale-110 drop-shadow-2xl"
        >
          <defs>
            <linearGradient id="logoGradPremium" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <linearGradient id="shineEffect" x1="0%" y1="0%" x2="50%" y2="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            <filter id="beautyGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Shield Base */}
          <path
            d="M256 32C180 32 80 64 80 144C80 300 180 430 256 480C332 430 432 300 432 144C432 64 332 32 256 32Z"
            fill="url(#logoGradPremium)"
            filter="url(#beautyGlow)"
          />

          {/* Detailed and Elegant Female Face Silhouette */}
          <path
            d="M256 120C210 120 185 155 185 210C185 250 205 270 200 290C195 310 170 330 150 360C165 385 195 405 230 415C210 395 200 370 210 340C225 300 250 280 280 270C260 250 250 220 250 190C250 150 280 130 310 130C340 130 370 150 370 190C370 230 350 260 330 280C350 300 370 330 375 360C390 330 395 290 395 240C395 170 360 120 256 120Z"
            fill="white"
            fillOpacity="0.95"
          />

          {/* Glossy Overlay */}
          <path
            d="M256 32C180 32 80 64 80 144C80 300 180 430 256 480C332 430 432 300 432 144C432 64 332 32 256 32Z"
            fill="url(#shineEffect)"
          />
        </svg>
      </div>
      {showText && (
        <span className={`font-display font-black tracking-tighter ${sizes.text} bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent uppercase`}>
          SafeHer
        </span>
      )}
    </div>
  );
};

export default Logo;

