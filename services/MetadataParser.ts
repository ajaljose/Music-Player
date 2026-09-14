import { Song } from '../types';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
const jsmediatags = require('jsmediatags/dist/jsmediatags.min.js');

/**
 * Format milliseconds into MM:SS format
 */
export function formatDuration(millis: number): string {
  if (!millis || isNaN(millis) || millis <= 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Extract clean display title from filename
 */
export function cleanTitleFromFilename(filename: string): { title: string; artist: string } {
  let nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  nameWithoutExt = nameWithoutExt.replace(/_/g, ' ');

  if (nameWithoutExt.includes(' - ')) {
    const parts = nameWithoutExt.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }

  return {
    title: nameWithoutExt.trim(),
    artist: 'Unknown Artist',
  };
}

/**
 * Extract embedded APIC / PIC cover art from ID3 tags in binary buffer fallback
 */
export function extractEmbeddedArtworkFromBuffer(buffer: Buffer): { dataUri: string; mimeType: string } | null {
  try {
    const bufferStr = buffer.toString('binary');

    // 1. Look for APIC (ID3v2.3 / ID3v2.4) or PIC (ID3v2.2)
    let apicPos = bufferStr.indexOf('APIC');
    if (apicPos === -1) {
      apicPos = bufferStr.indexOf('PIC');
    }

    let imageStart = -1;
    let imageType = 'jpeg';

    if (apicPos !== -1) {
      // Search for JPEG magic bytes (FF D8 FF) or PNG magic bytes (89 50 4E 47) after APIC frame
      const maxSearch = Math.min(buffer.length - 4, apicPos + 500000);
      for (let i = apicPos; i < maxSearch; i++) {
        if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
          imageStart = i;
          imageType = 'jpeg';
          break;
        }
        if (buffer[i] === 0x89 && buffer[i + 1] === 0x50 && buffer[i + 2] === 0x4E && buffer[i + 3] === 0x47) {
          imageStart = i;
          imageType = 'png';
          break;
        }
      }
    }

    // Fallback: search initial ID3 header buffer for JPEG/PNG image bytes
    if (imageStart === -1 && buffer.length > 10) {
      for (let i = 10; i < Math.min(buffer.length - 4, 300000); i++) {
        if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
          imageStart = i;
          imageType = 'jpeg';
          break;
        }
        if (buffer[i] === 0x89 && buffer[i + 1] === 0x50 && buffer[i + 2] === 0x4E && buffer[i + 3] === 0x47) {
          imageStart = i;
          imageType = 'png';
          break;
        }
      }
    }

    if (imageStart !== -1) {
      let imageEnd = -1;
      if (imageType === 'jpeg') {
        for (let j = imageStart + 100; j < Math.min(buffer.length - 2, imageStart + 1500000); j++) {
          if (buffer[j] === 0xFF && buffer[j + 1] === 0xD9) {
            imageEnd = j + 2;
            break;
          }
        }
      }

      const imgBuffer = imageEnd !== -1 
        ? buffer.slice(imageStart, imageEnd)
        : buffer.slice(imageStart, Math.min(buffer.length, imageStart + 400000));

      if (imgBuffer.length > 500) {
        const mimeType = `image/${imageType}`;
        return {
          dataUri: `data:${mimeType};base64,${imgBuffer.toString('base64')}`,
          mimeType,
        };
      }
    }
  } catch (err) {
    console.warn('[MetadataParser] Error in APIC fallback scanner:', err);
  }

  return null;
}

/**
 * Parse ID3 tags from buffer using jsmediatags
 */
function parseWithJsmediatags(buffer: Buffer): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  artworkDataUri?: string | null;
  mimeType?: string | null;
}> {
  return new Promise((resolve) => {
    try {
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      new jsmediatags.Reader(arrayBuffer)
        .setTagsToRead(['title', 'artist', 'album', 'year', 'picture'])
        .read({
          onSuccess: (tag: any) => {
            const tags = tag.tags;
            let artworkDataUri: string | null = null;
            let mimeType: string | null = null;

            if (tags.picture) {
              const format = (tags.picture.format || '').toLowerCase();
              mimeType = format.includes('png') ? 'image/png' : 'image/jpeg';
              const base64Str = Buffer.from(tags.picture.data).toString('base64');
              artworkDataUri = `data:${mimeType};base64,${base64Str}`;
            }

            resolve({
              title: tags.title,
              artist: tags.artist,
              album: tags.album,
              year: tags.year,
              artworkDataUri,
              mimeType,
            });
          },
          onError: (err: any) => {
            console.log('[MetadataParser] jsmediatags error, will try binary parser fallback:', err?.info || err);
            resolve({});
          },
        });
    } catch (e) {
      console.log('[MetadataParser] jsmediatags exception:', e);
      resolve({});
    }
  });
}

/**
 * Cache artwork base64 data to local file system
 */
