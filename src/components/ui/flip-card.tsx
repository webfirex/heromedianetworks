'use client';

import { cn } from '@/lib/utils';
import { Rocket, Zap, Code2, Copy, ArrowRight } from 'lucide-react';

export interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'gradient' | 'glass';
    gradientColor?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    features?: string[];
}

export default function NeoCard({
    variant = 'glass',
    gradientColor = '#3B82F6',
    className,
    children,
    title,
    subtitle,
    description,
    features,
    ...props
}: NeoCardProps) {
    const isGradient = variant === 'gradient';

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-[26px] border transition-all duration-300',
                isGradient
                    ? 'border-white/10 shadow-xl'
                    : 'border-white/5 bg-[#151517]/80 shadow-lg backdrop-blur-xl',
                className
            )}
            style={isGradient ? {
                background: `linear-gradient(135deg, ${gradientColor}15 0%, ${gradientColor}05 100%)`,
                ['--primary' as any]: gradientColor,
            } as React.CSSProperties : undefined}
            {...props}
        >
            {isGradient && (
                <>
                    {/* Gradient Effects for 'gradient' variant */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                    <div
                        className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20"
                        style={{ background: gradientColor }}
                    />
                    <div
                        className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full blur-3xl opacity-20"
                        style={{ background: gradientColor }}
                    />
                </>
            )}

            {children ? (
                <div className="relative z-10 h-full w-full">
                    {children}
                </div>
            ) : (
                // Fallback default content if no children provided (Backwards compatibility-ish)
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-zinc-400">{subtitle}</p>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute right-0 bottom-0 p-6 opacity-10">
                        <Rocket size={100} />
                    </div>
                </div>
            )}

            {/* Texture/Noise overlay for premium feel */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </div>
    );
}
