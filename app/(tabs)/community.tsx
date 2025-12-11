import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PostCategory = 'Sighting' | 'Medical Alert' | 'Question' | 'Success Story';

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
    image?: string;
    category: PostCategory;
    cats?: PostCatRef[];
    isUrgent?: boolean;
    resolved?: boolean;
    canResolve?: boolean;
};

const POSTS: CommunityPost[] = [
    {
        id: '1',
        user: 'Sarah M.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        content: 'Just spotted Whiskers near the deli! He looks well fed.',
        time: '2h ago',
        likes: 12,
        comments: 3,
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
        category: 'Sighting',
        cats: [
            { id: '1', name: 'Whiskers', isMine: true },
            { id: '8', name: 'Oliver' },
        ],
        isUrgent: false,
        resolved: false,
        canResolve: true,
    },
    {
        id: '2',
        user: 'Mike R.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        content: 'Does anyone know if Luna has been treated for her limp?',
        time: '5h ago',
        likes: 8,
        comments: 5,
        category: 'Question',
        cats: [{ id: '2', name: 'Luna' }],
        isUrgent: true,
        resolved: false,
        canResolve: false,
    },
    {
        id: '3',
        user: 'Jenny L.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        content: 'Found a new kitten on 4th street. Very small, needs a foster!',
        time: '1d ago',
        likes: 24,
        comments: 10,
        image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80',
        category: 'Medical Alert',
        cats: [{ id: 'new-4th', name: '4th Street Kitten' }],
        isUrgent: true,
        resolved: false,
        canResolve: true,
    },
    {
        id: '4',
        user: 'Community Ops',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=150&q=80',
        content: 'Shadow’s adoption is complete! Thanks everyone for helping with transport.',
        time: '3d ago',
        likes: 54,
        comments: 12,
        category: 'Success Story',
        cats: [{ id: '5', name: 'Shadow', isMine: true }],
        isUrgent: false,
        resolved: true,
        canResolve: false,
    },
];

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'mine', label: 'My Cats' },
    { id: 'question', label: 'Questions' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

export default function CommunityScreen() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [activeFilter, setActiveFilter] = useState<FilterId>('all');
    const [posts, setPosts] = useState<CommunityPost[]>(POSTS);

    const filteredPosts = useMemo(() => {
        switch (activeFilter) {
            case 'urgent':
                return posts.filter((post) => post.isUrgent && !post.resolved);
            case 'mine':
                return posts.filter((post) => post.cats?.some((cat) => cat.isMine));
            case 'question':
                return posts.filter((post) => post.category === 'Question');
            default:
                return posts;
        }
    }, [posts, activeFilter]);

    const toggleResolved = (id: string) => {
        setPosts((prev) =>
            prev.map((post) =>
                post.id === id ? { ...post, resolved: !post.resolved } : post
            )
        );
    };

    const renderItem = ({ item }: { item: CommunityPost }) => {
        const urgentTint = item.isUrgent && !item.resolved;
        const resolved = item.resolved;
        return (
            <GlassView style={[styles.postCard, resolved && styles.resolvedCard]} intensity={isDark ? 30 : 0}>
                <View
                    style={[
                        styles.cardInner,
                        {
                            backgroundColor: urgentTint
                                ? 'rgba(255,107,107,0.15)'
                                : isDark
                                    ? 'transparent'
                                    : '#FFFFFF',
                        },
                        resolved && styles.resolvedInner,
                    ]}
                >
                    <View style={styles.header}>
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                        <View style={styles.headerText}>
                            <Text style={[styles.username, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{item.user}</Text>
                            <Text style={[styles.time, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>{item.time}</Text>
                        </View>
                        <View style={styles.headerBadges}>
                            {item.isUrgent && !item.resolved && (
                                <View style={styles.urgentBadge}>
                                    <SymbolView name="exclamationmark.triangle.fill" size={14} tintColor="#FF6B6B" />
                                    <Text style={styles.urgentBadgeText}>Urgent</Text>
                                </View>
                            )}
                            {item.resolved && (
                                <View style={styles.resolvedBadge}>
                                    <SymbolView name="checkmark.seal.fill" size={14} tintColor={Colors.primary.green} />
                                    <Text style={styles.resolvedBadgeText}>Resolved</Text>
                                </View>
                            )}
                            <View style={styles.categoryChip}>
                                <Text style={styles.categoryText}>{item.category}</Text>
                            </View>
                        </View>
                    </View>

                    <Text
                        style={[
                            styles.content,
                            { color: isDark ? Colors.glass.text : Colors.light.text },
                            resolved && styles.textMuted,
                        ]}
                    >
                        {item.content}
                    </Text>

                    {item.cats && item.cats.length > 0 && (
                        <View style={styles.catRow}>
                            {item.cats.map((cat) => (
                                <Link key={cat.id} href={`/cat/${cat.id}`} asChild>
                                    <Pressable style={[styles.catPill, cat.isMine && styles.catPillMine]}>
                                        <Text style={styles.catPillText}>{cat.name}</Text>
                                    </Pressable>
                                </Link>
                            ))}
                        </View>
                    )}

                    {item.image && (
                        <Image source={{ uri: item.image }} style={styles.postImage} />
                    )}

                    <View style={styles.footer}>
                        <View style={styles.action}>
                            <GlassButton icon="heart" style={styles.actionBtn} />
                            <Text style={[styles.actionText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>{item.likes}</Text>
                        </View>
                        <View style={styles.action}>
                            <GlassButton icon="bubble.left" style={styles.actionBtn} />
                            <Text style={[styles.actionText, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>{item.comments}</Text>
                        </View>
                        {item.canResolve && (
                            <GlassButton
                                title={item.resolved ? 'Reopen' : 'Mark Resolved'}
                                icon={item.resolved ? 'arrow.uturn.left' : 'checkmark.circle'}
                                style={styles.resolveButton}
                                onPress={() => toggleResolved(item.id)}
                            />
                        )}
                    </View>
                </View>
            </GlassView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <View style={[styles.filterRow, { paddingTop: insets.top + 12 }]}>
                {FILTERS.map((filter) => {
                    const active = filter.id === activeFilter;
                    return (
                        <Pressable
                            key={filter.id}
                            onPress={() => setActiveFilter(filter.id)}
                            style={[styles.filterChip, active && styles.filterChipActive]}
                        >
                            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <FlatList
                data={filteredPosts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: 100 }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    filterChipActive: {
        backgroundColor: Colors.primary.green,
    },
    filterChipText: {
        color: Colors.glass.text,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0C1B0C',
    },
    postCard: {
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    resolvedCard: {
        opacity: 0.9,
    },
    cardInner: {
        borderRadius: 24,
        padding: 16,
    },
    resolvedInner: {
        backgroundColor: 'rgba(255,255,255,0.05)',
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
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    categoryText: {
        color: Colors.glass.text,
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    textMuted: {
        color: 'rgba(255,255,255,0.7)',
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
        backgroundColor: 'rgba(255,255,255,0.08)',
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
        backgroundColor: 'rgba(255,107,107,0.2)',
    },
    urgentBadgeText: {
        color: '#FF6B6B',
        fontSize: 11,
        fontWeight: '700',
    },
    resolvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: 'rgba(103,206,103,0.15)',
    },
    resolvedBadgeText: {
        color: Colors.primary.green,
        fontSize: 11,
        fontWeight: '700',
    },
    resolveButton: {
        marginLeft: 'auto',
        height: 34,
        paddingHorizontal: 12,
    },
});
