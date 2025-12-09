import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassButton } from '@/components/ui/GlassButton';

const POSTS = [
    {
        id: '1',
        user: 'Sarah M.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        content: 'Just spotted Whiskers near the deli! He looks well fed.',
        time: '2h ago',
        likes: 12,
        comments: 3,
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: '2',
        user: 'Mike R.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        content: 'Does anyone know if Luna has been treated for her limp?',
        time: '5h ago',
        likes: 8,
        comments: 5,
    },
    {
        id: '3',
        user: 'Jenny L.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        content: 'Found a new kitten on 4th street. Very small, needs a foster!',
        time: '1d ago',
        likes: 24,
        comments: 10,
        image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80'
    }
];

export default function CommunityScreen() {
    const insets = useSafeAreaInsets();

    const renderItem = ({ item }: { item: typeof POSTS[0] }) => (
        <GlassView style={styles.postCard} intensity={30}>
            <View style={styles.header}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.headerText}>
                    <Text style={styles.username}>{item.user}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
            </View>

            <Text style={styles.content}>{item.content}</Text>

            {item.image && (
                <Image source={{ uri: item.image }} style={styles.postImage} />
            )}

            <View style={styles.footer}>
                <View style={styles.action}>
                    <GlassButton icon="heart" style={styles.actionBtn} />
                    <Text style={styles.actionText}>{item.likes}</Text>
                </View>
                <View style={styles.action}>
                    <GlassButton icon="bubble.left" style={styles.actionBtn} />
                    <Text style={styles.actionText}>{item.comments}</Text>
                </View>
            </View>
        </GlassView>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={POSTS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: insets.top + 20, paddingBottom: 100 }
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
    postCard: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 24,
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
    username: {
        color: Colors.glass.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    time: {
        color: Colors.glass.textSecondary,
        fontSize: 12,
    },
    content: {
        color: Colors.glass.text,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
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
        color: Colors.glass.textSecondary,
        fontSize: 14,
    }

});
