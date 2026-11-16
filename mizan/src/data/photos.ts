/**
 * Private progress photos (iOS/Android). The picked image is copied into the
 * app's document directory; the record stores only that local URI.
 * Real Device Validation: not yet tested on a physical iPhone.
 */
import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export const photosSupported = true;

export async function pickPhoto(): Promise<{ uri: string } | { error: 'denied' | 'cancelled' | 'failed' }> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'denied' };
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
  if (res.canceled || !res.assets?.[0]) return { error: 'cancelled' };
  try {
    const dir = new Directory(Paths.document, 'progress-photos');
    if (!dir.exists) dir.create();
    const dest = new File(dir, `${Crypto.randomUUID()}.jpg`);
    await new File(res.assets[0].uri).copy(dest);
    return { uri: dest.uri };
  } catch {
    return { error: 'failed' };
  }
}

export function deletePhotoFile(uri: string) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // already gone
  }
}
