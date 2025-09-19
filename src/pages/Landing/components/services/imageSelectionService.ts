// imageSelectionService.ts

export function processSelectedImages(
  prevSelected: File[],
  newlySelected: File[],
  maxImages: number = 5,
  showToast: (msg: string, type: "success" | "error") => void
): File[] {
  const availableSlots = maxImages - prevSelected.length;

  if (availableSlots <= 0) {
    showToast(
      "You can add only 5 images. Remove existing to add more",
      "error"
    );
    return prevSelected;
  }

  if (prevSelected.length === 0 && newlySelected.length > maxImages) {
    showToast("Only 5 images were selected.", "error");
  } else if (newlySelected.length > availableSlots) {
    showToast(
      "You can add only 5 images. Remove existing to add more",
      "error"
    );
  }

  const filesToAdd = newlySelected.slice(0, availableSlots);
  return [...prevSelected, ...filesToAdd];
}
