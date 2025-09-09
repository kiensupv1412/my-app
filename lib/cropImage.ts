export default function getCroppedImg(imageSrc: string, crop: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Không thể render canvas');

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject('Lỗi khi crop ảnh');
        resolve(blob);
      }, 'image/jpeg');
    };

    image.onerror = () => reject('Lỗi tải ảnh');
  });
}
