export default function BasketballIcon({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="url(#ball-gradient)" />
      <circle cx="32" cy="32" r="30" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
      <path
        d="M32 2 C32 2 8 18 8 32 C8 46 32 62 32 62"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M32 2 C32 2 56 18 56 32 C56 46 32 62 32 62"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M2 32 C18 20 46 20 62 32"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M2 32 C18 44 46 44 62 32"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.5"
        fill="none"
      />
      <defs>
        <radialGradient id="ball-gradient" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ff8c42" />
          <stop offset="55%" stopColor="#e85d04" />
          <stop offset="100%" stopColor="#c1440e" />
        </radialGradient>
      </defs>
    </svg>
  );
}
