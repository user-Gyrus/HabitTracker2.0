import { ImageWithFallback } from './figma/ImageWithFallback';

interface MentalModelCardProps {
  image: string;
  duration: string;
  title: string;
  subtitle: string;
}

export function MentalModelCard({ image, duration, title, subtitle }: MentalModelCardProps) {
  return (
    <div className="flex-shrink-0 w-48 bg-[#2a1f19] rounded-2xl overflow-hidden">
      <div className="relative h-28">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-xs text-white rounded-full">
          {duration}
        </span>
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs text-[#8a7a6e] line-clamp-2">{subtitle}</p>
      </div>
    </div>
  );
}
