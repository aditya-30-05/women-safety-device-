import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { width: 32, height: 32, text: 'text-lg' },
    md: { width: 48, height: 48, text: 'text-2xl' },
    lg: { width: 84, height: 84, text: 'text-4xl' },
    xl: { width: 120, height: 120, text: 'text-6xl' },
};

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = false, className = '' }) => {
    const { width, height, text } = sizeMap[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg
                width={width}
                height={height}
                viewBox="0 0 512 512"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FDA4AF" /> {/* Pink-300ish */}
                        <stop offset="50%" stopColor="#C084FC" /> {/* Purple-400ish */}
                        <stop offset="100%" stopColor="#818CF8" /> {/* Indigo-400ish */}
                    </linearGradient>
                </defs>

                {/* Shield Background */}
                <path
                    d="M256 48C180 48 100 80 64 112C64 216 64 336 256 464C448 336 448 216 448 112C412 80 332 48 256 48Z"
                    fill="url(#shieldGradient)"
                />

                {/* Woman Silhouette (Profile) */}
                <path
                    d="M175 140C165 140 155 145 150 155C140 175 140 200 140 230C140 270 150 300 165 315C175 325 190 330 210 332C195 340 180 355 170 380C160 410 160 440 165 470C190 460 215 440 235 410C245 395 252 375 255 350C270 360 290 365 315 365C355 365 390 345 410 315C395 325 375 332 355 332C315 332 280 310 260 280C255 272 250 262 248 252C250 242 255 225 255 210C255 175 240 140 175 140Z"
                    fill="#1E1B4B"
                    fillOpacity="0.85"
                />

                {/* Hair Strands / Stylized Effects */}
                <path
                    d="M270 120C330 120 380 160 400 240C410 280 400 330 360 360C385 330 395 285 395 240C395 185 360 140 295 130C285 130 275 125 270 120Z"
                    fill="white"
                    fillOpacity="0.2"
                />
                <path
                    d="M230 100C300 100 350 140 370 200C380 230 375 270 345 300C365 275 370 240 370 205C370 160 335 120 255 110C245 110 235 105 230 100Z"
                    fill="white"
                    fillOpacity="0.1"
                />
            </svg>
            {showText && (
                <span className={`${text} font-bold tracking-tight bg-gradient-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent`}>
                    SafeHer
                </span>
            )}
        </div>
    );
};

export default Logo;
