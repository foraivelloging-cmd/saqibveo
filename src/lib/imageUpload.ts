
const IMAGEKIT_PUBLIC = "public_W8pXprjPHYrYwlWMf811dtUm2Og=";
const IMAGEKIT_PRIVATE = "private_Wu/w/ZEmydjv/FbRgVKOffRxtNY=";
const IMGBB_API_KEY = 'a26bed1b2fd07ba03bff75343d0834fe';

/**
 * Uploads a base64 or blob image to ImgBB or ImageKit.
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(dataUrl: string): Promise<string | null> {
  try {
    // Convert dataUrl to a Blob for upload
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const extension = blob.type.split('/')[1] || 'jpg';
    
    // Try ImgBB first (reliable for simple uploads)
    try {
      const formData = new FormData();
      formData.append('image', blob, `capture_${Date.now()}.${extension}`);
      
      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      if (imgbbRes.ok) {
        const data = await imgbbRes.json();
        if (data.success) return data.data.url;
      }
    } catch (e) {
      console.warn("ImgBB upload failed, trying ImageKit fallback", e);
    }

    // Fallback to ImageKit
    try {
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('fileName', `capture_${Date.now()}.${extension}`);
      formData.append('publicKey', IMAGEKIT_PUBLIC);
      formData.append('useUniqueFileName', 'true');

      const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: { 
          'Authorization': 'Basic ' + btoa(IMAGEKIT_PRIVATE + ':') 
        },
        body: formData
      });

      if (ikRes.ok) {
        const data = await ikRes.json();
        return data.url;
      }
    } catch (e) {
      console.warn("ImageKit fallback failed too", e);
    }

    return null;
  } catch (err) {
    console.error("Image upload utility failed:", err);
    return null;
  }
}
