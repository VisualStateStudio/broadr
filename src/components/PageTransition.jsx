import { motion, useReducedMotion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const reducedVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export default function PageTransition({ children }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? reducedVariants : pageVariants;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
