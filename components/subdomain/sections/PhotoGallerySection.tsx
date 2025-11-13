'use client';

import React, { useState } from 'react';
import { PhotoGallery, PhotoGalleryItem } from '@/types/booking';
import { X } from 'lucide-react';
import Image from 'next/image';

interface PhotoGallerySectionProps {
  gallery: PhotoGallery;
  primaryColor?: string;
}

export default function PhotoGallerySection({
  gallery,
  primaryColor = '#0066ff'
}: PhotoGallerySectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGalleryItem | null>(null);

  if (!gallery || gallery.photos.length === 0) return null;

  const activePhotos = gallery.photos
    .filter(p => p.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (activePhotos.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {(gallery.title || gallery.description) && (
          <div className="text-center mb-12">
            {gallery.title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{gallery.title}</h2>}
            {gallery.description && <p className="text-xl text-gray-600 max-w-2xl mx-auto">{gallery.description}</p>}
          </div>
        )}

        {/* Grid Display */}
        {gallery.displayType === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePhotos.map((photo) => (
              <div
                key={photo.id}
                className="group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.alt || photo.caption}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                {photo.caption && (
                  <div className="p-4 bg-white">
                    <p className="text-gray-900 font-medium line-clamp-2">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Masonry Display */}
        {gallery.displayType === 'masonry' && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {activePhotos.map((photo) => (
              <div
                key={photo.id}
                className="group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow break-inside-avoid"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative bg-gray-200 overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.alt || photo.caption}
                    className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                {photo.caption && (
                  <div className="p-4 bg-white">
                    <p className="text-gray-900 font-medium line-clamp-2">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Carousel Display */}
        {gallery.displayType === 'carousel' && (
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                {selectedPhoto ? (
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.alt || selectedPhoto.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activePhotos[0].url}
                    alt={activePhotos[0].alt || activePhotos[0].caption}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {(selectedPhoto || activePhotos[0]).caption && (
                <div className="mt-4 text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {(selectedPhoto || activePhotos[0]).caption}
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            <div className="flex gap-3 mt-8 overflow-x-auto pb-2">
              {activePhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhoto?.id === photo.id || (!selectedPhoto && index === 0)
                      ? 'border-gray-900 scale-105'
                      : 'border-gray-300 hover:border-gray-600'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt || photo.caption}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.alt || selectedPhoto.caption}
              className="w-full h-auto rounded-lg max-h-screen object-contain"
            />
            {selectedPhoto.caption && (
              <div className="mt-4 text-center text-white">
                <p className="text-lg font-medium">{selectedPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
