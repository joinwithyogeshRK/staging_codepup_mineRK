import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { TestimonialsColumn } from "@/components/blocks/testimonials-columns-1";

const fallbackTestimonials = [
  {
    text: "I have been a beta early adopter of CodePup CodePup AI launched by Rajesh Pentakota last few weeks. It is easily a Lovable from India! Try it out today!",
    image: "https://ui-avatars.com/api/?name=Naveen&background=random",
    name: "Naveen Athresh",
    role: "Ai/Enterprenaur",
  },
  {
    text: " Just built two projects using Codepup AI – an amazing tool by DYYOTA that creates full-stack websites from simple prompts!",
    image: "https://ui-avatars.com/api/?name=Laxmi&background=random",
    name: "Laxmi Navi",
    role: "Student",
  },
  {
    text: "Built a Travel Website that helps people discover destinations, plan trips, and get inspired — powered by CodePup AI.",
    image: "https://ui-avatars.com/api/?name=Chandana&background=random",
    name: "Chandana HS",
    role: "Student",
  },
  {
    text: "Excited to launch my personal tech portfolio built with the help of CodePup AI and DYYOTA",
    image: "https://ui-avatars.com/api/?name=Prashant&background=random",
    name: "Prashant Kumar",
    role: "Student",
  },
  {
    text: "Developed 3 Responsive projects using CodePup AI where it helps to build, deploy, and automatically make websites fully responsive across all devices.It simplifies web dev",
    image: "https://ui-avatars.com/api/?name=Hemalatha&background=random",
    name: "Hemalatha Ks",
    role: "Student",
  },
  {
    text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
    image: "https://ui-avatars.com/api/?name=Ananya&background=random",
    name: "Ananya H M",
    role: "Student",
  },
  {
    text: "Created a modern, interactive portfolio website using Codepup AI to showcase projects, skills, and achievements. The AI-assisted platform ensures professional content",
    image: "https://ui-avatars.com/api/?name=Preksha&background=random",
    name: "Preksha Shiggavi",
    role: "Student",
  },
  {
    text: "I recently participated in a Codepup AI Hackathon, where I built a unique AI-powered Travel Website – WanderSphere 🚀✈️",
    image: "https://ui-avatars.com/api/?name=Shreya&background=random",
    name: "Shreya Suresh",
    role: "Student",
  },
  {
    text: " It showcases my journey as an AI/ML Engineer — highlighting my projects, internships, hackathon wins, and skills — all in a clean, responsive, and recruiter-friendly design.",
    image: "https://ui-avatars.com/api/?name=Yash&background=random",
    name: "Yash V",
    role: "Student",
  },
];

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    const getTestimonials = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/v1/getTestimonial"
        );
        if (response.data?.testimonials?.length) {
          setTestimonials(response.data.testimonials);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };
    getTestimonials();
  }, []); // 👈 Added missing dependency array

  // Split testimonials into 3 columns
  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <section className="bg-background  relative py-20">
      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col  items-center justify-center  mx-auto text-center"
        >
          <h2 className="font-montserrat text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-500 to-blue-400 bg-clip-text text-transparent  sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl ">
            What Our Users Say
          </h2>
          <p className="font-montserrat text-lg font-extralight italic mt-5 opacity-75 max-w-2xl">
            See what our customers have to say about us.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
