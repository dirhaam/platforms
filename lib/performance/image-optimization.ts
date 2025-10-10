import sharp from 'sharp';

import { promises as fs } from 'fs';
import path from 'path';

// Image optimization configuration
export const IMAGE_CONFIG = {
  FORMATS: {
    WEBP: 'webp',
    AVIF: 'avif',
    JPEG: 'jpeg',
    PNG: 'png',
  },
  SIZES: {
    THUMBNAIL: { width: 150, height: 150 },
    SMALL: { width: 300, height: 300 },
    MEDIUM: { width: 600, height: 600 },
    LARGE: { width: 1200, height: 1200 },
    ORIGINAL: null, // Keep original size
  },
  QUALITY: {
    WEBP: 80,
    AVIF: 75,
    JPEG: 85,
    PNG: 90,
  },
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  CDN_BASE_URL: process.env.CDN_BASE_URL || '',
} as const;

export interface ImageOptimizationOptions {
  format?: keyof typeof IMAGE_CONFIG.FORMATS;
  quality?: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  progressive?: boolean;
  lossless?: boolean;
}

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

export interface ImageVariant {
  size: string;
  url: string;
  width: number;
  height: number;
  format: string;
  fileSize: number;
}

export class ImageOptimization {
  // Validate image file
  static validateImage(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: `Unsupported image format. Allowed formats: ${IMAGE_CONFIG.ALLOWED_TYPES.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    return { isValid: true };
  }

  // Optimize single image
  static async optimizeImage(
    inputBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      format = 'WEBP',
      quality = IMAGE_CONFIG.QUALITY[format as keyof typeof IMAGE_CONFIG.QUALITY],
      width,
      height,
      fit = 'cover',
      progressive = true,
      lossless = false,
    } = options;

    let pipeline = sharp(inputBuffer);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit });
    }

    // Apply format-specific optimizations
    switch (format) {
      case 'WEBP':
        pipeline = pipeline.webp({
          quality,
          lossless,
        });
        break;
      case 'AVIF':
        pipeline = pipeline.avif({
          quality,
          lossless,
        });
        break;
      case 'JPEG':
        pipeline = pipeline.jpeg({
          quality,
          progressive,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        });
        break;
      case 'PNG':
        pipeline = pipeline.png({
          quality,
          progressive,
          compressionLevel: 9,
        });
        break;
    }

    const optimizedBuffer = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      buffer: optimizedBuffer.data,
      format: format.toLowerCase(),
      width: optimizedBuffer.info.width,
      height: optimizedBuffer.info.height,
      size: optimizedBuffer.info.size,
    };
  }

  // Generate multiple image variants
  static async generateImageVariants(
    inputBuffer: Buffer,
    baseFilename: string,
    formats: (keyof typeof IMAGE_CONFIG.FORMATS)[] = ['WEBP', 'JPEG']
  ): Promise<ImageVariant[]> {
    const variants: ImageVariant[] = [];

    for (const sizeName of Object.keys(IMAGE_CONFIG.SIZES)) {
      const sizeConfig = IMAGE_CONFIG.SIZES[sizeName as keyof typeof IMAGE_CONFIG.SIZES];
      
      for (const format of formats) {
        try {
          const optimized = await this.optimizeImage(inputBuffer, {
            format,
            width: sizeConfig?.width,
            height: sizeConfig?.height,
          });

          const filename = `${baseFilename}_${sizeName.toLowerCase()}.${optimized.format}`;
          
          // In a real implementation, you would upload to your storage service here
          // For now, we'll just create the variant metadata
          variants.push({
            size: sizeName.toLowerCase(),
            url: `${IMAGE_CONFIG.CDN_BASE_URL}/${filename}`,
            width: optimized.width,
            height: optimized.height,
            format: optimized.format,
            fileSize: optimized.size,
          });
        } catch (error) {
          console.error(`Failed to generate ${format} variant for size ${sizeName}:`, error);
        }
      }
    }

    return variants;
  }

  // Generate responsive image srcset
  static generateSrcSet(variants: ImageVariant[]): string {
    return variants
      .filter(variant => variant.width > 0)
      .sort((a, b) => a.width - b.width)
      .map(variant => `${variant.url} ${variant.width}w`)
      .join(', ');
  }

  // Generate sizes attribute for responsive images
  static generateSizes(breakpoints: { [key: string]: number } = {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
  }): string {
    const sizes = Object.entries(breakpoints)
      .sort(([, a], [, b]) => a - b)
      .map(([name, width], index, array) => {
        if (index === array.length - 1) {
          return `${width}px`; // Last breakpoint doesn't need media query
        }
        return `(max-width: ${width}px) ${width}px`;
      });

    return sizes.join(', ');
  }

  // Extract image metadata
  static async getImageMetadata(inputBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    colorSpace: string;
  }> {
    const metadata = await sharp(inputBuffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: inputBuffer.length,
      hasAlpha: metadata.hasAlpha || false,
      colorSpace: metadata.space || 'unknown',
    };
  }

  // Compress image for web
  static async compressForWeb(
    inputBuffer: Buffer,
    targetSizeKB?: number
  ): Promise<OptimizedImage> {
    let quality = 85;
    let optimized: OptimizedImage;

    // If target size specified, iteratively reduce quality
    if (targetSizeKB) {
      const targetSizeBytes = targetSizeKB * 1024;
      
      do {
        optimized = await this.optimizeImage(inputBuffer, {
          format: 'WEBP',
          quality,
        });
        
        if (optimized.size <= targetSizeBytes || quality <= 20) {
          break;
        }
        
        quality -= 10;
      } while (quality > 20);
    } else {
      optimized = await this.optimizeImage(inputBuffer, {
        format: 'WEBP',
        quality: 80,
      });
    }

    return optimized;
  }

  // Create thumbnail
  static async createThumbnail(
    inputBuffer: Buffer,
    size: number = 150
  ): Promise<OptimizedImage> {
    return await this.optimizeImage(inputBuffer, {
      format: 'WEBP',
      width: size,
      height: size,
      fit: 'cover',
      quality: 75,
    });
  }

  // Watermark image
  static async addWatermark(
    inputBuffer: Buffer,
    watermarkBuffer: Buffer,
    options: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
      scale?: number;
    } = {}
  ): Promise<Buffer> {
    const {
      position = 'bottom-right',
      opacity = 0.5,
      scale = 0.1,
    } = options;

    const image = sharp(inputBuffer);
    const { width: imageWidth, height: imageHeight } = await image.metadata();

    if (!imageWidth || !imageHeight) {
      throw new Error('Unable to get image dimensions');
    }

    // Resize watermark based on scale
    const watermarkSize = Math.min(imageWidth, imageHeight) * scale;
    const resizedWatermark = await sharp(watermarkBuffer)
      .resize(watermarkSize, watermarkSize, { fit: 'inside' })
      .png({ palette: true })
      .toBuffer();

    // Calculate position
    const { width: watermarkWidth, height: watermarkHeight } = await sharp(resizedWatermark).metadata();
    
    if (!watermarkWidth || !watermarkHeight) {
      throw new Error('Unable to get watermark dimensions');
    }

    let left = 0;
    let top = 0;

    switch (position) {
      case 'top-left':
        left = 20;
        top = 20;
        break;
      case 'top-right':
        left = imageWidth - watermarkWidth - 20;
        top = 20;
        break;
      case 'bottom-left':
        left = 20;
        top = imageHeight - watermarkHeight - 20;
        break;
      case 'bottom-right':
        left = imageWidth - watermarkWidth - 20;
        top = imageHeight - watermarkHeight - 20;
        break;
      case 'center':
        left = (imageWidth - watermarkWidth) / 2;
        top = (imageHeight - watermarkHeight) / 2;
        break;
    }

    return await image
      .composite([{
        input: resizedWatermark,
        left: Math.round(left),
        top: Math.round(top),
        blend: 'over',
      }])
      .toBuffer();
  }

  // Convert to progressive JPEG
  static async convertToProgressiveJPEG(inputBuffer: Buffer): Promise<Buffer> {
    return await sharp(inputBuffer)
      .jpeg({
        progressive: true,
        quality: 85,
        mozjpeg: true,
      })
      .toBuffer();
  }

  // Remove EXIF data for privacy
  static async removeExifData(inputBuffer: Buffer): Promise<Buffer> {
    return await sharp(inputBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .toBuffer();
  }

  // Batch process images
  static async batchOptimize(
    images: { buffer: Buffer; filename: string }[],
    options: ImageOptimizationOptions = {}
  ): Promise<{ filename: string; optimized: OptimizedImage; error?: string }[]> {
    const results = await Promise.allSettled(
      images.map(async ({ buffer, filename }) => {
        const optimized = await this.optimizeImage(buffer, options);
        return { filename, optimized };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          filename: images[index].filename,
          optimized: {} as OptimizedImage,
          error: result.reason.message,
        };
      }
    });
  }

  // Calculate compression savings
  static calculateSavings(originalSize: number, optimizedSize: number): {
    savedBytes: number;
    savedPercentage: number;
    compressionRatio: number;
  } {
    const savedBytes = originalSize - optimizedSize;
    const savedPercentage = (savedBytes / originalSize) * 100;
    const compressionRatio = originalSize / optimizedSize;

    return {
      savedBytes,
      savedPercentage: Math.round(savedPercentage * 100) / 100,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
    };
  }
}