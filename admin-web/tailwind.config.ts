import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        'ink-4': 'var(--ink-4)',
        rule: 'var(--rule)',
        'rule-strong': 'var(--rule-strong)',
        green: 'var(--green)',
        'green-ink': 'var(--green-ink)',
        'green-soft': 'var(--green-soft)',
        amber: 'var(--amber)',
        'amber-soft': 'var(--amber-soft)',
        red: 'var(--red)',
        'red-soft': 'var(--red-soft)',
        // legacy aliases so the untouched pages keep compiling
        primary: '#1F8F6C',
        'primary-dark': '#145C46',
        'primary-light': '#E4F3EC',
        navy: '#14213D',
        'navy-light': '#3B4763',
        background: '#F7F5F0',
        card: '#FDFCFA',
        error: '#B42318',
        warning: '#B7791F',
        success: '#1F8F6C',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};

export default config;
