/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        // Maps directly onto the CSS custom properties in src/index.css —
        // class names match the --var names 1:1 so there's no separate
        // mapping to remember (bg-primary == var(--primary), etc).
        primary:        'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-bg':   'var(--primary-bg)',
        accent:         'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-bg':    'var(--accent-bg)',
        present:        'var(--present)',
        'present-bg':   'var(--present-bg)',
        late:           'var(--late)',
        'late-bg':      'var(--late-bg)',
        absent:         'var(--absent)',
        'absent-bg':    'var(--absent-bg)',
        holiday:        'var(--holiday)',
        'holiday-bg':   'var(--holiday-bg)',
        surface:        'var(--surface)',
        muted:          'var(--muted)',
        hint:           'var(--hint)',
        // "bg"/"text" collide with Tailwind's own utility prefixes, so the
        // page background and default text color use these names instead.
        page:           'var(--bg)',
        ink:            'var(--text)',
        border: {
          DEFAULT: 'var(--border)',
          strong:  'var(--border-strong)',
        },
      },
    },
  },
  plugins: [],
}
