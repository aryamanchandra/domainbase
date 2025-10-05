export const copyToClipboard = async (
  text: string,
  onSuccess?: (id: string) => void,
  id?: string
): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    if (onSuccess && id) {
      onSuccess(id);
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};

