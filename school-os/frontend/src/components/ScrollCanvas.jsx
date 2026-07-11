import React, { useRef, useEffect, useState } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

const FRAME_COUNT = 51;
const FRAME_PREFIX = "ezgif-frame-";
const FRAME_EXT = ".jpg";
const FRAME_DIR = "/sequence/";

function currentFrame(index) {
  // index is 1 to 51
  return `${FRAME_DIR}${FRAME_PREFIX}${index.toString().padStart(3, "0")}${FRAME_EXT}`;
}

export default function ScrollCanvas({ scrollYProgress }) {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentFrameIndex = useRef(1);

  // Preload images
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = [];
    
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.floor((loadedCount / FRAME_COUNT) * 100));
        if (loadedCount === FRAME_COUNT) {
          setImages(loadedImages);
          setLoaded(true);
        }
      };
      img.onerror = () => {
        console.error(`Failed to load frame ${i}`);
        // If a frame fails, we still want to proceed eventually
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          setImages(loadedImages);
          setLoaded(true);
        }
      };
      loadedImages.push(img);
    }
  }, []);

  // Frame index based on scroll: Finish animation at 40% scroll
  const frameIndex = useTransform(scrollYProgress, [0, 0.4], [1, FRAME_COUNT]);

  useMotionValueEvent(frameIndex, "change", (latest) => {
    const nextFrame = Math.min(FRAME_COUNT, Math.max(1, Math.floor(latest)));
    if (nextFrame !== currentFrameIndex.current && loaded) {
      currentFrameIndex.current = nextFrame;
      renderCanvas();
    }
  });

  const renderCanvas = () => {
    if (!canvasRef.current || !images.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimize performance
    
    // Set internal resolution based on device pixel ratio for sharpness
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    
    ctx.scale(dpr, dpr);
    
    const img = images[currentFrameIndex.current - 1];
    if (!img) return;

    // Draw background color to match edges if needed
    ctx.fillStyle = "#020202"; // Matching the dark edges of the video
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate scaling to cover on desktop, contain on mobile
    const isMobile = window.innerWidth < 768;
    
    const scale = isMobile 
      ? Math.min(rect.width / img.width, rect.height / img.height) // contain
      : Math.max(rect.width / img.width, rect.height / img.height); // cover
      
    const x = (rect.width / 2) - (img.width / 2) * scale;
    const y = (rect.height / 2) - (img.height / 2) * scale;

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
  };

  // Render initially and on resize
  useEffect(() => {
    if (loaded) {
      renderCanvas();
      const handleResize = () => requestAnimationFrame(renderCanvas);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [loaded]);

  return (
    <div className="relative w-full h-full bg-[#020202]">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#020202] text-white">
          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out" 
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <p className="font-display text-sm tracking-widest uppercase text-white/50">
            Initializing {loadProgress}%
          </p>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
