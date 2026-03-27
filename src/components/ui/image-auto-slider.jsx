import React, { useRef, useState } from 'react';

export const Component = () => {
  // Images for the scroll gallery - using Unsplash URLs
  const images = [
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2152&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1673264933212-d78737f38e48?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1711434824963-ca894373272e?q=80&w=2030&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1675705721263-0bbeec261c49?q=80&w=1940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1524799526615-766a9833dec0?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ];

  // Provide a long list of images so there's plenty to scroll through
  const scrollImages = [...images, ...images, ...images];

  // Ref and state for mouse drag scrolling
  const scrollRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  React.useEffect(() => {
    let animationId;
    const container = scrollRef.current;

    const autoScroll = () => {
      if (!isDown && container) {
        container.scrollLeft += 0.8; // Auto-scroll speed
        
        // Soft reset when reaching near the end
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);

    return () => cancelAnimationFrame(animationId);
  }, [isDown]);

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <>
      <style>{`
        .image-slider-wrapper {
          width: 100%;
          min-height: 50vh; 
          background-color: var(--color-bg-deep);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 4rem 0;
        }

        .image-slider-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, var(--color-bg-deep) 0%, transparent 20%, transparent 80%, var(--color-bg-deep) 100%);
          z-index: 20;
          pointer-events: none;
        }
        
        .image-slider-edges {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, var(--color-bg-deep) 0%, transparent 10%, transparent 90%, var(--color-bg-deep) 100%);
          z-index: 21;
          pointer-events: none;
        }

        .scroll-container-outer {
          position: relative;
          z-index: 10;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          cursor: grab;
          
          /* Hide scrollbar for Chrome, Safari and Opera */
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .scroll-container-outer::-webkit-scrollbar {
          display: none;
        }
        
        .scroll-container-outer:active {
          cursor: grabbing;
        }

        .infinite-scroll-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          padding: 2rem 5vw; /* Start with an offset */
        }

        .image-slide-item {
          flex-shrink: 0;
          width: 14rem;
          height: 14rem;
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: transform 0.4s var(--ease-bounce), filter 0.4s ease, box-shadow 0.4s ease;
          border: 1px solid rgba(255,255,255,0.05); 
          user-select: none;
        }
        
        @media (min-width: 768px) {
          .image-slide-item { width: 18rem; height: 18rem; gap: 2rem; }
        }
        
        @media (min-width: 1024px) {
          .image-slide-item { width: 22rem; height: 22rem; }
        }

        .image-slide-item:hover {
          transform: scale(1.08) translateY(-10px);
          filter: brightness(1.15) contrast(1.1);
          box-shadow: var(--glow-primary); 
          z-index: 50; 
        }

        .image-slide-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none; /* Prevent ghost dragging of the image */
        }
      `}</style>
      
      <div className="image-slider-wrapper">
        <div className="image-slider-gradient" />
        <div className="image-slider-edges" />
        
        <div 
          className="scroll-container-outer"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="infinite-scroll-track">
            {scrollImages.map((image, index) => (
              <div key={index} className="image-slide-item">
                <img
                  src={image}
                  alt={`Eco Gallery ${(index % images.length) + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
