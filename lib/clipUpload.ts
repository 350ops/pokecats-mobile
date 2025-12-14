import { supabase } from '@/lib/supabase';
import * as VideoThumbnails from 'expo-video-thumbnails';
import 'react-native-get-random-values';

const VIDEO_BUCKET = 'cat_videos';
const THUMB_BUCKET = 'cat_thumbnails';
const MAX_DURATION_SECONDS = 20;

// Generate a simple UUID without external dependency
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

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

    const clipId = generateUUID();
    const videoPath = `${userId}/${clipId}.mp4`;
    const thumbPath = `${userId}/${clipId}.jpg`;

    if (onProgress) onProgress(0.1);

    // Use provided duration or default to MAX if missing (since we removed probing)
    const duration = durationSeconds ?? MAX_DURATION_SECONDS;

    if (onProgress) onProgress(0.2);

    // Generate thumbnail
    const thumbResult = await VideoThumbnails.getThumbnailAsync(localVideoUri, { time: 1000 });

    if (onProgress) onProgress(0.3);

    // Read video file as Blob
    console.log('📹 Reading video file as Blob...');
    const videoResponse = await fetch(localVideoUri);
    const videoBlob = await videoResponse.blob();
    console.log('📹 Video blob created, size:', videoBlob.size);

    if (onProgress) onProgress(0.5);

    // Upload video directly to Supabase storage
    console.log('⬆️ Uploading video to Supabase...');
    const { error: videoUploadError } = await supabase.storage
        .from(VIDEO_BUCKET)
        .upload(videoPath, videoBlob, {
            contentType: 'video/mp4',
            upsert: true,
        });

    if (videoUploadError) {
        console.error('❌ Video upload error:', videoUploadError);
        throw videoUploadError;
    }
    console.log('✅ Video uploaded successfully');

    if (onProgress) onProgress(0.7);

    // Read and upload thumbnail
    console.log('🖼️ Reading thumbnail as Blob...');
    const thumbResponse = await fetch(thumbResult.uri);
    const thumbBlob = await thumbResponse.blob();

    console.log('⬆️ Uploading thumbnail to Supabase...');
    const { error: thumbUploadError } = await supabase.storage
        .from(THUMB_BUCKET)
        .upload(thumbPath, thumbBlob, {
            contentType: 'image/jpeg',
            upsert: true,
        });

    if (thumbUploadError) {
        console.error('❌ Thumbnail upload error:', thumbUploadError);
        throw thumbUploadError;
    }
    console.log('✅ Thumbnail uploaded successfully');

    if (onProgress) onProgress(0.9);

    // Insert record into database
    const { error: insertError } = await supabase.from('cat_clips').insert({
        id: clipId,
        user_id: userId,
        video_path: videoPath,
        thumbnail_path: thumbPath,
        duration: Math.min(duration, MAX_DURATION_SECONDS),
    });

    if (insertError) {
        console.error('❌ Database insert error:', insertError);
        throw insertError;
    }

    console.log('✅ Clip record saved to database');
    if (onProgress) onProgress(1);

    return clipId;
}
