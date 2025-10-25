"use client";

import { cn } from "@/lib/utils";
import { useMotionValue, animate, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import useMeasure from "react-use-measure";

type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
  itemClassName?: string; // NEW: For wrapping children with extra spacing
};

export function InfiniteSlider({
  children,
  gap = 32, // Default wider gap
  duration = 25,
  durationOnHover,
  direction = "horizontal",
  reverse = false,
  className,
  itemClassName = "mx-6", // NEW: default spacing per logo
}: InfiniteSliderProps) {
  const [currentDuration, setCurrentDuration] = useState(duration);
  const [ref, { width, height }] = useMeasure();
  const translation = useMotionValue(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let controls;
    const size = direction === "horizontal" ? width : height;
    if (!size) return;

    const contentSize = size + gap;
    const from = reverse ? -contentSize / 2 : 0;
    const to = reverse ? 0 : -contentSize / 2;

    if (isTransitioning) {
      const distance = Math.abs(translation.get() - to);
      const transitionDuration = currentDuration * (distance / contentSize);
      controls = animate(translation, [translation.get(), to], {
        ease: "linear",
        duration: transitionDuration,
        onComplete: () => {
          setIsTransitioning(false);
          setKey((prevKey) => prevKey + 1);
        },
      });
    } else {
      controls = animate(translation, [from, to], {
        ease: "linear",
        duration: currentDuration,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0,
        onRepeat: () => {
          translation.set(from);
        },
      });
    }
    return () => controls?.stop();
  }, [
    key,
    translation,
    currentDuration,
    width,
    height,
    gap,
    isTransitioning,
    direction,
    reverse,
  ]);

  const handleHoverStart = useCallback(() => {
    if (durationOnHover) {
      setIsTransitioning(true);
      setCurrentDuration(durationOnHover);
    }
  }, [durationOnHover]);

  const handleHoverEnd = useCallback(() => {
    if (durationOnHover) {
      setIsTransitioning(true);
      setCurrentDuration(duration);
    }
  }, [durationOnHover, duration]);

  const hoverProps = durationOnHover
    ? {
        onHoverStart: handleHoverStart,
        onHoverEnd: handleHoverEnd,
      }
    : {};

  // Wrap each child with extra margin/padding for perfect spacing
  const wrappedChildren = (
    <>
      {Array.isArray(children) ? (
        children.map((child, idx) => (
          <div key={idx} className={itemClassName}>
            {child}
          </div>
        ))
      ) : (
        <div className={itemClassName}>{children}</div>
      )}
    </>
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className={cn(
          direction === "horizontal"
            ? "flex w-max flex-row"
            : "flex flex-col h-max"
        )}
        style={{
          ...(direction === "horizontal"
            ? { x: translation }
            : { y: translation }),
          gap: `${gap}px`,
        }}
        ref={ref}
        {...hoverProps}
      >
        {wrappedChildren}
        {wrappedChildren}
      </motion.div>
    </div>
  );
}
