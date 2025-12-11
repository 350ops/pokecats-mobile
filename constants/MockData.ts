export interface Cat {
    id: string;
    name: string;
    image: string;
    breed: string;
    distance: string;
    status: 'Healthy' | 'Needs Help' | 'Adopted';
    description: string;
    lastFed?: Date; // Mock: using Date for logic
    lastSighted: string | Date; // Display string for simplicity in mock
    tnrStatus: boolean; // True if ear-tipped/neutered
    timesFed?: number;
    distanceMeters?: number;
    isColonyCat?: boolean;
    adoptionStatus?: 'looking_for_home' | 'adopted' | 'foster';
    rescueFlags?: string[];
    colorProfile?: string[];
    locationDescription?: string;
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
        timesFed: 18,
        isColonyCat: true,
        rescueFlags: ['friendly'],
        colorProfile: ['tabby', 'orange'],
        locationDescription: 'Park bench near the fountain',
    },
    {
        id: '2',
        name: 'Luna',
        image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
        breed: 'Black Shorthair',
        distance: '1.2 km',
        status: 'Needs Help',
        description: 'Shy black cat, looks a bit thin. Might need treats.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 14), // 14 hours ago
        lastSighted: '1h ago',
        tnrStatus: false,
        timesFed: 2,
        adoptionStatus: 'looking_for_home',
        rescueFlags: ['very-thin'],
        colorProfile: ['black'],
        locationDescription: 'Behind Monoprix waiting for lunch',
    },
    {
        id: '3',
        name: 'Pancho',
        image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80',
        breed: 'Orange Tabby',
        distance: '0.8 km',
        status: 'Healthy',
        description: 'Very vocal and social. hangs out behind Lulu.',
        lastFed: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        lastSighted: 'Now',
        tnrStatus: true,
        timesFed: 9,
        colorProfile: ['orange', 'white'],
        locationDescription: 'Behind Lulu waiting for lunch',
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
        timesFed: 5,
        isColonyCat: true,
        rescueFlags: ['colony'],
        colorProfile: ['tuxedo'],
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
        adoptionStatus: 'foster',
        rescueFlags: ['friendly'],
        colorProfile: ['grey'],
    },
    {
        id: '6',
        name: 'Cleo',
        image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
        breed: 'Siamese Mix',
        distance: '1.5 km',
        status: 'Healthy',
        description: 'Elegant Siamese with striking blue eyes. Often spotted near the community garden.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        lastSighted: '3h ago',
        tnrStatus: true,
        timesFed: 7,
        colorProfile: ['cream', 'tabby'],
    },
    {
        id: '7',
        name: 'Patches',
        image: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=600&q=80',
        breed: 'Calico',
        distance: '0.7 km',
        status: 'Needs Help',
        description: 'Beautiful calico with patches of orange and black. Has a slight limp - needs vet care.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
        lastSighted: '5h ago',
        tnrStatus: false,
        adoptionStatus: 'looking_for_home',
        rescueFlags: ['injured'],
        colorProfile: ['calico'],
    },
    {
        id: '8',
        name: 'Oliver',
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80',
        breed: 'British Shorthair',
        distance: '2.5 km',
        status: 'Healthy',
        description: 'Chubby grey cat with round face. Very calm and loves chin scratches.',
        lastFed: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
        lastSighted: '20m ago',
        tnrStatus: true,
        timesFed: 11,
        isColonyCat: true,
        rescueFlags: ['friendly'],
        colorProfile: ['grey'],
    },
    {
        id: '9',
        name: 'Bella',
        image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
        breed: 'Persian Mix',
        distance: '1.0 km',
        status: 'Healthy',
        description: 'Fluffy white cat with a flat face. Usually found sunbathing on windowsills.',
        lastFed: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        lastSighted: '4h ago',
        tnrStatus: true,
        adoptionStatus: 'looking_for_home',
        rescueFlags: ['kitten'],
        colorProfile: ['white'],
    },
];
