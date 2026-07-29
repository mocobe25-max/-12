export function MobCashLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-[0_12px_28px_rgba(59,130,246,0.4)]"
      >
        <defs>
          <linearGradient id="mobcash-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F75FF" />
            <stop offset="100%" stopColor="#2A4EDD" />
          </linearGradient>
        </defs>
        
        {/* Ticket body with rounded corners and left/right inward notches */}
        <path
          d="M 28 24 
             H 72 
             C 82 24 90 32 90 42 
             V 44 
             A 7 7 0 0 0 90 56 
             V 58 
             C 90 68 82 76 72 76 
             H 28 
             C 18 76 10 68 10 58 
             V 56 
             A 7 7 0 0 0 10 44 
             V 42 
             C 10 32 18 24 28 24 Z"
          fill="url(#mobcash-blue-grad)"
        />

        {/* Center vertical dashed line (two dashes like in the screenshot) */}
        <rect x="47.5" y="33" width="5" height="13" rx="2.5" fill="#1A348A" />
        <rect x="47.5" y="54" width="5" height="13" rx="2.5" fill="#1A348A" />
      </svg>
    </div>
  );
}
