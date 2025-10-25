import { InfiniteSlider } from "@/components/ui/infinite-slider";

export default function InfiniteSliderBasic() {
  const logos = [
    {
      src: "/flipkart.jpeg",
      alt: "Flipkart logo",
      className: "h-[60px] w-auto rounded-3xl",
    },
    {
      src: "/walmart.png",
      alt: "Walmart logo",
      className: "h-[60px] w-auto rounded-full",
    },
    {
      src: "/clearTax1.png",
      alt: "ClearTax logo",
      className: "h-[60px] w-auto rounded-full", // Made size more consistent
    },
    {
      src: "/unbox.jpeg",
      alt: "Unbox logo",
      className: "h-[60px] w-auto rounded-full",
    },
    {
      src: "/ex.jpeg",
      alt: "Express logo",
      className: "h-[60px] w-auto",
    },
    {
      src: "/azure.jpeg",
      alt: "Flipkart logo",
      className: "h-[60px] w-auto rounded-3xl",
    },
    {
      src: "/vercel.png",
      alt: "Flipkart logo",
      className: "h-[60px] w-auto rounded-3xl",
    },
  ];

  return (
    <InfiniteSlider
      gap={70} // Increased gap for breathing space
      reverse
      className="w-full h-full  py-8" // Softer background and padding
      itemClassName="mx-6" // More space between logos
    >
      {logos.map((logo, index) => (
        <img
          key={index}
          src={logo.src}
          alt={logo.alt}
          className={logo.className}
          loading="lazy"
        />
      ))}
    </InfiniteSlider>
  );
}
