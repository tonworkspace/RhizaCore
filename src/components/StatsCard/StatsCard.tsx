interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  bgColor?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subValue,
  icon,
  bgColor = "bg-blue-500/20",
  className
}) => {
  return (
    <div className={`group relative overflow-hidden ${className}`}>
      {/* Background with animated gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${bgColor} animate-gradient-slow`} />
      
      {/* Animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
        opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-shimmer" />
      
      {/* Main content container */}
      <div className="relative p-4 rounded-xl border border-white/10 backdrop-blur-sm 
        bg-black/30 hover:bg-black/40 transition-all duration-300">
        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-8 h-8">
          <div className="absolute top-0 left-0 w-[1px] h-4 bg-gradient-to-b from-white/60 to-transparent" />
          <div className="absolute top-0 left-0 h-[1px] w-4 bg-gradient-to-r from-white/60 to-transparent" />
        </div>
        <div className="absolute -top-px -right-px w-8 h-8">
          <div className="absolute top-0 right-0 w-[1px] h-4 bg-gradient-to-b from-white/60 to-transparent" />
          <div className="absolute top-0 right-0 h-[1px] w-4 bg-gradient-to-l from-white/60 to-transparent" />
        </div>
        <div className="absolute -bottom-px -left-px w-8 h-8">
          <div className="absolute bottom-0 left-0 w-[1px] h-4 bg-gradient-to-t from-white/60 to-transparent" />
          <div className="absolute bottom-0 left-0 h-[1px] w-4 bg-gradient-to-r from-white/60 to-transparent" />
        </div>
        <div className="absolute -bottom-px -right-px w-8 h-8">
          <div className="absolute bottom-0 right-0 w-[1px] h-4 bg-gradient-to-t from-white/60 to-transparent" />
          <div className="absolute bottom-0 right-0 h-[1px] w-4 bg-gradient-to-l from-white/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Header with icon */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center
              group-hover:scale-110 transition-transform duration-300`}>
              {icon}
            </div>
            <span className="text-sm font-medium text-white/80">{title}</span>
          </div>

          {/* Value with animation */}
          <div className="space-y-1">
            <div className="text-xl font-bold text-white tracking-tight group-hover:scale-105 
              transition-transform duration-300 origin-left">
              {value}
            </div>
            {subValue && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">{subValue}</span>
                <div className="flex-grow h-[1px] bg-gradient-to-r from-white/10 to-transparent 
                  transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            )}
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
};

export default StatsCard; 