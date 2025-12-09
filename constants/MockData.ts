export interface Cat {
    id: string;
    name: string;
    image: string;
    breed: string;
    distance: string;
    status: 'Healthy' | 'Needs Help' | 'Adopted';
    description: string;
    lastFed?: Date; // Mock: using Date for logic
    lastSighted: string; // Display string for simplicity in mock
    tnrStatus: boolean; // True if ear-tipped/neutered
}

export const MOCK_CATS: Cat[] = [
    {
        id: '1',
        name: 'Whiskers',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
        breed: 'Tabby Mix',
        distance: '0.5 km',
        status: 'Healthy',
        description: 'Friendly tabby cat often seen near the park bench. Loves treats.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        lastSighted: '10m ago',
        tnrStatus: true,
    },
    {
        id: '2',
        name: 'Luna',
        image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
        breed: 'Black Shorthair',
        distance: '1.2 km',
        status: 'Needs Help',
        description: 'Shy black cat, looks a bit thin. Might need a vet checkup.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 14), // 14 hours ago
        lastSighted: '1h ago',
        tnrStatus: false,
    },
    {
        id: '3',
        name: 'Ginger',
        image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80',
        breed: 'Orange Tabby',
        distance: '0.8 km',
        status: 'Healthy',
        description: 'Very vocal and social. hangs out behind the bakery.',
        lastFed: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        lastSighted: 'Now',
        tnrStatus: true,
    },
    {
        id: '4',
        name: 'Mittens',
        image: 'https://images.unsplash.com/photo-1511044568932-338cba0fb803?auto=format&fit=crop&w=600&q=80',
        breed: 'Tuxedo',
        distance: '2.0 km',
        status: 'Healthy',
        description: 'Wears a red collar but no tag. Friendly with other cats.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        lastSighted: '2d ago',
        tnrStatus: true,
    },
    {
        id: '5',
        name: 'Shadow',
        image: 'https://images.unsplash.com/photo-1495360019602-e001c5b09817?auto=format&fit=crop&w=600&q=80',
        breed: 'Grey Mix',
        distance: '0.3 km',
        status: 'Adopted',
        description: 'Recently adopted! Just keeping the profile for memory.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 5),
        lastSighted: '1w ago',
        tnrStatus: true,
    },
];
