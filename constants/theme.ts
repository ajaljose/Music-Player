export const COLORS = {
  // Theme Palette
  darkBg: '#272727',        // Primary dark background
  yellowAccent: '#FED766',  // Primary accent (Mustard Yellow)
  cyanAccent: '#009FB7',    // Secondary accent (Pacific Blue)
  slateGray: '#696773',     // Secondary text / Inactive icons / Borders
  lightGray: '#EFF1F3',     // Primary text / High contrast elements

  // Derived theme helpers
  darkerBg: '#1e1e1e',      // Navigation bar / Card dark background
  cardBg: 'rgba(239, 241, 243, 0.04)',
  cardBorder: 'rgba(105, 103, 115, 0.3)',
  activeTrackBg: 'rgba(254, 215, 102, 0.12)',
  waveformActive: '#FED766',
  waveformInactive: 'rgba(105, 103, 115, 0.35)',
};

export const GRADIENTS = {
  header: ['#009FB7', '#007A8D', '#005E6C'] as const,
  playBtn: ['#FED766', '#E5BD4C'] as const,
  libraryBg: ['#272727', '#1c1c1c'] as const,
};
