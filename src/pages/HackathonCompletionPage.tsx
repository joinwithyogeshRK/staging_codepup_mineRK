import React from "react";

const HackathonOverComponent = () => {
  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Enhanced Grid Gradient Background */}
      <div className="absolute inset-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-gray-900"></div>

        {/* Grid pattern with gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.15) 0%, transparent 25%),
            radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.15) 0%, transparent 25%),
            radial-gradient(circle at 75% 25%, rgba(168, 85, 247, 0.1) 0%, transparent 25%),
            radial-gradient(circle at 25% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 25%),
            linear-gradient(rgba(147, 51, 234, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.05) 1px, transparent 1px)
          `,
            backgroundSize:
              "800px 800px, 600px 600px, 400px 400px, 300px 300px, 40px 40px, 40px 40px",
          }}
        ></div>

        {/* Additional gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-gray-900/40"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-0.5 bg-gradient-to-r from-purple-500 to-transparent animate-pulse"></div>
        <div className="absolute top-32 left-32 w-24 h-0.5 bg-gradient-to-r from-purple-400 to-transparent animate-pulse delay-100"></div>
        <div className="absolute top-44 left-24 w-20 h-0.5 bg-gradient-to-r from-purple-500 to-transparent animate-pulse delay-200"></div>

        <div className="absolute top-40 right-40 w-32 h-0.5 bg-gradient-to-l from-blue-500 to-transparent animate-pulse delay-300"></div>
        <div className="absolute top-56 right-32 w-20 h-0.5 bg-gradient-to-l from-blue-400 to-transparent animate-pulse delay-150"></div>

        <div className="absolute bottom-40 left-16 w-28 h-0.5 bg-gradient-to-r from-purple-500 to-transparent animate-pulse delay-400"></div>
        <div className="absolute bottom-28 left-28 w-24 h-0.5 bg-gradient-to-r from-purple-400 to-transparent animate-pulse delay-500"></div>

        <div className="absolute bottom-32 right-24 w-32 h-0.5 bg-gradient-to-l from-blue-500 to-transparent animate-pulse delay-600"></div>
        <div className="absolute bottom-44 right-16 w-20 h-0.5 bg-gradient-to-l from-blue-400 to-transparent animate-pulse delay-700"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center h-screen p-8">
        <div className="max-w-6xl w-full text-center">
          <div className=" flex w-full items-center justify-center">
            <img className="h-72 " src="./main.png" alt="" />
          </div>

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-4 tracking-wider italic transform skew-y-1">
              HACKATHON
            </h1>
            <h2 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 tracking-wider italic transform -skew-y-1">
              COMPLETE
            </h2>
          </div>

          {/* Thank You Message */}
          <div className="mb-12">
            <p className="text-gray-300 text-lg mb-4 max-w-2xl mx-auto">
              Thank you to all participants for an amazing 48 hours of
              innovation and creativity! Your dedication has made this hackathon
              unforgettable.
            </p>
          </div>

          {/* Social Section */}
          <div className="mb-8">
            <h3 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-wide">
              FOLLOW OUR SOCIAL HANDLES
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
              Stay connected with us and get notified when the next hackathon
              drops!
            </p>

            {/* Social Links */}
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
              {/* Discord */}
              <a
                href="https://discord.gg/CnUbZyXg"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-gray-800/50 border border-purple-500/30 rounded-lg px-8 py-4 hover:border-purple-400 transition-all duration-300 backdrop-blur-sm min-w-[200px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.19.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold tracking-wide">
                    DISCORD
                  </span>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/codepup/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-gray-800/50 border border-blue-500/30 rounded-lg px-8 py-4 hover:border-blue-400 transition-all duration-300 backdrop-blur-sm min-w-[200px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold tracking-wide">
                    LINKEDIN
                  </span>
                </div>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/Codepupai"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-gray-800/50 border border-gray-500/30 rounded-lg px-8 py-4 hover:border-gray-400 transition-all duration-300 backdrop-blur-sm min-w-[200px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-slate-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-white font-semibold tracking-wide">
                    X (TWITTER)
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-4">
              THANK YOU FOR PARTICIPATING
            </p>
            <p className="text-gray-500 text-sm tracking-widest">
              KEEP CODING, KEEP CREATING, KEEP INNOVATING
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Decorative Elements */}
      <div className="absolute top-8 right-8">
        <div className="w-20 h-20 border-2 border-purple-500/30 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full"></div>
        </div>
      </div>

      <div className="absolute bottom-8 left-8">
        <div className="w-16 h-16 border-2 border-blue-500/30 rounded-full flex items-center justify-center animate-pulse delay-1000">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default HackathonOverComponent;
