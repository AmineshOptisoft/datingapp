export default function LoadingSpinner({ 
  icon: Icon = null, 
  title = "Loading", 
  subtitle = "Please wait..."
}: { 
  icon?: any; 
  title?: string; 
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Icon with Gradient Border */}
        <div className="relative">
          {/* Spinning gradient border */}
          <div className="absolute inset-0 rounded-full bg-black dark:bg-white animate-spin" style={{ padding: '3px' }}>
            <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-full"></div>
          </div>
          
          {/* Icon container */}
          <div className="relative w-24 h-24 rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-black/20 dark:bg-white/20 flex items-center justify-center">
              {Icon ? (
                <Icon className="w-10 h-10 text-black dark:text-white" />
              ) : (
                <svg className="w-10 h-10 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        </div>

        {/* Animated Dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
