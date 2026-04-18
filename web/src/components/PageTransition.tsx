import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * Wrapper qui anime l'entrée/sortie de chaque route avec un fade + slide
 * discret. La `key` basée sur le pathname force un remount + animation à
 * chaque changement de route. Durée courte (220 ms) pour rester vif.
 *
 * Respecte prefers-reduced-motion automatiquement via Framer Motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
