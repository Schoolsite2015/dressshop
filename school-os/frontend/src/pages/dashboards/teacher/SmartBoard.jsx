import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, MonitorPlay, ChevronLeft, ChevronRight, X, Play, Wand2 } from "lucide-react";
import DashboardShell from "../../../components/DashboardShell.jsx";

// Mock data for Smart Board Presentation
const MOCK_LESSON = {
  title: "Cell Structure & Functions",
  subject: "Biology",
  class: "Class 9 - A",
  slides: [
    { type: "title", content: "Cell Structure & Functions", subtitle: "Biology • Class 9" },
    { type: "content", title: "What is a Cell?", content: "• The fundamental unit of life.\n• All living organisms are made of cells.\n• Discovered by Robert Hooke in 1665." },
    { type: "diagram", title: "Plant vs Animal Cell", content: "Differences in Cell Wall, Chloroplast, and Vacuole size." },
    { type: "quiz", title: "Quick Check", question: "Who discovered the cell?", options: ["Charles Darwin", "Robert Hooke", "Albert Einstein", "Louis Pasteur"], answer: 1 }
  ]
};

export default function SmartBoard() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const nextSlide = () => {
    if (currentSlide < MOCK_LESSON.slides.length - 1) setCurrentSlide(c => c + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(c => c - 1);
  };

  // The actual presentation view
  if (isFullscreen) {
    const slide = MOCK_LESSON.slides[currentSlide];

    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col font-display text-white overflow-hidden">
        {/* Top Bar */}
        <div className="p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <MonitorPlay size={20} />
            </div>
            <div>
              <p className="font-bold">{MOCK_LESSON.title}</p>
              <p className="text-xs text-gray-400">{MOCK_LESSON.subject} • {MOCK_LESSON.class}</p>
            </div>
          </div>
          <button onClick={toggleFullscreen} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-5xl z-10"
            >
              {slide.type === "title" && (
                <div className="text-center">
                  <h1 className="text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {slide.content}
                  </h1>
                  <p className="text-3xl text-gray-400">{slide.subtitle}</p>
                </div>
              )}

              {slide.type === "content" && (
                <div>
                  <h2 className="text-5xl font-bold mb-12 text-marigold-400 border-b border-gray-700 pb-6">{slide.title}</h2>
                  <div className="space-y-6 text-3xl text-gray-200 leading-relaxed">
                    {slide.content.split('\n').map((line, i) => (
                      <motion.p 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.2 }}
                        key={i}
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "diagram" && (
                <div className="text-center">
                  <h2 className="text-5xl font-bold mb-12 text-marigold-400">{slide.title}</h2>
                  <div className="w-full h-[400px] border-2 border-dashed border-gray-700 rounded-3xl flex items-center justify-center bg-gray-800/50">
                    <p className="text-gray-500 text-xl">[Smart Diagram Placeholder]</p>
                  </div>
                  <p className="text-2xl text-gray-300 mt-8">{slide.content}</p>
                </div>
              )}

              {slide.type === "quiz" && (
                <div>
                  <div className="inline-block bg-purple-600/20 text-purple-400 px-4 py-1.5 rounded-full text-lg font-bold mb-6 border border-purple-500/30">
                    {slide.title}
                  </div>
                  <h2 className="text-5xl font-bold mb-12">{slide.question}</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {slide.options.map((opt, i) => (
                      <button key={i} className="text-left text-2xl bg-gray-800 border-2 border-gray-700 hover:border-indigo-500 hover:bg-gray-700 p-6 rounded-2xl transition">
                        <span className="text-indigo-400 font-bold mr-4">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="p-6 flex justify-between items-center bg-gray-900 border-t border-gray-800">
          <p className="text-gray-500 font-medium tracking-widest text-sm">
            SLIDE {currentSlide + 1} / {MOCK_LESSON.slides.length}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="w-14 h-14 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center disabled:opacity-30 transition"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentSlide === MOCK_LESSON.slides.length - 1}
              className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center disabled:opacity-30 transition shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view before entering presentation mode
  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-indigo-900">Smart Board Caster</h1>
          <p className="text-sm text-indigo-600 mt-1">Cast AI Lesson Plans directly to the classroom projector.</p>
        </div>
        <button className="bg-white border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 transition flex items-center gap-2">
          <MonitorPlay size={16} /> Manage Devices
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition duration-700"></div>
          
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wider mb-6 backdrop-blur">
              READY TO CAST
            </div>
            
            <h2 className="text-3xl font-display font-bold mb-2">{MOCK_LESSON.title}</h2>
            <p className="text-indigo-200 mb-8">{MOCK_LESSON.subject} • {MOCK_LESSON.class}</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 backdrop-blur">
              <div className="flex items-center gap-3 text-sm text-indigo-200 mb-2">
                <Wand2 size={16} className="text-marigold-400" />
                Generated by AI Lesson Planner
              </div>
              <p className="text-white/80 text-sm">Contains: Title Slide, Bullet Points, Diagram Placeholder, Interactive Quiz.</p>
            </div>

            <button 
              onClick={toggleFullscreen}
              className="w-full py-4 bg-marigold-500 hover:bg-marigold-400 text-gray-900 font-bold rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              START PRESENTATION
            </button>
          </div>
        </div>

        <div className="bg-white border border-indigo-100 rounded-3xl p-8 flex flex-col justify-center text-center text-gray-500 border-dashed">
          <MonitorPlay size={48} className="mx-auto mb-4 opacity-30 text-indigo-500" />
          <p className="font-semibold text-gray-700 mb-2">Connect to a Smart Board</p>
          <p className="text-sm px-8">Ensure your device is connected to the same WiFi network as the classroom Smart Board to enable wireless casting.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
