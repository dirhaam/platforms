'use client';

import React, { useState } from 'react';
import { VideoItem } from '@/types/booking';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoCarouselProps {
  videos: VideoItem[];
  primaryColor?: string;
  size?: 'small' | 'medium' | 'large';
  autoplay?: boolean;
  showTitle?: boolean;
}

const extractYoutubeId = (url: string): string => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : url;
};

export default function VideoCarousel({
  videos,
  primaryColor = '#1f3447',
  size = 'medium',
  autoplay = false,
  showTitle = false,
}: VideoCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!videos || videos.length === 0) return null;

  const activeVideos = videos
    .filter(v => v.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (activeVideos.length === 0) return null;

  // Show 2 videos per page
  const videosPerPage = 2;
  const totalPages = Math.ceil(activeVideos.length / videosPerPage);
  const startIndex = currentPage * videosPerPage;
  const displayedVideos = activeVideos.slice(startIndex, startIndex + videosPerPage);

  const baseParams = 'rel=0&modestbranding=1';
  const buildSrc = (id: string) => 
    `https://www.youtube.com/embed/${id}?${baseParams}${autoplay ? '&autoplay=1&mute=1&playsinline=1' : ''}`;

  const containerClass = size === 'small' ? 'gap-4' : size === 'large' ? 'gap-8' : 'gap-6';
  const aspectRatioClass = 'aspect-video';

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <section className="w-full">
      {/* Video Grid - 2 columns, or full width for single video */}
      <div className={`grid ${activeVideos.length === 1 ? 'grid-cols-1' : `grid-cols-1 md:grid-cols-2`} ${containerClass} mb-6`}>
        {displayedVideos.map((video, index) => (
          <div key={video.id} className="group">
            <div className={`relative w-full ${aspectRatioClass} bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow`}>
              <iframe
                className="w-full h-full"
                src={buildSrc(extractYoutubeId(video.youtubeUrl))}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {showTitle && video.title && (
              <h3 className="text-base font-semibold text-slate-900 mt-3 line-clamp-2">
                {video.title}
              </h3>
            )}
            {showTitle && video.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {video.description}
              </p>
            )}
          </div>
        ))}
        
        {/* If only 1 video and it's on an odd position, add padding */}
        {displayedVideos.length === 1 && activeVideos.length === 1 && (
          <div className="hidden md:block" />
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            className="rounded-lg"
            style={{ 
              borderColor: primaryColor,
              color: primaryColor
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Page Indicators */}
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentPage ? 'w-6' : 'w-2'
                }`}
                style={{
                  backgroundColor: idx === currentPage ? primaryColor : '#d1d5db'
                }}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="rounded-lg"
            style={{ 
              borderColor: primaryColor,
              color: primaryColor
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </section>
  );
}
