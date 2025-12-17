import { useLanguage } from '@/context/LanguageContext';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
    const { t } = useLanguage();

    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <Icon
                    sf={{ default: 'map', selected: 'map.fill' }}
                    drawable="ic_menu_mapmode"
                />
                <Label>{t.tabs.map}</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="community">
                <Icon
                    sf={{ default: 'person.2', selected: 'person.2.fill' }}
                    drawable="ic_menu_allfriends"
                />
                <Label>{t.tabs.community}</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="clips">
                <Icon
                    sf={{ default: 'video', selected: 'video.fill' }}
                    drawable="ic_menu_slideshow"
                />
                <Label>{t.tabs.clips}</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <Icon
                    sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
                    drawable="ic_menu_account"
                />
                <Label>{t.tabs.profile}</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}
