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
      {/* Multi-layer animated background matching navbar */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-purple-500/5 to-cyan-500/8 animate-gradient"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-50/20"></div>
      
      {/* Subtle border glow matching navbar */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 via-purple-400/10 to-cyan-400/20 blur-sm -z-10"></div>
      
      {/* Main content container with navbar styling */}
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-2xl shadow-blue-500/20 p-5 
        hover:bg-white/95 transition-all duration-300">
        
        {/* Content */}
        <div className="space-y-3">
          {/* Header with icon */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${bgColor} flex items-center justify-center
              group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              {icon}
            </div>
            <span className="text-sm font-medium text-slate-700">{title}</span>
          </div>

          {/* Value with animation */}
          <div className="space-y-1">
            <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-700 bg-clip-text text-transparent tracking-tight group-hover:scale-105 
              transition-transform duration-300 origin-left">
              {value}
            </div>
            {subValue && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">{subValue}</span>
                <div className="flex-grow h-[1px] bg-gradient-to-r from-blue-400/20 to-transparent 
                  transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            )}
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
      </div>
    </div>
  );
};

export default StatsCard; 