import { useEffect, useRef, useState } from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-up-lg" | "fade-in" | "scale";
  /** スタッガー用の遅延（ms） */
  delay?: number;
}

const motionEase = [0.16, 1, 0.3, 1]; // すっと止まるイージング

/**
 * Animated Section Component
 * ビューポートに入ったらふわっと表示（少しスケール＋フェードで格好良く）
 */
export function AnimatedSection({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const animationClasses = {
    "fade-up": isVisible
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 translate-y-8 scale-[0.98]",
    "fade-up-lg": isVisible
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 translate-y-12 scale-[0.98]",
    "fade-in": isVisible ? "opacity-100" : "opacity-0",
    scale: isVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]",
  };

  return (
    <div
      ref={ref}
      className={`animate-section transition-all duration-[1200ms] ${animationClasses[animation]} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: `cubic-bezier(${motionEase.join(",")})`,
      }}
    >
      {children}
    </div>
  );
}
