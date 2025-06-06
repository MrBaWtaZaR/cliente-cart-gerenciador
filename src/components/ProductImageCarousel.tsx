
import { useState, useEffect, useRef } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Image, GalleryHorizontal, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
}

export const ProductImageCarousel = ({
  images,
  autoPlayInterval = 5000,
}: ProductImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasError, setHasError] = useState<Record<string, boolean>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<number | null>(null);
  
  // Filter out placeholders and images with loading errors
  const validImages = images
    .filter(img => img !== '/placeholder.svg')
    .filter(img => !hasError[img]);

  // Check if images have loaded after component mounts
  useEffect(() => {
    // Set images loaded with a small delay to allow for rendering
    const timer = setTimeout(() => {
      setImagesLoaded(true);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle image error
  const handleImageError = (image: string) => {
    console.log(`Image load error for: ${image}`);
    setHasError(prev => ({ ...prev, [image]: true }));
    
    // Only show toast for the first error to prevent spam
    const errorCount = Object.keys(hasError).length;
    if (errorCount === 0) {
      toast.error('Não foi possível carregar algumas imagens', {
        description: 'Verifique sua conexão ou tente novamente mais tarde.'
      });
    }
  };

  // Auto-play functionality with proper cleanup
  useEffect(() => {
    if (validImages.length <= 1 || autoPlayInterval <= 0 || isPaused) {
      // Clear any existing interval when not needed
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = window.setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % validImages.length);
    }, autoPlayInterval);
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [validImages.length, autoPlayInterval, isPaused]);

  if (isLoading) {
    return (
      <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center">
        <div className="animate-pulse w-full h-full bg-muted-foreground/10"></div>
      </div>
    );
  }

  if (!validImages.length) {
    return (
      <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center">
        <Image className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm mt-2">Sem imagens disponíveis</p>
      </div>
    );
  }

  return (
    <div 
      className="relative group" 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel className="w-full">
        <CarouselContent>
          {validImages.map((image, index) => (
            <CarouselItem key={`image-${index}-${image}`}>
              <div className="aspect-square bg-muted rounded-md overflow-hidden">
                <img 
                  src={image} 
                  alt={`Imagem do produto ${index + 1}`}
                  className="h-full w-full object-cover transition-all hover:scale-105 duration-300"
                  onError={() => handleImageError(image)}
                  onLoad={() => setIsLoading(false)}
                  loading="lazy"
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
