// components/Gradient.tsx
'use client';

import React from 'react';

export default function Gradient({ children }: { children?: React.ReactNode }) {
    return (
        <div className="ri-gradient">
            <div className="ri-overlay">
                {children}
            </div>
            <style jsx>{`
        .ri-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(600px circle at 0% 0%, rgba(56, 189, 248, 0.15), transparent 40%),
            radial-gradient(600px circle at 100% 0%, rgba(248, 113, 113, 0.15), transparent 40%),
            radial-gradient(600px circle at 0% 100%, rgba(34, 197, 94, 0.15), transparent 40%),
            radial-gradient(600px circle at 100% 100%, rgba(168, 85, 247, 0.15), transparent 40%);
          filter: blur(20px);
          pointer-events: none;
        }
        .ri-overlay {
          position: absolute;
          inset: 0;
          background-size: 100px 100px;
          background-image:
            linear-gradient(to right, rgb(229, 231, 235) 0.5px, transparent 0.5px),
            linear-gradient(to bottom, rgb(229, 231, 235) 0.5px, transparent 0.5px);
        }
        :global(html.dark) .ri-overlay {
          background-image:
            linear-gradient(to right, rgb(17, 24, 39) 0.5px, transparent 0.5px),
            linear-gradient(to bottom, rgb(17, 24, 39) 0.5px, transparent 0.5px);
        }
      `}</style>
        </div>
    );
}
