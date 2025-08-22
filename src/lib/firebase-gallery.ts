'use client';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { logInfo, logError } from '@/lib/logger-client';

export interface GalleryItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  lastModified: Date;
  path: string;
}

/**
 * Fetches all media files from the user's configured gallery folder in Firebase Storage
 */
export async function fetchGalleryItems(
  storage: FirebaseStorage,
  userId: string,
  galleryFolder?: string
): Promise<GalleryItem[]> {
  try {
    // Use provided gallery folder or default to demo folder
    const folderPath = galleryFolder || 'photos-demo';
    const galleryRef = ref(storage, folderPath);
    
    logInfo('Fetching gallery items from configured folder', {
      component: 'GalleryService',
      function: 'fetchGalleryItems',
      userId,
      path: folderPath,
      isCustomPath: !!galleryFolder
    });

    // List all items in the gallery folder
    const listResult = await listAll(galleryRef);
    
    // Process each item to get metadata and download URL
    const galleryItems: GalleryItem[] = await Promise.all(
      listResult.items.map(async (itemRef) => {
        try {
          const [url, metadata] = await Promise.all([
            getDownloadURL(itemRef),
            getMetadata(itemRef)
          ]);

          // Determine file type based on content type
          const contentType = metadata.contentType || '';
          const type: 'image' | 'video' = contentType.startsWith('image/') ? 'image' : 'video';

          return {
            id: itemRef.name,
            name: itemRef.name,
            url,
            type,
            size: metadata.size,
            lastModified: new Date(metadata.timeCreated),
            path: itemRef.fullPath
          };
                    } catch (error) {
              logError('Failed to process gallery item', {
                component: 'GalleryService',
                function: 'fetchGalleryItems',
                itemName: itemRef.name,
                error: String(error)
              });
              return null;
            }
      })
    );

    // Filter out failed items and sort by last modified (newest first)
    const validItems = galleryItems
      .filter((item): item is GalleryItem => item !== null)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    logInfo('Gallery items fetched successfully', {
      component: 'GalleryService',
      function: 'fetchGalleryItems',
      itemCount: validItems.length,
      imageCount: validItems.filter(item => item.type === 'image').length,
      videoCount: validItems.filter(item => item.type === 'video').length
    });

    return validItems;
  } catch (error) {
    logError('Failed to fetch gallery items', {
      component: 'GalleryService',
      function: 'fetchGalleryItems',
      userId,
      error: String(error),
      errorDetails: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Log more specific error information for debugging
    console.error('Gallery fetch error details:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code || 'no-code',
      storage: !!storage,
      path: 'photos-demo'
    });
    
    throw new Error(`Failed to load gallery items: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches a single gallery item by path
 */
export async function fetchGalleryItem(
  storage: FirebaseStorage,
  itemPath: string
): Promise<GalleryItem | null> {
  try {
    const itemRef = ref(storage, itemPath);
    const [url, metadata] = await Promise.all([
      getDownloadURL(itemRef),
      getMetadata(itemRef)
    ]);

    const contentType = metadata.contentType || '';
    const type: 'image' | 'video' = contentType.startsWith('image/') ? 'image' : 'video';

    return {
      id: itemRef.name,
      name: itemRef.name,
      url,
      type,
      size: metadata.size,
      lastModified: new Date(metadata.timeCreated),
      path: itemRef.fullPath
    };
  } catch (error) {
    logError('Failed to fetch gallery item', {
      component: 'GalleryService',
      function: 'fetchGalleryItem',
      itemPath,
      error: String(error)
    });
    return null;
  }
}
