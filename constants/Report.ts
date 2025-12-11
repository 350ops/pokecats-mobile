import { Colors } from './Colors';

export type RescueFlag = {
    id: string;
    label: string;
    description: string;
    severity: 'info' | 'urgent';
    icon: string;
};

export const RESCUE_FLAGS: RescueFlag[] = [
    { id: 'injured', label: 'Injured', description: 'Visible wound, limping, bleeding', severity: 'urgent', icon: 'bandage.fill' },
    { id: 'very-thin', label: 'Very Thin', description: 'Ribs showing, malnourished', severity: 'urgent', icon: 'heart.text.square.fill' },
    { id: 'kitten', label: 'Kitten', description: 'Under 6 months old', severity: 'info', icon: 'face.smiling' },
    { id: 'pregnant', label: 'Pregnant', description: 'Noticeable belly', severity: 'urgent', icon: 'figure.wave.circle' },
    { id: 'dumped-pet', label: 'Dumped Pet', description: 'Collar, recently abandoned', severity: 'info', icon: 'tag.circle.fill' },
    { id: 'friendly', label: 'Friendly', description: 'Approaches people confidently', severity: 'info', icon: 'hand.thumbsup.fill' },
    { id: 'scared', label: 'Scared', description: 'Hiding, hissing, fearful', severity: 'info', icon: 'exclamationmark.octagon.fill' },
];

export const COLOR_TAGS = [
    { id: 'orange', label: 'Orange' },
    { id: 'black', label: 'Black' },
    { id: 'white', label: 'White' },
    { id: 'tabby', label: 'Tabby' },
    { id: 'calico', label: 'Calico' },
    { id: 'tuxedo', label: 'Tuxedo' },
];

export const KEYWORD_HINTS = [
    { keywords: ['limp', 'limping', 'injured', 'wound', 'bleeding'], hint: 'Consider contacting a rescue or vet immediately.' },
    { keywords: ['kitten', 'tiny', 'small'], hint: 'Young kittens may need bottle feeding and urgent care.' },
    { keywords: ['collar', 'pet', 'friendly'], hint: 'Friendly or collared cats might be recently abandoned. Check for microchips.' },
];

export const getFlagColor = (severity: 'info' | 'urgent') =>
    severity === 'urgent' ? '#FF6B6B' : Colors.primary.green;

