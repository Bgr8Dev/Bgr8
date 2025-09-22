/**
 * Utility function to download files from URLs (including Firebase Storage URLs)
 * @param url - The URL of the file to download
 * @param filename - The desired filename for the downloaded file
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    // Get the file as a blob
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    
    // Fallback: try to open in new tab if download fails
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    throw new Error('Download failed, opened file in new tab instead');
  }
};

/**
 * Utility function to get file extension from filename
 * @param filename - The filename
 * @returns The file extension (without the dot)
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Utility function to determine if a file should be viewed in browser or downloaded
 * @param filename - The filename
 * @returns true if file should be viewed in browser, false if it should be downloaded
 */
export const shouldViewInBrowser = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const viewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt', 'html', 'htm'];
  return viewableExtensions.includes(extension);
};
