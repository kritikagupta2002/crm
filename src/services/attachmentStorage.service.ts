import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StoredAttachment } from '../types';

const ATTACHMENT_DIR = `${FileSystem.documentDirectory}hrms_attachments/`;

class AttachmentStorageService {
  /**
   * Ensures the hrms_attachments directory exists on native disk.
   */
  async ensureDirExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(ATTACHMENT_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ATTACHMENT_DIR, { intermediates: true });
      }
    } catch (err) {
      console.warn('Failed to create attachment directory:', err);
    }
  }

  /**
   * Format bytes into a readable string (e.g. "2.4 MB" or "850 KB")
   */
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  }

  /**
   * Compresses image using expo-image-manipulator (max 1600px, 0.85 quality),
   * strictly mirroring web attachmentStorage.compressImageFile.
   */
  async compressImage(uri: string, maxDimension: number = 1600, quality: number = 0.85): Promise<string> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxDimension } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (e) {
      console.warn('Image manipulation failed, falling back to original uri:', e);
      return uri;
    }
  }

  /**
   * Saves a picked file or camera image to the persistent hrms_attachments directory.
   */
  async saveAttachment(
    sourceUri: string,
    originalFileName: string,
    mimeType?: string
  ): Promise<StoredAttachment | null> {
    try {
      await this.ensureDirExists();

      const attachmentId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const sanitizedName = (originalFileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = `${ATTACHMENT_DIR}${attachmentId}_${sanitizedName}`;

      const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(sanitizedName);

      let effectiveSourceUri = sourceUri;
      if (isImage) {
        effectiveSourceUri = await this.compressImage(sourceUri);
      }

      await FileSystem.copyAsync({
        from: effectiveSourceUri,
        to: targetPath,
      });

      const fileInfo = await FileSystem.getInfoAsync(targetPath);
      const sizeBytes = (fileInfo as any).size || 0;

      return {
        id: attachmentId,
        fileName: originalFileName || sanitizedName,
        fileSize: sizeBytes,
        fileSizeFormatted: this.formatFileSize(sizeBytes),
        mimeType: mimeType || (isImage ? 'image/jpeg' : 'application/pdf'),
        fileUri: targetPath,
        createdAt: Date.now(),
      };
    } catch (err) {
      console.error('attachmentStorage.saveAttachment error:', err);
      return null;
    }
  }

  /**
   * Native file picker using expo-document-picker.
   * Allowed types: PDF, PNG, JPG, JPEG (and Office documents).
   */
  async pickDocument(allowedTypes: string[] = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']): Promise<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        return {
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
          mimeType: file.mimeType || 'application/pdf',
        };
      }
      return null;
    } catch (err) {
      console.warn('Error picking document:', err);
      return null;
    }
  }

  /**
   * Pick an image from photo library using expo-image-picker.
   */
  async pickImageFromLibrary(): Promise<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `kyc_photo_${Date.now()}.jpg`;
        return {
          uri: asset.uri,
          name: fileName,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || 'image/jpeg',
        };
      }
      return null;
    } catch (err) {
      console.warn('Error picking image from library:', err);
      return null;
    }
  }

  /**
   * Capture a new scan/photo using the device camera.
   */
  async takePhoto(): Promise<{
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  } | null> {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Camera permission is required to photograph credentials.');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = `kyc_scan_${Date.now()}.jpg`;
        return {
          uri: asset.uri,
          name: fileName,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || 'image/jpeg',
        };
      }
      return null;
    } catch (err) {
      console.warn('Error taking photo:', err);
      return null;
    }
  }

  /**
   * Opens or shares the attachment using native operating system sharing / view intent.
   */
  async openOrShareAttachment(fileUri: string, fileName?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Sharing is not available on this platform/device');
        return false;
      }

      // Check if file exists locally
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return false;
      }

      await Sharing.shareAsync(fileUri, {
        dialogTitle: fileName ? `Open ${fileName}` : 'Open Document',
        mimeType: fileName?.endsWith('.pdf') ? 'application/pdf' : undefined,
      });
      return true;
    } catch (err) {
      console.warn('Error sharing attachment:', err);
      return false;
    }
  }

  /**
   * Deletes a local attachment file from disk.
   */
  async deleteAttachment(fileUri?: string): Promise<void> {
    if (!fileUri) return;
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } catch (err) {
      console.warn('Failed to delete attachment from disk:', err);
    }
  }
}

export const attachmentStorage = new AttachmentStorageService();
