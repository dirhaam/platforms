'use client';

import React from 'react';
import { VideoItem } from '@/types/booking';
import { Play } from 'lucide-react';

interface VideoSectionProps {
  videos: VideoItem[];
  displayType?: 'single' | 'carousel' | 'grid';
  title?: string;
  description?: string;
  primaryColor?: string;
  // New options
  mode?: 'section' | 'inline'; // inline = no outer section/paddings
  showHeader?: boolean; // hide title/description area
  className?: string; // optional wrapper class when inline
  size?: 'small' | 'medium' | 'large';
  autoplay?: boolean;
}

const extractYoutubeId = (url: string): string => {
  // Handle various YouTube URL formats
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : url;
};

export default function VideoSection({
  videos,
  displayType = 'grid',
  title = 'Our Videos',
  description,
  primaryColor = '#0066ff',
  mode = 'section',
  showHeader = true,
  className,
  size = 'medium',
  autoplay = false,
}: VideoSectionProps) {
  if (!videos || videos.length === 0) return null;

  const activeVideos = videos.filter(v => v.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  if (activeVideos.length === 0) return null;

  const Header = showHeader && (title || description) ? (
    <div className="text-center mb-12">
      {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>}
      {description && <p className="text-xl text-gray-600 max-w-2xl mx-auto">{description}</p>}
    </div>
  ) : null;

  const baseParams = 'rel=0&modestbranding=1';
  const autoplayParams = autoplay ? '&autoplay=1&mute=1&playsinline=1' : '';
  const buildSrc = (id: string, doAutoplay: boolean) => `https://www.youtube.com/embed/${id}?${baseParams}${doAutoplay ? '&autoplay=1&mute=1&playsinline=1' : ''}`;

  const singleWidthClass = size === 'small' ? 'max-w-2xl' : size === 'large' ? 'max-w-6xl' : 'max-w-4xl';
  const gridColsClass = size === 'small'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
    : size === 'large'
    ? 'grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  const Content = (
    <>
      {displayType === 'single' && activeVideos.length > 0 && (
        <div className={`${singleWidthClass} mx-auto`}>
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src={buildSrc(extractYoutubeId(activeVideos[0].youtubeUrl), autoplay)}
              title={activeVideos[0].title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {showHeader && activeVideos[0].title && (
            <h3 className="text-xl font-semibold text-gray-900 mt-4">{activeVideos[0].title}</h3>
          )}
          {showHeader && activeVideos[0].description && (
            <p className="text-gray-600 mt-2">{activeVideos[0].description}</p>
          )}
        </div>
      )}

      {displayType === 'carousel' && activeVideos.length > 0 && (
        <div className={`${singleWidthClass} mx-auto`}>
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <iframe
              className="w-full h-full"
              src={buildSrc(extractYoutubeId(activeVideos[0].youtubeUrl), autoplay)}
              title={activeVideos[0].title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {activeVideos.length > 1 && (
            <div className="flex gap-4 mt-6 overflow-x-auto pb-2">
              {activeVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex-shrink-0 cursor-pointer group"
                >
                  <div className="relative w-24 h-14 bg-gray-200 rounded overflow-hidden">
                    <img
                      src={video.thumbnail || `https://img.youtube.com/vi/${extractYoutubeId(video.youtubeUrl)}/default.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                    <Play className="absolute inset-0 m-auto h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {displayType === 'grid' && (
        <div className={gridColsClass}>
          {activeVideos.map((video, index) => (
            <div key={video.id} className="group">
              <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <iframe
                  className="w-full h-full"
                  src={buildSrc(extractYoutubeId(video.youtubeUrl), autoplay && index === 0)}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {showHeader && video.title && (
                <h3 className="text-lg font-semibold text-gray-900 mt-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {video.title}
                </h3>
              )}
              {showHeader && video.description && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{video.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (mode === 'inline') {
    return (
      <div className={className}>
        {Header}
        {Content}
      </div>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {Header}
        {Content}
      </div>
    </section>
  );
}
