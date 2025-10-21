module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'grid-flow': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-20px)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 0.2 },
          '50%': { opacity: 1 },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotateZ(0)', opacity: '1' },
          '100%': { transform: 'translateY(-1000px) rotateZ(720deg)', opacity: '0' },
        },
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'gradient-slow': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'confetti-1': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(-50px, -100px) rotate(-90deg)', opacity: '0' }
        },
        'confetti-2': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(50px, -100px) rotate(90deg)', opacity: '0' }
        },
        'confetti-3': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(-70px, -60px) rotate(-120deg)', opacity: '0' }
        },
        'confetti-4': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(70px, -60px) rotate(120deg)', opacity: '0' }
        },
        'pulse-slow': {
          '0%': { opacity: 0.2 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.2 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'gradient-x': 'gradient-x 3s ease infinite',
        'grid-flow': 'grid-flow 20s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'confetti-1': 'confetti-1 1s ease-out forwards',
        'confetti-2': 'confetti-2 1s ease-out forwards',
        'confetti-3': 'confetti-3 1s ease-out forwards',
        'confetti-4': 'confetti-4 1s ease-out forwards',
        'bounce-subtle': 'bounce-subtle 3s infinite',
        'gradient-slow': 'gradient-slow 3s ease infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
} 