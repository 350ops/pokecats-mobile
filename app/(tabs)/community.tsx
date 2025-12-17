import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { addPostComment, createCommunityPost, getCats, getCommunityPosts, togglePostLike } from '@/lib/database';
import * as ImagePicker from 'expo-image-picker';
import { Link, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PostCategory = 'Sighting' | 'Medical Alert' | 'Question' | 'Success Story' | 'Urgent' | 'TNR';

const POST_CATEGORIES: PostCategory[] = ['Sighting', 'Question', 'Medical Alert', 'Success Story', 'Urgent', 'TNR'];

type Comment = {
    id: string;
    user: string;
    content: string;
    time: string;
};

type PostCatRef = {
    id: string;
    name: string;
    isMine?: boolean;
};

type CommunityPost = {
    id: string;
    user: string;
    avatar: string;
    content: string;
    time: string;
    likes: number;
    comments: number;
    likedByMe?: boolean;
    commentThread?: Comment[];
    image?: string;
    category: PostCategory;
    cats?: PostCatRef[];
    isUrgent?: boolean;
    isTnr?: boolean;
};

// Posts are stored locally and created by users - no mock data
// TODO: Create a community_posts table in Supabase for persistence across devices

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'question', label: 'Questions' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

export default function CommunityScreen() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [activeFilter, setActiveFilter] = useState<FilterId>('all');
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
    const [commentDraft, setCommentDraft] = useState('');

    const [newPostOpen, setNewPostOpen] = useState(false);
    const [newPostCategory, setNewPostCategory] = useState<PostCategory | null>(null);
    const [catSuggestions, setCatSuggestions] = useState<{ id: string; name: string }[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostPhoto, setNewPostPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [newPostCats, setNewPostCats] = useState<string[]>([]);
    const [newPostCatDraft, setNewPostCatDraft] = useState('');

    const filteredPosts = useMemo(() => {
        switch (activeFilter) {
            case 'urgent':
                return posts.filter((post) => post.category === 'Urgent');
            case 'question':
                return posts.filter((post) => post.category === 'Question');
            default:
                return posts;
        }
    }, [posts, activeFilter]);

    // Load posts from Supabase on screen focus
    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const loadPosts = async () => {
                try {
                    const data = await getCommunityPosts();
                    if (isMounted) {
                        setPosts(data as CommunityPost[]);
                    }
                } catch (e) {
                    console.error('Failed to load community posts:', e);
                }
            };
            loadPosts();
            return () => { isMounted = false; };
        }, [])
    );

    const getCategoryStyle = (category: PostCategory, forModal = false) => {
        // Pastel colors for modal, stronger colors for posts
        if (forModal) {
            switch (category) {
                case 'Question':
                    return { bg: 'rgba(99, 179, 237, 0.25)', border: 'rgba(99, 179, 237, 0.4)', text: '#63B3ED' };
                case 'Medical Alert':
                    return { bg: 'rgba(252, 129, 129, 0.25)', border: 'rgba(252, 129, 129, 0.4)', text: '#FC8181' };
                case 'Success Story':
                    return { bg: 'rgba(104, 211, 145, 0.25)', border: 'rgba(104, 211, 145, 0.4)', text: '#68D391' };
                case 'Urgent':
                    return { bg: 'rgba(246, 173, 85, 0.25)', border: 'rgba(246, 173, 85, 0.4)', text: '#F6AD55' };
                case 'TNR':
                    return { bg: 'rgba(183, 148, 244, 0.25)', border: 'rgba(183, 148, 244, 0.4)', text: '#B794F4' };
                default:
                    return { bg: 'rgba(160, 174, 192, 0.25)', border: 'rgba(160, 174, 192, 0.4)', text: '#A0AEC0' };
            }
        }
        switch (category) {
            case 'Question':
                return { bg: '#3F8FF7', border: 'rgba(255,255,255,0.22)', text: '#FFFFFF' };
            case 'Medical Alert':
                return { bg: '#FF6B6B', border: 'rgba(255,255,255,0.22)', text: '#FFFFFF' };
            case 'Success Story':
                return { bg: '#67CE67', border: 'rgba(255,255,255,0.22)', text: '#FFFFFF' };
            case 'Urgent':
                return { bg: Colors.primary.yellow, border: 'rgba(255,255,255,0.22)', text: '#FFFFFF' };
            case 'TNR':
                return { bg: '#8B5CF6', border: 'rgba(255,255,255,0.22)', text: '#FFFFFF' };
            default:
                return { bg: '#808080', border: 'rgba(255,255,255,0.22)', text: '#FFFFFF' };
        }
    };

    const openNewPost = () => {
        setNewPostCategory(null);
        setNewPostContent('');
        setNewPostPhoto(null);
        setNewPostCats([]);
        setNewPostCatDraft('');
        setCatSuggestions([]);
        setNewPostOpen(true);
    };

    const closeNewPost = () => {
        setNewPostOpen(false);
    };

    const pickPostPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setNewPostPhoto(result.assets[0]);
        }
    };

    const removePostPhoto = () => {
        setNewPostPhoto(null);
    };

    const addCatTag = () => {
        const value = newPostCatDraft.trim();
        if (!value) return;
        setNewPostCats((prev) => (prev.includes(value) ? prev : [...prev, value]));
        setNewPostCatDraft('');
    };

    const removeCatTag = (name: string) => {
        setNewPostCats((prev) => prev.filter((x) => x !== name));
    };

    const searchCats = useCallback(async (query: string) => {
        if (!query.trim()) {
            setCatSuggestions([]);
            return;
        }
        try {
            const allCats = await getCats();
            const filtered = allCats
                .filter((cat: any) =>
                    cat.name?.toLowerCase().includes(query.toLowerCase()) &&
                    !newPostCats.includes(cat.name)
                )
                .slice(0, 5)
                .map((cat: any) => ({ id: String(cat.id), name: cat.name }));
            setCatSuggestions(filtered);
        } catch {
            setCatSuggestions([]);
        }
    }, [newPostCats]);

    const handleCatDraftChange = (text: string) => {
        setNewPostCatDraft(text);
        searchCats(text);
    };

    const selectCatSuggestion = (name: string) => {
        setNewPostCats((prev) => (prev.includes(name) ? prev : [...prev, name]));
        setNewPostCatDraft('');
        setCatSuggestions([]);
    };

    const submitNewPost = async () => {
        const content = newPostContent.trim();
        if (!content || !newPostCategory) return;

        try {
            // Create post in Supabase
            const dbPost = await createCommunityPost({
                content,
                category: newPostCategory,
                imageUri: newPostPhoto?.uri,
                catTags: newPostCats,
            });

            // Add to local state for immediate UI update
            const newPost: CommunityPost = {
                id: String(dbPost.id),
                user: 'You',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                content,
                time: 'now',
                likes: 0,
                comments: 0,
                likedByMe: false,
                commentThread: [],
                image: dbPost.image_url || undefined,
                category: newPostCategory,
                cats: newPostCats.map((name, idx) => ({ id: `${dbPost.id}_cat_${idx}`, name, isMine: true })),
            };

            setPosts((prev) => [newPost, ...prev]);
            setNewPostOpen(false);
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    };

    const toggleLike = async (id: string) => {
        try {
            const liked = await togglePostLike(id);
            setPosts((prev) =>
                prev.map((post) => {
                    if (post.id !== id) return post;
                    return {
                        ...post,
                        likedByMe: liked,
                        likes: Math.max(0, (post.likes ?? 0) + (liked ? 1 : -1)),
                    };
                })
            );
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    const openComments = (id: string) => {
        setCommentDraft('');
        setCommentingPostId(id);
    };

    const closeComments = () => {
        setCommentDraft('');
        setCommentingPostId(null);
    };

    const commentingPost = useMemo(
        () => posts.find((p) => p.id === commentingPostId) ?? null,
        [commentingPostId, posts]
    );

    const addComment = async () => {
        const text = commentDraft.trim();
        if (!commentingPostId || !text) return;

        try {
            await addPostComment(commentingPostId, text);

            // Update local state
            setPosts((prev) =>
                prev.map((post) => {
                    if (post.id !== commentingPostId) return post;
                    const nextThread = post.commentThread ? [...post.commentThread] : [];
                    nextThread.push({
                        id: `c_${Date.now()}`,
                        user: 'You',
                        content: text,
                        time: 'now',
                    });
                    return {
                        ...post,
                        commentThread: nextThread,
                        comments: (post.comments ?? 0) + 1,
                    };
                })
            );
            setCommentDraft('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const renderItem = ({ item }: { item: CommunityPost }) => {
        const categoryStyle = getCategoryStyle(item.category);
        return (
            <GlassView
                style={styles.postCard}
                intensity={80}
                glassEffectStyle="clear"
                tintColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.94)'}
            >
                <View style={styles.cardInner}>
                    <View style={styles.header}>
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        <View style={styles.headerText}>
                            <Text style={[styles.username, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{item.user}</Text>
                            <Text style={[styles.time, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>{item.time}</Text>
                        </View>
                    </View>

                    <Text
                        style={[
                            styles.content,
                            { color: isDark ? Colors.glass.text : Colors.light.text },
                        ]}
                    >
                        {item.content}
                    </Text>

                    {item.cats && item.cats.length > 0 && (
                        <View style={styles.catRow}>
                            {item.cats.map((cat) => (
                                <Link key={cat.id} href={`/cat/${cat.id}`} asChild>
                                    <Pressable style={[
                                        styles.catPill,
                                        { backgroundColor: isDark ? 'rgba(99,179,237,0.25)' : 'rgba(63,143,247,0.15)' },
                                        cat.isMine && styles.catPillMine
                                    ]}>
                                        <Text style={[
                                            styles.catPillText,
                                            { color: isDark ? '#63B3ED' : '#3F8FF7' }
                                        ]}>{cat.name}</Text>
                                    </Pressable>
                                </Link>
                            ))}
                        </View>
                    )}

                    {item.image && (
                        <Image source={{ uri: item.image }} style={styles.postImage} />
                    )}

                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <View style={styles.action}>
                                <GlassButton
                                    icon={item.likedByMe ? 'heart.fill' : 'heart'}
                                    style={styles.actionBtn}
                                    iconColor={item.likedByMe ? '#FF3B30' : undefined}
                                    onPress={() => toggleLike(item.id)}
                                />
                                <Text style={[styles.actionText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>{item.likes}</Text>
                            </View>
                            <View style={styles.action}>
                                <GlassButton icon="bubble.left" style={styles.actionBtn} onPress={() => openComments(item.id)} />
                                <Text style={[styles.actionText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>{item.comments}</Text>
                            </View>
                        </View>
                        <View style={[styles.categoryChip, { backgroundColor: categoryStyle.bg, borderColor: categoryStyle.border }]}>
                            <Text style={[styles.categoryText, { color: categoryStyle.text }]}>{item.category}</Text>
                        </View>
                    </View>
                </View>
            </GlassView>
        );
    };

    return (
        <ImageBackground
            source={require('@/assets/images/Motive.png')}
            style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : '#FFFFFF' }]}
            imageStyle={styles.backgroundImage}
            resizeMode="contain"
        >
            <FlatList
                data={filteredPosts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: insets.top + 60, paddingBottom: 100 }
                ]}
            />
            <View style={[styles.filterRow, { top: insets.top + 12 }]}>
                <View style={[styles.filterPillContainer, { backgroundColor: isDark ? 'rgba(60,60,60,0.75)' : 'rgba(255,255,255,0.75)' }]}>
                    <View style={styles.filterChips}>
                        {FILTERS.map((filter) => {
                            const active = filter.id === activeFilter;
                            return (
                                <Pressable
                                    key={filter.id}
                                    onPress={() => setActiveFilter(filter.id)}
                                    style={[
                                        styles.filterChip,
                                        isDark && !active && styles.filterChipDark,
                                        active && styles.filterChipActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            isDark && !active && styles.filterChipTextDark,
                                            active && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {filter.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    <View style={[styles.filterSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
                    <Pressable
                        onPress={openNewPost}
                        style={({ pressed }) => [styles.addPostChip, pressed && { opacity: 0.9 }]}
                        accessibilityRole="button"
                        accessibilityLabel="Create new post"
                    >
                        <SymbolView name="plus" size={14} tintColor={Colors.glass.text} />
                        <Text style={styles.addPostChipText}>Post</Text>
                    </Pressable>
                </View>
            </View>

            <Modal
                visible={newPostOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeNewPost}
            >
                <KeyboardAvoidingView
                    style={[styles.newPostModalContainer, { backgroundColor: isDark ? Colors.primary.dark : '#FFFFFF' }]}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={[styles.newPostScrollContent, { paddingBottom: insets.bottom + 20 }]}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={[styles.newPostLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                            Badge (choose one)

                        </Text>
                        <View style={styles.newPostCategoryRow}>
                            {POST_CATEGORIES.map((cat) => {
                                const s = getCategoryStyle(cat, true);
                                const selected = cat === newPostCategory;
                                return (
                                    <Pressable
                                        key={cat}
                                        onPress={() => setNewPostCategory((prev) => (prev === cat ? null : cat))}
                                        style={({ pressed }) => [
                                            styles.newPostBadgeChip,
                                            {
                                                backgroundColor: s.bg,
                                                borderColor: selected ? s.text : s.border,
                                                borderWidth: selected ? 2 : 1,
                                            },
                                            pressed && { opacity: 0.8 },
                                        ]}
                                    >
                                        <Text style={[styles.newPostBadgeText, { color: s.text }]}>{cat}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={[styles.newPostLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 20 }]}>
                            Your post
                        </Text>
                        <TextInput
                            value={newPostContent}
                            onChangeText={setNewPostContent}
                            placeholder="Share an update..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                            multiline
                            style={[
                                styles.newPostContentInput,
                                {
                                    color: isDark ? Colors.glass.text : Colors.light.text,
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                                },
                            ]}
                        />

                        <Text style={[styles.newPostLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 20 }]}>
                            Tag cats (optional)
                        </Text>
                        <View style={styles.newPostCatsWrap}>
                            {newPostCats.map((name) => (
                                <Pressable
                                    key={name}
                                    onPress={() => removeCatTag(name)}
                                    style={({ pressed }) => [styles.catPill, pressed && { opacity: 0.85 }]}
                                >
                                    <Text style={styles.catPillText}>{name} ✕</Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.newPostCatInputRow}>
                            <TextInput
                                value={newPostCatDraft}
                                onChangeText={handleCatDraftChange}
                                placeholder="Search or add a cat name"
                                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                                style={[
                                    styles.newPostSmallInput,
                                    {
                                        color: isDark ? Colors.glass.text : Colors.light.text,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                                    },
                                ]}
                                returnKeyType="done"
                                onSubmitEditing={addCatTag}
                            />
                            <Pressable
                                onPress={addCatTag}
                                disabled={!newPostCatDraft.trim()}
                                style={({ pressed }) => [
                                    styles.newPostAddBtn,
                                    !newPostCatDraft.trim() && { opacity: 0.4 },
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <Text style={{ color: Colors.primary.blue, fontWeight: '800' }}>Add</Text>
                            </Pressable>
                        </View>
                        {catSuggestions.length > 0 && (
                            <View style={[styles.catSuggestions, { backgroundColor: isDark ? 'rgba(40,40,40,0.98)' : '#FFFFFF' }]}>
                                {catSuggestions.map((cat) => (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => selectCatSuggestion(cat.name)}
                                        style={({ pressed }) => [
                                            styles.catSuggestionItem,
                                            pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                                        ]}
                                    >
                                        <Text style={{ color: isDark ? Colors.glass.text : Colors.light.text }}>{cat.name}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        <Text style={[styles.newPostLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 20 }]}>
                            Photo (optional)
                        </Text>
                        {newPostPhoto ? (
                            <View style={styles.newPostPhotoContainer}>
                                <Image source={{ uri: newPostPhoto.uri }} style={styles.newPostPhotoPreview} />
                                <Pressable onPress={removePostPhoto} style={styles.newPostPhotoRemove}>
                                    <SymbolView name="xmark.circle.fill" size={24} tintColor="#FFFFFF" />
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable
                                onPress={pickPostPhoto}
                                style={[
                                    styles.newPostPhotoPickerBox,
                                    {
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                    }
                                ]}
                            >
                                <SymbolView name="photo.on.rectangle" size={28} tintColor={isDark ? Colors.glass.textSecondary : Colors.light.icon} />
                                <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon, marginTop: 6 }}>
                                    Add photo
                                </Text>
                            </Pressable>
                        )}
                    </ScrollView>

                    <View style={[styles.newPostFooter, { paddingBottom: insets.bottom + 16 }]}>
                        <Pressable
                            onPress={submitNewPost}
                            disabled={!newPostContent.trim() || !newPostCategory}
                            style={[
                                styles.newPostSubmitButton,
                                (!newPostContent.trim() || !newPostCategory) && { opacity: 0.4 },
                            ]}
                        >
                            <Text style={styles.newPostSubmitText}>Post</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={!!commentingPostId}
                transparent
                animationType="slide"
                onRequestClose={closeComments}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeComments} />
                <View style={[styles.modalSheet, { paddingBottom: Math.max(20, insets.bottom + 16) }]}>
                    <View
                        style={[
                            styles.modalCard,
                            {
                                // Opaque card for legibility (no glass / blur).
                                backgroundColor: isDark ? '#171717' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
                            },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                Comments
                            </Text>
                            <Pressable onPress={closeComments} style={styles.modalClose}>
                                <Text style={{ color: isDark ? Colors.glass.textSecondary : Colors.light.icon }}>Done</Text>
                            </Pressable>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={[styles.modalPostUser, { color: isDark ? Colors.glass.text : Colors.light.text }]}>
                                {commentingPost?.user}
                            </Text>
                            <Text style={[styles.modalPostContent, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                {commentingPost?.content}
                            </Text>

                            <View style={styles.thread}>
                                {(commentingPost?.commentThread ?? []).map((c) => (
                                    <View key={c.id} style={styles.commentRow}>
                                        <Text style={[styles.commentUser, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{c.user}</Text>
                                        <Text style={[styles.commentText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                            {c.content}
                                        </Text>
                                        <Text style={[styles.commentTime, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                            {c.time}
                                        </Text>
                                    </View>
                                ))}
                                {(commentingPost?.commentThread?.length ?? 0) === 0 && (
                                    <Text style={[styles.emptyThread, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                                        Be the first to comment.
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={[styles.composer, { borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
                            <TextInput
                                value={commentDraft}
                                onChangeText={setCommentDraft}
                                placeholder="Add a comment…"
                                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                                style={[
                                    styles.composerInput,
                                    {
                                        color: isDark ? Colors.glass.text : Colors.light.text,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                                    },
                                ]}
                                returnKeyType="send"
                                onSubmitEditing={addComment}
                            />
                            <Pressable
                                onPress={addComment}
                                disabled={!commentDraft.trim()}
                                style={({ pressed }) => [
                                    styles.sendBtn,
                                    !commentDraft.trim() && { opacity: 0.4 },
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <Text style={{ color: Colors.primary.blue, fontWeight: '700' }}>Post</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '120%',
        height: '80%',
        transform: [{ translateX: '-50%' }, { translateY: '-40%' }],
        opacity: 0.2,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    filterRow: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterPillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        backdropFilter: 'blur(20px)',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
    },
    filterChips: {
        flexDirection: 'row',
        gap: 8,
    },
    filterSeparator: {
        width: 1,
        height: 24,
        marginHorizontal: 12,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    filterChipActive: {
        backgroundColor: Colors.primary.green,
    },
    filterChipText: {
        color: 'rgba(0,0,0,0.6)',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0C1B0C',
    },
    filterChipDark: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterChipTextDark: {
        color: Colors.glass.text,
    },
    addPostChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#3F8FF7',
    },
    addPostChipText: {
        color: Colors.glass.text,
        fontWeight: '800',
    },
    postCard: {
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardInner: {
        borderRadius: 24,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerText: {
        justifyContent: 'center',
    },
    headerBadges: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 6,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
    },
    categoryChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    catRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    catPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
    },
    catPillMine: {
        borderWidth: 1,
        borderColor: Colors.primary.green,
    },
    catPillText: {
        color: Colors.glass.text,
        fontWeight: '600',
        fontSize: 12,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionBtn: {
        height: 36,
        paddingHorizontal: 12,
    },
    actionText: {
        fontSize: 14,
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#FF6B6B',
    },
    urgentBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    newPostModalContainer: {
        flex: 1,
    },
    newPostScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 10,
    },
    newPostFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128,128,128,0.2)',
    },
    newPostSubmitButton: {
        backgroundColor: Colors.primary.blue,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    newPostSubmitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    newPostPhotoPickerBox: {
        height: 100,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    newPostPhotoContainer: {
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
    },
    newPostPhotoPreview: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    newPostPhotoRemove: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },
    newPostLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
    },
    newPostBadgesRow: {
        gap: 10,
    },
    newPostToggleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    newPostBadgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    newPostBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    newPostCategoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    newPostContentInput: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        minHeight: 96,
        textAlignVertical: 'top',
    },
    newPostCatsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    newPostCatInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    newPostSmallInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    newPostAddBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    catSuggestions: {
        borderRadius: 12,
        marginTop: 4,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    catSuggestionItem: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    modalHeader: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalClose: {
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    modalBody: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    modalPostUser: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
    },
    modalPostContent: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    thread: {
        gap: 10,
        paddingBottom: 6,
    },
    commentRow: {
        gap: 2,
    },
    commentUser: {
        fontSize: 13,
        fontWeight: '700',
    },
    commentText: {
        fontSize: 13,
        lineHeight: 18,
    },
    commentTime: {
        fontSize: 11,
    },
    emptyThread: {
        fontSize: 13,
        paddingVertical: 8,
    },
    composer: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    composerInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    sendBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalCard: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
});
