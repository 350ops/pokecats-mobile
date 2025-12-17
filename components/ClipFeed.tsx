import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { addClipComment, EnrichedClip, fetchClipPage, toggleClipLike } from '@/lib/catClips';
import { useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAGE_SIZE = 8;

// Extracted Component for Individual Clip Card
function ClipCard({
    item,
    onLike,
    onSubmitComment,
    isSubmittingComment,
    commentDraft,
    onCommentChange
}: {
    item: EnrichedClip;
    onLike: (id: string, liked: boolean) => void;
    onSubmitComment: (id: string) => void;
    isSubmittingComment: boolean;
    commentDraft: string;
    onCommentChange: (text: string) => void;
}) {
    const { isDark } = useTheme();
    const { t } = useLanguage();
    const textColor = isDark ? Colors.glass.text : Colors.primary.dark;
    const subTextColor = isDark ? Colors.glass.textSecondary : 'rgba(0,0,0,0.65)';
    const cardSurface = isDark ? Colors.glass.background : '#f5f7fb';

    const player = useVideoPlayer(item.videoUrl ?? '', player => {
        player.loop = true;
        // Auto-play could be added here if desired, or handled via visibility
        // player.play(); 
    });

    return (
        <View style={[styles.card, { backgroundColor: cardSurface }]}>
            {item.videoUrl ? (
                <View style={styles.videoContainer}>
                    <VideoView
                        player={player}
                        style={styles.video}
                        nativeControls={true}
                        contentFit="cover"
                    />
                </View>
            ) : null}
            <View style={styles.cardContent}>
                <View style={styles.row}>
                    <Text style={[styles.title, { color: textColor }]}>{t.clips.clip}</Text>
                    <Text style={[styles.meta, { color: subTextColor }]}>{item.duration}s • {new Date(item.created_at).toLocaleString()}</Text>
                </View>

                <View style={styles.actions}>
                    <Pressable
                        style={styles.actionChip}
                        onPress={() => onLike(item.id, !item.likedByMe)}
                    >
                        <SymbolView
                            name={item.likedByMe ? 'heart.fill' : 'heart'}
                            size={18}
                            tintColor={item.likedByMe ? '#FF6B6B' : subTextColor}
                        />
                        <Text style={[styles.actionText, { color: textColor }]}>{item.likeCount}</Text>
                    </Pressable>
                    <View style={styles.actionChip}>
                        <SymbolView name="text.bubble" size={18} tintColor={subTextColor} />
                        <Text style={[styles.actionText, { color: textColor }]}>{item.commentCount}</Text>
                    </View>
                </View>

                <View style={styles.commentRow}>
                    <TextInput
                        placeholder={t.common.addComment}
                        placeholderTextColor={subTextColor}
                        style={[styles.commentInput, { color: textColor, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
                        value={commentDraft}
                        onChangeText={onCommentChange}
                    />
                    <Pressable
                        style={styles.sendButton}
                        onPress={() => onSubmitComment(item.id)}
                        disabled={isSubmittingComment}
                    >
                        {isSubmittingComment ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <SymbolView name="paperplane.fill" size={16} tintColor="#fff" />
                        )}
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

export function ClipFeed() {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [clips, setClips] = useState<EnrichedClip[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [endReached, setEndReached] = useState(false);
    const [schemaMissing, setSchemaMissing] = useState(false);
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [submittingCommentIds, setSubmittingCommentIds] = useState<Set<string>>(new Set());

    // Refs to avoid recreating callbacks
    const clipsCountRef = useRef(0);
    const loadingRef = useRef(false);
    const loadingMoreRef = useRef(false);
    const endReachedRef = useRef(false);
    const schemaMissingRef = useRef(false);
    const hasAlertedRef = useRef(false);

    useEffect(() => {
        clipsCountRef.current = clips.length;
    }, [clips.length]);
    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);
    useEffect(() => {
        loadingMoreRef.current = loadingMore;
    }, [loadingMore]);
    useEffect(() => {
        endReachedRef.current = endReached;
    }, [endReached]);
    useEffect(() => {
        schemaMissingRef.current = schemaMissing;
    }, [schemaMissing]);

    const subTextColor = isDark ? Colors.glass.textSecondary : 'rgba(0,0,0,0.65)';

    const loadPage = useCallback(async (reset = false) => {
        if (schemaMissingRef.current) return;
        if (!reset && (loadingMoreRef.current || loadingRef.current)) return;
        if (!reset && endReachedRef.current) return;
        if (reset) {
            setEndReached(false);
            setClips([]);
            setSchemaMissing(false);
            hasAlertedRef.current = false;
        }
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        try {
            const offset = reset ? 0 : clipsCountRef.current;
            const { clips: fetched, done } = await fetchClipPage(offset, PAGE_SIZE);
            setClips((prev) => (reset ? fetched : [...prev, ...fetched]));
            if (done) setEndReached(true);
        } catch (error: any) {
            const code = error?.code ?? error?.error?.code;
            const message = error?.message ?? error?.error?.message ?? 'Please try again.';
            console.error(error);

            if (code === 'PGRST205' || String(message).includes('schema cache')) {
                setSchemaMissing(true);
                setEndReached(true);
                if (!hasAlertedRef.current) {
                    hasAlertedRef.current = true;
                    Alert.alert(
                        'Unable to load clips',
                        "The Supabase table 'public.cat_clips' isn't available to the API yet.\n\n1) Run `supabase_cat_clips.sql` in Supabase SQL editor.\n2) In Supabase Dashboard → Settings → API → Reload schema cache.\n3) Reopen this screen."
                    );
                }
                return;
            }

            if (!hasAlertedRef.current) {
                hasAlertedRef.current = true;
                Alert.alert('Unable to load clips', message);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPage(true);
        }, [loadPage])
    );

    const handleLike = useCallback(async (clipId: string, targetLike: boolean) => {
        setClips((prev) =>
            prev.map((clip) =>
                clip.id === clipId
                    ? {
                        ...clip,
                        likedByMe: targetLike,
                        likeCount: clip.likeCount + (targetLike ? 1 : -1),
                    }
                    : clip
            )
        );
        try {
            await toggleClipLike(clipId, targetLike);
        } catch (error: any) {
            // revert on failure
            setClips((prev) =>
                prev.map((clip) =>
                    clip.id === clipId
                        ? {
                            ...clip,
                            likedByMe: !targetLike,
                            likeCount: clip.likeCount + (targetLike ? -1 : 1),
                        }
                        : clip
                )
            );
            Alert.alert('Like failed', error?.message ?? 'Please try again.');
        }
    }, []);

    const handleSubmitComment = useCallback(async (clipId: string) => {
        const draft = commentDrafts[clipId]?.trim();
        if (!draft) return;
        setSubmittingCommentIds((prev) => new Set(prev).add(clipId));
        try {
            await addClipComment(clipId, draft);
            setCommentDrafts((prev) => ({ ...prev, [clipId]: '' }));
            setClips((prev) =>
                prev.map((clip) =>
                    clip.id === clipId
                        ? { ...clip, commentCount: clip.commentCount + 1 }
                        : clip
                )
            );
        } catch (error: any) {
            Alert.alert('Comment failed', error?.message ?? 'Please try again.');
        } finally {
            setSubmittingCommentIds((prev) => {
                const next = new Set(prev);
                next.delete(clipId);
                return next;
            });
        }
    }, [commentDrafts]);

    const renderItem = useCallback(({ item }: { item: EnrichedClip }) => {
        return (
            <ClipCard
                item={item}
                onLike={handleLike}
                onSubmitComment={handleSubmitComment}
                isSubmittingComment={submittingCommentIds.has(item.id)}
                commentDraft={commentDrafts[item.id] ?? ''}
                onCommentChange={(text) => setCommentDrafts((prev) => ({ ...prev, [item.id]: text }))}
            />
        );
    }, [handleLike, handleSubmitComment, submittingCommentIds, commentDrafts]);

    const listFooter = useMemo(() => {
        if (schemaMissing) {
            return (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <Text style={{ textAlign: 'center', color: subTextColor, fontWeight: '700' }}>
                        Clips database not set up
                    </Text>
                    <Text style={{ textAlign: 'center', color: subTextColor, marginTop: 6 }}>
                        Run `supabase_cat_clips.sql` in Supabase, then reopen this screen.
                    </Text>
                </View>
            );
        }
        if (loading && clips.length === 0) {
            return <ActivityIndicator style={{ marginVertical: 20 }} color={subTextColor} />;
        }
        if (loadingMore) {
            return <ActivityIndicator style={{ marginVertical: 16 }} color={subTextColor} />;
        }
        if (endReached) {
            return <Text style={{ textAlign: 'center', color: subTextColor, marginVertical: 12 }}>You are all caught up.</Text>;
        }
        return null;
    }, [clips.length, endReached, loading, loadingMore, schemaMissing, subTextColor]);

    return (
        <FlatList
            data={clips}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 30, paddingTop: 10 }]}
            onEndReached={() => loadPage(false)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={listFooter}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        gap: 12,
        paddingHorizontal: 16,
    },
    card: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoFallback: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 14,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontWeight: '700',
        fontSize: 16,
    },
    meta: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionText: {
        fontWeight: '700',
        fontSize: 13,
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary.blue,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
