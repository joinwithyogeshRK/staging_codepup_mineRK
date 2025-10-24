import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button1";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  eyebrow?: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  demoLabel?: string;
  demoHref?: string;
}

export function Hero({
  eyebrow = "Innovate Without Limits",
  subtitle,
  ctaLabel = "Try for Free",
  ctaHref = "#",
  demoLabel = "Demo Video",
  demoHref = "#image", // Changed to match the section id
}: HeroProps) {
  const navigate = useNavigate();

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="hero"
      className="relative  pt-40 items-center justify-center   text-center  
      h-screen overflow-hidden 
      bg-[linear-gradient(to_bottom,#fff,#ffffff_50%,#e8e8e8_88%)]  
      dark:bg-[linear-gradient(to_bottom,#000,#0000_30%,#898e8e_78%,#ffffff_99%_50%)] 
      "
    >
      <motion.div
        className="absolute top-10 left-10 z-30"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-blue-400 bg-clip-text text-transparent">
          CodePup
        </h1>
      </motion.div>

      <Navbar />

      {/* Grid BG */}
      <div
        className=" absolute -z-10 inset-0 opacity-80  w-full 
        bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] 
        dark:bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]
        bg-[size:6rem_5rem] 
        [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
      />

      {/* Radial Accent */}
      <div
        className="absolute  left-1/2 top-[calc(100%-90px)]   lg:top-[calc(100%-150px)] 
        h-[500px] w-[700px] md:h-[500px] md:w-[1100px] lg:h-[750px] lg:w-[140%] 
        -translate-x-1/2 rounded-[100%] border-[#B48CDE]  dark:bg-black 
        bg-[radial-gradient(closest-side,#fff_82%,#000000)] 
        dark:bg-[radial-gradient(closest-side,#000_82%,#ffffff)] 
        animate-fade-up"
      />

      {/* Eyebrow */}
      {eyebrow && (
        <a href="#" className="group">
          <span
            className="text-sm text-gray-600   dark:text-gray-400 font-geist mx-auto px-5 py-2 
            bg-gradient-to-tr from-zinc-300/5 via-gray-400/5 to-transparent  
            border-[2px] border-gray-300/20 dark:border-white/5 
            rounded-3xl w-fit tracking-tight uppercase flex items-center justify-center"
          >
            {eyebrow}
            <ChevronRight className="inline  w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </a>
      )}

      {/* Title */}
      <h1 className="text-balance bg-gradient-to-br flex flex-col from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-extrabold leading-none tracking-tighter text-transparent sm:text-6xl md:text-7xl lg:text-8xl dark:from-white dark:to-white/40 px-4">
        <div className="flex justify-center items-center gap-6">
          <span className="block">Your </span>
          <span className="inline-block bg-black  dark:bg-white text-white dark:text-black px-6 italic rounded-2xl mx-2">
            Ai Partner
          </span>
          <span className=" font-bold tracking-wide  bg-clip-text text-transparent">
            for
          </span>{" "}
        </div>
        <div className="flex justify-center   gap-7 items-center">
          <span className="flex mt-2   gap-7">effortless</span>
          <span className="flex mt-2 italic text-black/70 font-medium gap-7">
            app creations
          </span>
        </div>
      </h1>

      <p
        className="mb-12 text-balance 
  text-lg tracking-tight text-gray-800 italic font-medium dark:text-gray-400 
  md:text-xl"
      >
        {subtitle}
      </p>

      {/* CTA Buttons */}
      {ctaLabel && (
        <div className="flex flex-col sm:flex-row   justify-center gap-4 items-center">
          {/* Try for Free Button - Show sign-in if not logged in */}
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-fit md:w-52 z-20 font-geist bg-gray-700 tracking-tighter text-center text-lg">
                Try for Free
              </Button>
            </SignInButton>
          </SignedOut>

          {/* If already signed in, redirect to /home */}
          <SignedIn>
            <Button
              onClick={() => navigate("/home")}
              className="w-fit md:w-52 z-20 font-geist bg-gray-700 tracking-tighter text-center text-lg"
            >
              Try for Free
            </Button>
          </SignedIn>

          {/* Demo Video Button - Scrolls to image section */}
          {demoLabel && (
            <Button
              onClick={() => scrollToSection("image")}
              variant="outline"
              className="w-fit md:w-52 z-20 font-geist tracking-tighter text-center text-lg cursor-pointer"
            >
              {demoLabel}
            </Button>
          )}
        </div>
      )}

      {/* Bottom Fade */}
      <div
        className="animate-fade-up relative mt-32 opacity-0 [perspective:2000px] 
        after:absolute after:inset-0 after:z-50 
        after:[background:linear-gradient(to_top,hsl(var(--background))_10%,transparent)]"
      />
    </section>
  );
}
