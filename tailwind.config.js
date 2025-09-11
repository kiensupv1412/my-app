module.exports = {
    theme: {
        extend: {
            keyframes: {
                'slide-in-from-right': {
                    '0%': { transform: 'translateX(100%)', opacity: 0 },
                    '100%': { transform: 'translateX(0)', opacity: 1 },
                },
                'slide-out-to-right': {
                    '0%': { transform: 'translateX(0)', opacity: 1 },
                    '100%': { transform: 'translateX(100%)', opacity: 0 },
                },
            },
            animation: {
                'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
                'slide-out-to-right': 'slide-out-to-right 0.3s ease-in forwards',
            },
        },
    },
}