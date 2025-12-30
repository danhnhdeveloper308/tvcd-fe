"use client";
import React from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface LazyLoaderProps {
    message?: string;
    variant?: 'overlay' | 'inline' | 'card';
    size?: 'sm' | 'md' | 'lg';
    showLogo?: boolean;
}

const LazyLoader: React.FC<LazyLoaderProps> = ({
    message = "Đang tải dữ liệu...",
    variant = 'inline',
    size = 'md',
    showLogo = true
}) => {
    // Size configurations
    const sizeConfig = {
        sm: {
            container: "p-3",
            logoSize: 30,
            spinnerSize: 18,
            textClass: "text-sm",
            gap: "gap-2"
        },
        md: {
            container: "p-4",
            logoSize: 40,
            spinnerSize: 22,
            textClass: "text-base",
            gap: "gap-3"
        },
        lg: {
            container: "p-6",
            logoSize: 50,
            spinnerSize: 28,
            textClass: "text-lg",
            gap: "gap-4"
        }
    };

    // Variant configurations
    const variantConfig = {
        overlay: "fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center",
        inline: "w-full flex items-center justify-center py-6",
        card: "w-full h-full min-h-[200px] flex items-center justify-center bg-slate-50/50 rounded-lg border border-slate-100"
    };

    // Current configuration based on props
    const currentSize = sizeConfig[size];
    const currentVariant = variantConfig[variant];

    return (
        <div className={`${currentVariant}`}>
            <div className={`flex flex-col items-center ${currentSize.gap}`}>
                {showLogo ? (
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary h-[${currentSize.logoSize + 20}px] w-[${currentSize.logoSize + 20}px]`} />
                        </div>

                        <div className="relative flex items-center justify-center animate-pulse">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={currentSize.logoSize}
                                height={currentSize.logoSize}
                                className="object-contain"
                            />
                        </div>
                    </div>
                ) : (
                    <Loader2 className={`h-${currentSize.spinnerSize} w-${currentSize.spinnerSize} text-primary animate-spin`} />
                )}

                <p className={`${currentSize.textClass} text-slate-600 dark:text-slate-300 font-medium`}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default LazyLoader;