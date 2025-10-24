import React, { useState } from "react";

const PartnerCarousel = () => {
  const [isPaused, setIsPaused] = useState(false);

  // ✅ Use correct paths from the public folder (React automatically serves these)
  const partners = [
    {
      name: "Walmart",
      logo: "/walmart.png",
    },
    {
      name: "Flipkart",
      logo: "/flipkart.jpeg",
    },
    {
      name: "Clear",
      logo: "/clear.jpeg",
    },
    {
      name: "Unbox",
      logo: "/unbox.jpeg",
    },
    {
      name: "Ex-Zynga",
      logo: "/ex.jpeg",
    },
  ];

  const duplicatedPartners = [...partners, ...partners];

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-14 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Scrolling Track */}
          <div className="flex overflow-hidden">
            <div
              className={`flex gap-16 md:gap-24 ${
                isPaused ? "" : "animate-scroll"
              }`}
              style={{
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {duplicatedPartners.map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex-shrink-0 w-40 md:w-52 h-24 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-[100px] md:max-w-[130px] max-h-[70px] object-contain opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
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
