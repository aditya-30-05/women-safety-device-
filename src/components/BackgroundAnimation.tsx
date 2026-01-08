import React from 'react';

const BackgroundAnimation: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
            {/* Base Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-secondary/20" />

            {/* Glassy Orbs */}
            <div
                className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary/10 blur-[100px] animate-pulse-slow"
                style={{ animationDuration: '10s' }}
            />
            <div
                className="absolute bottom-[-5%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-accent/10 blur-[100px] animate-pulse-slow"
                style={{ animationDuration: '12s', animationDelay: '1s' }}
            />
            <div
                className="absolute top-[20%] right-[15%] w-[25rem] h-[25rem] rounded-full bg-primary/5 blur-[80px] animate-bounce-slow"
            />

            {/* Smooth Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,113,133,0.05)_0%,transparent_70%)]" />
        </div>
    );
};

export default BackgroundAnimation;
