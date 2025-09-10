import React from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

// Hook to detect device type
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
};

// Mobile-friendly button component
export const MobileButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

// Mobile-friendly input component
export const MobileInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}> = ({ 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text', 
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[48px]';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
    />
  );
};

// Mobile-friendly textarea for typing
export const MobileTypingArea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}> = ({ 
  value, 
  onChange, 
  placeholder = '', 
  disabled = false,
  className = '',
  rows = 4
}) => {
  const baseClasses = 'w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`${baseClasses} ${disabledClasses} ${className}`}
      style={{ fontSize: '16px' }} // Prevents zoom on iOS
    />
  );
};

// Device type indicator (for debugging/development)
export const DeviceIndicator: React.FC = () => {
  const deviceType = useDeviceType();
  
  const icons = {
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    desktop: <Monitor className="h-4 w-4" />
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/20 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1 z-50 md:hidden">
      {icons[deviceType]}
      <span className="capitalize">{deviceType}</span>
    </div>
  );
};

// Mobile-optimized container
export const MobileContainer: React.FC<MobileOptimizationsProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  );
};

// Touch-friendly card component
export const MobileCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-200';
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-xl active:scale-98 touch-manipulation' : '';

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Mobile navigation helper
export const MobileNavigation: React.FC<{
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    active?: boolean;
  }>;
}> = ({ items }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 md:hidden">
      <div className="flex justify-around">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              item.active 
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {item.icon && <div className="mb-1">{item.icon}</div>}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
