export const feedbackFileFromBlob = (
  blob: Blob,
  filename: string,
  mimeType?: string,
): File => {
  const type = mimeType ?? blob.type ?? 'application/octet-stream'
  return new File([blob], filename, { type })
}

export const readFileAsImageFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image.')
  }
  return file
}

export const collectClipboardImages = (
  clipboard: DataTransfer,
): readonly File[] => {
  const files: File[] = []
  if (clipboard.files?.length) {
    for (const file of Array.from(clipboard.files)) {
      if (file.type.startsWith('image/')) {
        files.push(file)
      }
    }
  }
  return files
}
