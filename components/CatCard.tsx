import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Image, StyleSheet, Text, View } from 'react-native';
import { GlassView } from './ui/GlassView';

// Compatible definition with DB and Map
interface Cat {
    id: number | string;
    name: string;
    image?: string;
    breed?: string;
    status?: string;
    distance?: string;
    lastSighted?: string | Date | null;
    timesFed?: number;
    rescueFlags?: string[];
    colorProfile?: string[];
    isColonyCat?: boolean;
    adoptionStatus?: string;
    tnrStatus?: boolean;
    lastFed?: string | Date | null;
}

interface CatCardProps {
    cat: Cat & {
        distanceMeters?: number;
    };
}

type DistanceMeta = {
    label: string;
    value: string;
    background: string;
    text: string;
};

const CheckmarkIcon = require('@/assets/images/Checkmark.png');
const ExclamationIcon = require('@/assets/images/Exclamation.png');
const ShieldIcon = require('@/assets/images/Shield.png');

export function CatCard({ cat }: CatCardProps) {
    const { isDark } = useTheme();
    const distanceMeta = getDistanceMeta(cat);
    const needsHelp = (cat.status ?? '').toLowerCase() === 'needs help';
    const isTnrd = cat.tnrStatus === true;

    return (
        <GlassView
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? Colors.glass.background : '#FFFFFF',
                    borderColor: isDark ? Colors.glass.border : 'rgba(0,0,0,0.08)',
                }
            ]}
            intensity={isDark ? 50 : 0}
        >
            <View style={styles.imageWrapper}>
                <Image source={{ uri: cat.image }} style={styles.image} />
                <View style={styles.statusIcons}>
                    <Image source={needsHelp ? ExclamationIcon : CheckmarkIcon} style={styles.statusIcon} />
                    {isTnrd && <Image source={ShieldIcon} style={styles.statusIcon} />}
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.distanceRow}>
                    <View style={[styles.distancePill, { backgroundColor: distanceMeta.background }]}>
                        <Text style={[styles.distanceLabel, { color: distanceMeta.text }]} numberOfLines={1}>{distanceMeta.label}</Text>
                        <Text style={[styles.distanceValue, { color: distanceMeta.text }]} numberOfLines={1}>{distanceMeta.value}</Text>
                    </View>
                </View>

                <Text style={[styles.name, { color: isDark ? Colors.glass.text : Colors.light.text }]} numberOfLines={1}>
                    {cat.name}
                </Text>
                <Text style={[styles.breed, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]} numberOfLines={1}>
                    {cat.breed}
                </Text>

                <View style={styles.footerRow}>
                    <Text style={[styles.meta, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                        Seen {formatTimeAgo(cat.lastSighted)}
                    </Text>
                </View>
            </View>
        </GlassView>
    );
}


const getDistanceMeta = (cat: Cat & { distanceMeters?: number }): DistanceMeta => {
    const meters = cat.distanceMeters ?? parseDistanceFromString(cat.distance);
    if (!meters || meters <= 0) {
        return { label: 'Unknown', value: cat.distance ?? '—', background: 'rgba(255,255,255,0.08)', text: Colors.glass.text };
    }

    if (meters < 500) {
        return {
            label: 'Nearby',
            value: formatMeters(meters),
            background: 'rgba(103, 206, 103, 0.18)',
            text: Colors.primary.green,
        };
    }

    if (meters < 2000) {
        return {
            label: 'Walk',
            value: formatMeters(meters),
            background: 'rgba(0, 143, 33, 0.66)',
            text: Colors.glass.text,
        };
    }

    return {
        label: 'Far',
        value: formatMeters(meters),
        background: 'rgba(9, 0, 108, 0.7)',
        text: Colors.glass.text,
    };
};

const parseDistanceFromString = (distance?: string) => {
    if (!distance) return null;
    const match = distance.trim().match(/([\d.]+)\s*(km|m)/i);
    if (!match) return null;
    const value = parseFloat(match[1]);
    if (isNaN(value)) return null;
    const unit = match[2].toLowerCase();
    return unit === 'km' ? value * 1000 : value;
};

const formatMeters = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const formatTimeAgo = (value?: string | Date | null) => {
    if (!value) return 'recently';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) return String(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.round(diffMs / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 24,
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
    },
    imageWrapper: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 200,
        backgroundColor: '#333',
    },
    statusIcons: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        gap: 6,
    },
    statusIcon: {
        width: 28,
        height: 28,
    },
    content: {
        padding: 16,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    distancePill: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    distanceValue: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    breed: {
        fontSize: 14,
        marginBottom: 6,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    meta: {
        fontSize: 12,
    },
    metaStrong: {
        fontSize: 12,
        fontWeight: '700',
    },
});
