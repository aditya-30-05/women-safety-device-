import { Map } from 'lucide-react';

export const MockMap = () => {
    return (
        <div className="w-full h-full bg-muted/20 relative overflow-hidden rounded-xl flex items-center justify-center p-4 min-h-[inherit]">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), 
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Abstract Map Shapes */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.02] dark:opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h100v100H0z" fill="none" />
                <path d="M-10 50 Q 30 40 50 80 T 110 50" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M-10 80 Q 40 90 80 40 T 120 70" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="70" cy="30" r="15" fill="currentColor" />
                <rect x="20" y="20" width="30" height="20" fill="currentColor" />
            </svg>

            {/* Content */}
            <div className="relative z-10 text-center space-y-3 p-6 rounded-2xl bg-background/80 backdrop-blur-md border border-border/50 shadow-sm max-w-sm mx-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 ring-4 ring-primary/5">
                    <Map className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h3 className="font-display font-semibold text-foreground text-lg">Demo Map Mode</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Running in simulation mode.
                        <br />
                        Real-time map features are disabled.
                    </p>
                </div>
                <div className="pt-2">
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        Visualization Only
                    </span>
                </div>
            </div>

            {/* Decorative Blobs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>
    );
};

export default MockMap;
