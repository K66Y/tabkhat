// Keep uploads small enough for the current Firestore account document layout.
export async function prepareRecipeImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) throw new Error('اختر صورة أقل من 15 ميجابايت.');
  const url = URL.createObjectURL(file);
  try {
    const picture = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('تعذر فتح الصورة. جرّب صورة JPEG أو PNG.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, 640 / Math.max(picture.width, picture.height));
    canvas.width = Math.max(1, Math.round(picture.width * ratio));
    canvas.height = Math.max(1, Math.round(picture.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة.');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(picture, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.75, 0.55, 0.35]) {
      const data = canvas.toDataURL('image/jpeg', quality);
      if (data.length < 85_000) return data;
    }
    throw new Error('الصورة كبيرة بعد ضغطها. اختر صورة أصغر.');
  } finally { URL.revokeObjectURL(url); }
}
