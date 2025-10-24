import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [activeSection, setActiveSection] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const sections = [
    { id: "hero", label: "Home" },
    { id: "gallery", label: "Gallery" },
    { id: "testimonials", label: "Testimonials" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section.id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Redirect to /home when user signs in
  useEffect(() => {
    if (isLoaded && user) {
      navigate("/home");
    }
  }, [isLoaded, user, navigate]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[80%] max-w-5xl 
      rounded-2xl px-8 py-4 flex items-center justify-between 
      backdrop-blur-md 
      transition-all duration-300 ${
        isScrolled ? "bg-black/10 scale-[1.01]" : ""
      }`}
    >
      {/* Brand */}
      <div className="flex gap-2">
        <img
          className="h-10 -mt-1 items-center justify-center"
          src="/puppy.png"
          alt=""
        />
     
      </div>

      {/* Navigation Links */}
      <ul className="flex-1 flex items-center justify-center gap-10">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              onClick={() => scrollToSection(section.id)}
              className={`relative text-sm font-medium transition-all duration-300 uppercase tracking-wide
                ${
                  activeSection === section.id
                    ? "text-blue-500"
                    : "text-gray-700 font-light hover:text-gray-900"
                }
                after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[1px]
                after:w-0 after:bg-gray-950 hover:after:w-full after:transition-all after:duration-300
              `}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Right side - Auth buttons */}
      <div className="flex-shrink-0">
        {/* Show Sign In button when signed out */}
        <SignedOut>
          <SignInButton mode="modal">
            <button
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-white text-black 
              hover:bg-neutral-200  transition-all duration-300 shadow-md"
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        {/* Show User Button when signed in */}
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
                userButtonPopoverCard: "bg-white border-gray-300",
                userButtonPopoverText: "text-gray-800",
              },
            }}
          />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
