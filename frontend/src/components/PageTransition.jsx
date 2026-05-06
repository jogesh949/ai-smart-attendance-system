import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const PageTransition = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="in"
    exit="out"
    transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export default PageTransition;