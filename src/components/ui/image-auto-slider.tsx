import React from 'react';

export const Component = () => {
  // Images for the infinite scroll - using Unsplash URLs
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

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <>
      <style>{`
        .image-slider-wrapper {
          width: 100%;
          min-height: 50vh; /* Better than full screen for a slider */
          background-color: var(--color-bg-deep); /* Use existing theme variable */
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 0;
        }

        .image-slider-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, var(--color-bg-deep), transparent 20%, transparent 80%, var(--color-bg-deep));
          z-index: 20;
          pointer-events: none; /* Let hover events pass through */
        }
        
        .image-slider-edges {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, var(--color-bg-deep) 0%, transparent 15%, transparent 85%, var(--color-bg-deep) 100%);
          z-index: 21;
          pointer-events: none;
        }

        .scroll-container-outer {
          position: relative;
          z-index: 10;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scroll-container-inner {
          width: 100%;
          max-width: 1400px;
        }

        .infinite-scroll-track {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: scroll-right 30s linear infinite;
        }

        .scroll-container-outer:hover .infinite-scroll-track {
          animation-play-state: paused;
        }

        @keyframes scroll-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .image-slide-item {
          flex-shrink: 0;
          width: 14rem;
          height: 14rem;
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: transform 0.4s var(--ease-bounce), filter 0.4s ease, box-shadow 0.4s ease;
          border: 1px solid rgba(255,255,255,0.05); /* Match global glass look */
        }
        
        @media (min-width: 768px) {
          .image-slide-item {
            width: 18rem;
            height: 18rem;
          }
        }
        
        @media (min-width: 1024px) {
          .image-slide-item {
            width: 22rem;
            height: 22rem;
          }
        }

        .image-slide-item:hover {
          transform: scale(1.08) translateY(-10px);
          filter: brightness(1.15) contrast(1.1);
          box-shadow: var(--glow-primary); /* Primary glow matches the brand */
          z-index: 50; /* Bring above others on hover */
        }

        .image-slide-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      `}</style>
      
      <div className="image-slider-wrapper">
        <div className="image-slider-gradient" />
        <div className="image-slider-edges" />
        
        <div className="scroll-container-outer">
          <div className="scroll-container-inner">
            <div className="infinite-scroll-track">
              {duplicatedImages.map((image, index) => (
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
      </div>
    </>
  );
};
