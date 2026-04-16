import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  images: { src: string; alt: string }[];
  className?: string;
};

export function ImageCarousel({ images, className = "" }: Props) {
  // なぜここで useEmblaCarousel？
  // Embla が「横スライドの挙動（ドラッグ/スワイプ/慣性）」を全部面倒見てくれるから
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true, // なぜ loop？ 最後まで行ったら終わり…より、繰り返し回る方が体験が良い
    align: "start",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // なぜこの callback？
  // 矢印クリックで前/次へ送る操作を Embla に委譲するため
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // なぜ selectedIndex を持つ？
  // ドット（現在位置表示）を正しく光らせるため
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect(); // 初期値
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className={`relative ${className}`}>
      {/* viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        {/* container */}
        <div className="flex">
          {images.map((img, i) => (
            // なぜ flex-[0_0_100%]？
            // 1スライド=画面幅100% に固定するため（毎回ちょうど1枚見える）
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-contain"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 矢印（PC向け） */}
      <button
        type="button"
        aria-label="previous"
        onClick={scrollPrev}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10
                   h-10 w-10 items-center justify-center rounded-full bg-white/80
                   shadow hover:bg-white"
      >
        ←
      </button>
      <button
        type="button"
        aria-label="next"
        onClick={scrollNext}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10
                   h-10 w-10 items-center justify-center rounded-full bg-white/80
                   shadow hover:bg-white"
      >
        →
      </button>

      {/* ドット */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              i === selectedIndex ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
