let photo: File | null = null;

export function setPhoto(file: File) {
  photo = file;
}

export function getPhoto(): File | null {
  const file = photo;
  photo = null;
  return file;
}
