// DEPRECATED: Use LoadingComponent instead
// This file is kept for backward compatibility but should not be used in new code

import LoadingComponent from './LoadingComponent';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  // Map sizes to LoadingComponent sizes
  const sizeMap = {
    sm: 'small' as const,
    md: 'medium' as const,
    lg: 'large' as const,
  };

  return (
    <div className={className}>
      <LoadingComponent 
        message="Cargando..." 
        size={sizeMap[size]} 
        showMessage={false}
      />
    </div>
  );
}