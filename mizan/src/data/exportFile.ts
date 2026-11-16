import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Writes the export to the app cache and opens the iOS share sheet. */
export async function saveTextFile(name: string, text: string, mime = 'application/json'): Promise<void> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.writeSync(text);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: name });
}
