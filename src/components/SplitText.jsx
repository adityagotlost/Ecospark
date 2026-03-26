import React from 'react';
import { motion, useInView } from 'framer-motion';

export default function SplitText({
  text = '',
  className = '',
  delay = 40,
  animationOffset = 0,
  duration = 0.6,
}) {
  const letters = text.split('');
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  return (
    <span
      ref={ref}
      style={{ display: 'inline-block', overflow: 'hidden' }}
      className={`split-parent ${className}`}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{
            duration: duration,
            ease: [0.215, 0.610, 0.355, 1.000], // Equivalent to custom GSAP power3.out
            delay: animationOffset + ((index * delay) / 1000),
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}
