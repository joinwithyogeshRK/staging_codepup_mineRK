import React, { useState } from "react";

const PartnerCarousel = () => {
  const [isPaused, setIsPaused] = useState(false);

  // Real partner logos (SVG/PNG)
  const partners = [
    {
      name: "Google",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg",
    },
    {
      name: "Microsoft",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/microsoft.svg",
    },
    {
      name: "Amazon",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/amazon.svg",
    },
    {
      name: "Meta",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/meta.svg",
    },
    {
      name: "Apple",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/apple.svg",
    },
    {
      name: "Netflix",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/netflix.svg",
    },
    {
      name: "Spotify",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg",
    },
    {
      name: "Adobe",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/adobe.svg",
    },
    {
      name: "Tesla",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tesla.svg",
    },
    {
      name: "X",
      logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg",
    },
  ];

  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="w-full bg-gradient-to-b mt-2 -mb-3 from-gray-50 to-white py-14 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Fading Gradient Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Scrolling Track */}
          <div className="flex overflow-hidden">
            <div
              className={`flex gap-10 ${isPaused ? "" : "animate-scroll"}`}
              style={{
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {duplicatedPartners.map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex-shrink-0 w-28 h-20 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-[50px] max-h-[50px] object-contain opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-300"
                    style={{ filter: "invert(0)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default PartnerCarousel;
