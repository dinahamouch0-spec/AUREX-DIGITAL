/** Web build: progress photos are not offered (no private on-device file store). */
export const photosSupported = false;
export async function pickPhoto(): Promise<{ uri: string } | { error: 'denied' | 'cancelled' | 'failed' }> {
  return { error: 'failed' };
}
export function deletePhotoFile(_uri: string) {}
