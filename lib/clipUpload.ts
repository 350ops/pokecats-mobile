import 'react-native-get-random-values';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Audio } from 'expo-av';
import { v4 as uuidv4 } from 'uuid';

const VIDEO_BUCKET = 'cat_videos';
const THUMB_BUCKET = 'cat_thumbnails';
const MAX_DURATION_SECONDS = 20;

type UploadArgs = {
    localVideoUri: string;
    onProgress?: (progress: number) => void;
    durationSeconds?: number;
};

export async function uploadCatClip({ localVideoUri, onProgress, durationSeconds }: UploadArgs) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user?.id;
    if (!userId) {
        throw new Error('You must be signed in to upload.');
    }

    const clipId = uuidv4();
    const videoPath = `${userId}/${clipId}.mp4`;
    const thumbPath = `${userId}/${clipId}.jpg`;

    const duration = durationSeconds ?? (await probeDurationSeconds(localVideoUri));
    const thumbResult = await VideoThumbnails.getThumbnailAsync(localVideoUri, { time: 1000 });

    const { data: videoSigned, error: videoSignedError } = await supabase.storage
        .from(VIDEO_BUCKET)
        .createSignedUploadUrl(videoPath);
    if (videoSignedError || !videoSigned?.signedUrl) {
        throw videoSignedError ?? new Error('Could not create signed upload URL for video.');
    }

    const { data: thumbSigned, error: thumbSignedError } = await supabase.storage
        .from(THUMB_BUCKET)
        .createSignedUploadUrl(thumbPath);
    if (thumbSignedError || !thumbSigned?.signedUrl) {
        throw thumbSignedError ?? new Error('Could not create signed upload URL for thumbnail.');
    }

    if (onProgress) onProgress(0);
    await uploadWithProgress(localVideoUri, videoSigned.signedUrl, 'video/mp4', onProgress);
    await uploadWithProgress(thumbResult.uri, thumbSigned.signedUrl, 'image/jpeg');
    if (onProgress) onProgress(1);

    const { error: insertError } = await supabase.from('cat_clips').insert({
        id: clipId,
        user_id: userId,
        video_path: videoPath,
        thumbnail_path: thumbPath,
        duration: Math.min(duration, MAX_DURATION_SECONDS),
    });
    if (insertError) throw insertError;

    return clipId;
}

async function uploadWithProgress(
    fileUri: string,
    signedUrl: string,
    contentType: string,
    onProgress?: (progress: number) => void
) {
    const resumable = FileSystem.createUploadResumable(
        signedUrl,
        fileUri,
        {
            httpMethod: 'PUT',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
                'Content-Type': contentType,
            },
        },
        onProgress
            ? (progressData) => {
                if (progressData.totalBytesExpectedToSend) {
                    onProgress(progressData.totalBytesSent / progressData.totalBytesExpectedToSend);
                }
            }
            : undefined
    );

    const result = await resumable.uploadAsync();
    if (!result || result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed (${result?.status ?? 'unknown status'})`);
    }
}

async function probeDurationSeconds(uri: string): Promise<number> {
    try {
        const { sound, status } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false },
            undefined,
            false
        );
        const millis = (status as any)?.durationMillis;
        await sound.unloadAsync();
        if (typeof millis === 'number') {
            return Math.min(MAX_DURATION_SECONDS, Math.max(1, Math.round(millis / 1000)));
        }
    } catch (error) {
        console.warn('Failed to probe duration', error);
    }
    return MAX_DURATION_SECONDS;
}
