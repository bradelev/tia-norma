export interface MediaStore {
  /** Stores an image and returns the URL the page and WhatsApp can load it from. */
  save(bytes: Uint8Array, contentType: string): Promise<string>;
}
