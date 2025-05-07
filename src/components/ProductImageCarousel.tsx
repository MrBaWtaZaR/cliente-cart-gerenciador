
import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Image, GalleryHorizontal } from 'lucide-react';

interface ProductImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
}

export const ProductImageCarousel = ({
  images,
  autoPlayInterval = 5000,
}: ProductImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const validImages = images.filter(img => img !== '/placeholder.svg');
  
  // Auto-play functionality
  useState(() => {
    if (validImages.length <= 1 || autoPlayInterval <= 0) return;
    
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % validImages.length);
    }, autoPlayInterval);
    
    return () => clearInterval(timer);
  });

  if (!validImages.length) {
    return (
      <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
        <Image className="h-10 w-10 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div className="relative group">
      <Carousel className="w-full">
        <CarouselContent>
          {validImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="aspect-square bg-muted rounded-md overflow-hidden">
                <img 
                  src={image} 
                  alt={`Product image ${index + 1}`} 
                  className="h-full w-full object-cover transition-all hover:scale-105 duration-300"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {validImages.length > 1 && (
          <>
            <CarouselPrevious className="left-2 group-hover:opacity-100 opacity-0" />
            <CarouselNext className="right-2 group-hover:opacity-100 opacity-0" />
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center">
              <GalleryHorizontal size={12} className="mr-1" />
              {validImages.length} imagens
            </div>
          </>
        )}
      </Carousel>
    </div>
  );
};
