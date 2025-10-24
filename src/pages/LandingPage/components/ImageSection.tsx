import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
  SkipBack,
  SkipForward,
} from "lucide-react";

const CodePupVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showThumbnail, setShowThumbnail] = useState(true);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !showThumbnail) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (showThumbnail) {
      setShowThumbnail(false);
      setIsPlaying(true);
      video.play();
    } else if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
    setShowControls(true);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) {
      setVolume(50);
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleProgressClick = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime += seconds;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleKeyPress = (e) => {
    if (showThumbnail) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "ArrowUp":
        e.preventDefault();
        setVolume((prev) => Math.min(100, prev + 10));
        setIsMuted(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setVolume((prev) => Math.max(0, prev - 10));
        break;
      case "ArrowLeft":
        e.preventDefault();
        skip(-5);
        break;
      case "ArrowRight":
        e.preventDefault();
        skip(5);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, volume, showThumbnail]);

  return (
    <section
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
        >
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Thumbnail Overlay */}
      {showThumbnail && (
        <>
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <img
              src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Hero Text */}
          <div className="relative z-20 text-center px-4 pointer-events-none">
            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
              Discover the Future of AI
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mx-auto drop-shadow-md">
              Watch how AI can transform your workflow — smarter, faster, and
              more creative.
            </p>
          </div>

          {/* Play Button */}
          <button
            onClick={togglePlay}
            className="absolute z-30 flex items-center justify-center w-20 h-20 bg-white/10 border border-white/30 backdrop-blur-lg hover:bg-white/20 hover:scale-110 rounded-full transition-all"
          >
            <Play size={40} className="text-white ml-1" />
          </button>
        </>
      )}

      {/* Click overlay to toggle play/pause */}
      {!showThumbnail && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={togglePlay}
        />
      )}

      {/* Custom Controls Overlay */}
      {!showThumbnail && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Progress Bar */}
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-white rounded-full transition-all group-hover:bg-blue-500"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              {isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play size={20} className="ml-0.5" />
              )}
            </button>

            {/* Skip Buttons */}
            <button
              onClick={() => skip(-5)}
              className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => skip(5)}
              className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <SkipForward size={16} />
            </button>

            {/* Time Display */}
            <div className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <div className="w-0 group-hover:w-24 overflow-hidden transition-all duration-300">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white ${
                      isMuted ? 0 : volume
                    }%, rgba(255,255,255,0.3) ${isMuted ? 0 : volume}%)`,
                  }}
                />
              </div>
              <span className="text-sm w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                {isMuted ? 0 : volume}
              </span>
            </div>

            {/* Speed Control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
              >
                <Gauge size={18} />
                <span className="text-sm">{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-black/95 rounded-lg p-2 min-w-24 backdrop-blur-lg border border-white/10">
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`block w-full text-left px-3 py-2 rounded hover:bg-white/10 transition text-sm ${
                        playbackSpeed === speed ? "bg-white/20" : ""
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>

          {/* Keyboard Shortcuts Helper */}
          <div className="mt-2 text-xs text-white/50 text-center">
            Space: Play/Pause • F: Fullscreen • M: Mute • ↑↓: Volume • ←→: Skip
            5s
          </div>
        </div>
      )}
    </section>
  );
};

export default CodePupVideo;
