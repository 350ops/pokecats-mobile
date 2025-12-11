import { Colors } from '@/constants/Colors';
import { Cat } from '@/constants/MockData';
import { useTheme } from '@/context/ThemeContext';
import { getCatStatusState } from '@/lib/cat_logic';
import { Image, StyleSheet, Text, View } from 'react-native';
import { GlassView } from './ui/GlassView';

interface CatCardProps {
    cat: Cat & {
        distanceMeters?: number;
        lastSighted?: string | Date | null;
        timesFed?: number;
        rescueFlags?: string[];
        colorProfile?: string[];
    };
}

type DistanceMeta = {
    label: string;
    value: string;
    background: string;
    text: string;
};

type BadgeMeta = {
    id: string;
    label: string;
    background: string;
    text: string;
};

export function CatCard({ cat }: CatCardProps) {
    const { isDark } = useTheme();
    const distanceMeta = getDistanceMeta(cat);
    const badges = getBadgeMeta(cat);

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
                <View style={styles.badgeColumn}>
                    {badges.map((badge) => (
                        <View key={badge.id} style={[styles.cornerBadge, { backgroundColor: badge.background }]}>
                            <Text style={[styles.cornerBadgeText, { color: badge.text }]}>{badge.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.distanceRow}>
                    <View style={[styles.distancePill, { backgroundColor: distanceMeta.background }]}>
                        <Text style={[styles.distanceLabel, { color: distanceMeta.text }]}>{distanceMeta.label}</Text>
                        <Text style={[styles.distanceValue, { color: distanceMeta.text }]}>{distanceMeta.value}</Text>
                    </View>
                    <Text style={[styles.statusLabel, { color: isDark ? Colors.glass.textSecondary : Colors.light.icon }]}>
                        {cat.status}
                    </Text>
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
                    {typeof cat.timesFed === 'number' && (
                        <Text style={[styles.metaStrong, { color: Colors.primary.green }]}>
                            {cat.timesFed} feeds
                        </Text>
                    )}
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
            label: 'Walkable',
            value: formatMeters(meters),
            background: 'rgba(255, 184, 69, 0.18)',
            text: Colors.primary.yellow,
        };
    }

    return {
        label: 'Farther',
        value: formatMeters(meters),
        background: 'rgba(255, 255, 255, 0.1)',
        text: Colors.glass.text,
    };
};

const getBadgeMeta = (cat: Cat): BadgeMeta[] => {
    const badges: BadgeMeta[] = [];

    // Add Primary Status Badge (Healthy/Hungry/Needs Help)
    const statusState = getCatStatusState(cat);
    badges.push({
        id: 'status',
        label: statusState.statusText,
        background: statusState.statusColor,
        text: statusState.labelColor
    });

    if (cat.rescueFlags?.length) {
        badges.push({
            id: `flag-${cat.rescueFlags[0]}`,
            label: formatFlagLabel(cat.rescueFlags[0]),
            background: 'rgba(255, 107, 107, 0.95)',
            text: '#360000',
        });
    }

    if (cat.tnrStatus === true) {
        badges.push({
            id: 'tnr',
            label: 'TNR’d',
            background: 'rgba(103, 206, 103, 0.9)',
            text: '#082A14',
        });
    } else if (cat.tnrStatus === false) {
        badges.push({
            id: 'intact',
            label: 'Intact',
            background: 'rgba(255, 184, 69, 0.95)',
            text: '#3D2100',
        });
    }

    if (cat.adoptionStatus === 'looking_for_home') {
        badges.push({
            id: 'looking-home',
            label: 'Looking for Home',
            background: 'rgba(151, 128, 255, 0.95)',
            text: '#110035',
        });
    }

    if (cat.isColonyCat) {
        badges.push({
            id: 'colony',
            label: 'Colony Cat',
            background: 'rgba(255, 255, 255, 0.25)',
            text: Colors.glass.text,
        });
    }

    return badges;
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

const formatFlagLabel = (flag: string) => {
    switch (flag) {
        case 'injured':
            return 'Injured';
        case 'very-thin':
            return 'Very Thin';
        case 'kitten':
            return 'Kitten';
        case 'pregnant':
            return 'Pregnant';
        case 'dumped-pet':
            return 'Dumped Pet';
        case 'friendly':
            return 'Friendly';
        case 'scared':
            return 'Scared';
        case 'colony':
            return 'Colony Cat';
        default:
            return flag.replace(/-/g, ' ');
    }
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
    badgeColumn: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    cornerBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 6,
    },
    cornerBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    content: {
        padding: 16,
    },
    distanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    distancePill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    distanceValue: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
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