async function saveArtworkToCache(
  filename: string,
  artworkDataUri: string
): Promise<string> {
  try {
    const isPng = artworkDataUri.startsWith('data:image/png');
    const ext = isPng ? 'png' : 'jpg';
    const base64Data = artworkDataUri.split(',')[1];
    if (!base64Data) return artworkDataUri;

    const cacheDir = `${FileSystem.cacheDirectory}artworks/`;
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const sanitized = filename.replace(/[^a-zA-Z0-9]/g, '_');
    const fileUri = `${cacheDir}${sanitized}_${Date.now()}.${ext}`;

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (err) {
    console.warn('[MetadataParser] Failed to save artwork to cache, using data URI fallback:', err);
    return artworkDataUri;
  }
}

/**
 * Extract full ID3 metadata & embedded cover art for an MP3 file
 */
export async function parseMp3Metadata(uri: string, filename: string): Promise<Song> {
  const fallbackInfo = cleanTitleFromFilename(filename);
  
  let title = fallbackInfo.title;
  let artist = fallbackInfo.artist;
  let album = 'Local Folder';
  let year: string | undefined = undefined;
  let artworkUri: string | null = null;
  let durationMillis = 180000;

  try {
    let buffer: Buffer | null = null;

    if (uri.startsWith('data:')) {
      const base64Part = uri.split(',')[1];
      if (base64Part) {
        buffer = Buffer.from(base64Part, 'base64');
      }
    } else {
      // Read first 1MB of local file to capture ID3 tags & embedded album artwork
      const base64Chunk = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        length: 1048576,
        position: 0,
      });
      buffer = Buffer.from(base64Chunk, 'base64');
    }

    if (buffer && buffer.length > 0) {
      // 1. Try jsmediatags parser first
      const jsMediaRes = await parseWithJsmediatags(buffer);
      if (jsMediaRes.title) title = jsMediaRes.title;
      if (jsMediaRes.artist) artist = jsMediaRes.artist;
      if (jsMediaRes.album) album = jsMediaRes.album;
      if (jsMediaRes.year) year = jsMediaRes.year;

      let extractedArtDataUri: string | null = jsMediaRes.artworkDataUri || null;
      let mimeType: string | null = jsMediaRes.mimeType || null;

      // 2. Binary APIC scanner fallback if jsmediatags didn't extract artwork
      if (!extractedArtDataUri) {
        const fallbackRes = extractEmbeddedArtworkFromBuffer(buffer);
        if (fallbackRes) {
          extractedArtDataUri = fallbackRes.dataUri;
          mimeType = fallbackRes.mimeType;
        }
      }

      // 3. Fallback text parser for TIT2, TPE1, TALB if title wasn't set by jsmediatags
      if (title === fallbackInfo.title && buffer.length > 10 && buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
        const bufferStr = buffer.toString('binary');
        
        const tit2Idx = bufferStr.indexOf('TIT2');
        if (tit2Idx !== -1 && tit2Idx + 10 < buffer.length) {
          const frameSize = buffer.readUInt32BE(tit2Idx + 4);
          if (frameSize > 0 && frameSize < 300) {
            const rawTitle = buffer.slice(tit2Idx + 10, tit2Idx + 10 + frameSize).toString('utf8').replace(/[^\x20-\x7E]/g, '').trim();
            if (rawTitle.length > 1) title = rawTitle;
          }
        }

        const tpe1Idx = bufferStr.indexOf('TPE1');
        if (tpe1Idx !== -1 && tpe1Idx + 10 < buffer.length) {
          const frameSize = buffer.readUInt32BE(tpe1Idx + 4);
          if (frameSize > 0 && frameSize < 300) {
            const rawArtist = buffer.slice(tpe1Idx + 10, tpe1Idx + 10 + frameSize).toString('utf8').replace(/[^\x20-\x7E]/g, '').trim();
            if (rawArtist.length > 1) artist = rawArtist;
          }
        }

        const talbIdx = bufferStr.indexOf('TALB');
        if (talbIdx !== -1 && talbIdx + 10 < buffer.length) {
          const frameSize = buffer.readUInt32BE(talbIdx + 4);
          if (frameSize > 0 && frameSize < 300) {
            const rawAlbum = buffer.slice(talbIdx + 10, talbIdx + 10 + frameSize).toString('utf8').replace(/[^\x20-\x7E]/g, '').trim();
            if (rawAlbum.length > 1) album = rawAlbum;
          }
        }
      }

      // 4. Cache & set artwork if extracted
      if (extractedArtDataUri) {
        console.log(`[MetadataParser] Embedded artwork found for "${filename}" (MIME: ${mimeType || 'unknown'})`);
        artworkUri = await saveArtworkToCache(filename, extractedArtDataUri);
      } else {
        console.log(`[MetadataParser] No embedded artwork found for "${filename}"`);
      }
    }
  } catch (err) {
    console.warn(`[MetadataParser] ID3 read error for ${filename}, using fallback:`, err);
  }

  return {
    id: uri,
    uri,
    filename,
    title,
    artist,
    album,
    year,
    durationMillis,
    durationFormatted: formatDuration(durationMillis),
    artworkUri,
  };
}

