import { motion, AnimatePresence } from 'framer-motion';
import './Preloader.css';

const Preloader = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="preloader-overlay"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 1, ease: [0.4, 0, 0.2, 1] }
          }}
        >
          {/* Animated background atmosphere */}
          <div className="preloader-blobs">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
          </div>

          <div className="preloader-content">
            <div className="preloader-brand">
              <motion.h1 
                className="brand-name"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                Eco<span className="brand-spark">Spark</span>
              </motion.h1>
              
              <motion.div 
                className="words-loader-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <span>Loading</span>
                <div className="words">
                  <span className="word">Challenges</span>
                  <span className="word">EcoPoints</span>
                  <span className="word">Leaderboards</span>
                  <span className="word">Sustainability</span>
                  <span className="word">Ecosystems</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
