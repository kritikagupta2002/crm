import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/*
 * A workbook built on the phone: written to the cache and handed to the share sheet, so it can go
 * on WhatsApp or mail, or be saved to Files / Drive. In the browser preview it downloads instead.
 */
export async function saveWorkbook(bytes: Uint8Array, filename: string): Promise<string> {
  const name = filename.replace(/[\\/:*?"<>|]/g, '_');
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: XLSX }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: XLSX, UTI: 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: name });
  }
  return file.uri;
}
