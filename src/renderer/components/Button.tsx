import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'outline' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onClick,
  children,
}) => {
  // Base classes
  const baseClasses = 'btn';

  // Variant classes
  const variantClasses = {
    primary: 'btn-primary',
    outline: 'btn-outline',
    secondary: 'btn-secondary',
  }[variant];

  // Size classes
  const sizeClasses = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg',
  }[size];

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};