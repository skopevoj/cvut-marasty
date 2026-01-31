"use client";

import "./GlassButton.css";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GlassButton({
  children,
  className = "",
  ...props
}: GlassButtonProps) {
  return (
    <button className={`glass-button group ${className}`} {...props}>
      {children}
    </button>
  );
}

export default GlassButton;
