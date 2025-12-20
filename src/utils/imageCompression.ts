/**
 * Compresses an image file using Canvas API
 * @param file - The original image file
 * @param maxWidth - Maximum width (default 1920px)
 * @param maxHeight - Maximum height (default 1080px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed image as a File
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip compression for non-image files or small files (< 100KB)
    if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
      resolve(file)
      return
    }

    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          // Create new file with same name
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          // If compressed is larger, return original
          if (compressedFile.size >= file.size) {
            resolve(file)
          }
          else {
            resolve(compressedFile)
          }
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Read file as data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}
