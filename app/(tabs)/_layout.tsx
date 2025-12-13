import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <Icon
                    sf={{ default: 'map', selected: 'map.fill' }}
                    drawable="ic_menu_mapmode"
                />
                <Label>Map</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="community">
                <Icon
                    sf={{ default: 'person.2', selected: 'person.2.fill' }}
                    drawable="ic_menu_allfriends"
                />
                <Label>Community</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="clips">
                <Icon
                    sf={{ default: 'video', selected: 'video.fill' }}
                    drawable="ic_menu_slideshow"
                />
                <Label>Clips</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <Icon
                    sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
                    drawable="ic_menu_account"
                />
                <Label>Profile</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
