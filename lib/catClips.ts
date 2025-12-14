import { supabase } from '@/lib/supabase';

// Force update check

const VIDEO_BUCKET = 'cat_videos';
const THUMB_BUCKET = 'cat_thumbnails';

export type CatClip = {
    id: string;
    user_id: string;
    video_path: string;
    thumbnail_path: string;
    duration: number;
    created_at: string;
};

export type EnrichedClip = CatClip & {
    videoUrl?: string;
    thumbnailUrl?: string;
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
};

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function fetchClipPage(offset: number, limit: number): Promise<{ clips: EnrichedClip[]; done: boolean }> {
    const [{ data: sessionData }, { data, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
            .from('cat_clips')
            .select(`
                *,
                likes:cat_clip_likes(count),
                comments:cat_clip_comments(count)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1),
    ]);

    if (error) {
        throw error;
    }

    if (!data || data.length === 0) {
        return { clips: [], done: true };
    }

    const clipIds = data.map((clip) => clip.id);
    const currentUserId = sessionData.session?.user?.id;

    const { data: myLikes } = currentUserId
        ? await supabase
            .from('cat_clip_likes')
            .select('clip_id')
            .eq('user_id', currentUserId)
            .in('clip_id', clipIds)
        : { data: [] };

    const likedSet = new Set((myLikes ?? []).map((row: any) => row.clip_id));

    const signedVideoPromises = data.map((clip) =>
        supabase.storage.from(VIDEO_BUCKET).createSignedUrl(clip.video_path, SIGNED_URL_TTL)
    );
    const signedThumbPromises = data.map((clip) =>
        supabase.storage.from(THUMB_BUCKET).createSignedUrl(clip.thumbnail_path, SIGNED_URL_TTL)
    );

    const [videoUrls, thumbUrls] = await Promise.all([
        Promise.all(signedVideoPromises),
        Promise.all(signedThumbPromises),
    ]);

    const clips: EnrichedClip[] = data.map((clip, idx) => ({
        ...clip,
        videoUrl: videoUrls[idx]?.data?.signedUrl,
        thumbnailUrl: thumbUrls[idx]?.data?.signedUrl,
        likeCount: clip.likes?.[0]?.count ?? 0,
        commentCount: clip.comments?.[0]?.count ?? 0,
        likedByMe: likedSet.has(clip.id),
    }));

    return { clips, done: data.length < limit };
}

export async function toggleClipLike(clipId: string, like: boolean) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user?.id;
    if (!userId) {
        throw new Error('You must be signed in to like clips.');
    }
    if (like) {
        const { error } = await supabase.from('cat_clip_likes').insert({ clip_id: clipId, user_id: userId });
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('cat_clip_likes')
            .delete()
            .eq('clip_id', clipId)
            .eq('user_id', userId);
        if (error) throw error;
    }
}

export async function addClipComment(clipId: string, body: string) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user?.id;
    if (!userId) {
        throw new Error('You must be signed in to comment.');
    }
    const trimmed = body.trim();
    if (!trimmed) {
        throw new Error('Comment cannot be empty.');
    }
    const { error } = await supabase.from('cat_clip_comments').insert({
        clip_id: clipId,
        user_id: userId,
        body: trimmed,
    });
    if (error) throw error;
}
