import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image as RNImage, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Success', 'Account created! Please check your email for verification.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Navigation is handled by the auth listener in _layout
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // Sign in via Supabase with the ID token
            if (credential.identityToken) {
                const { error } = await supabase.auth.signInWithIdToken({
                    provider: 'apple',
                    token: credential.identityToken,
                });
                if (error) throw error;
                // Navigation handled by auth listener
            } else {
                throw new Error('No identity token provided.');
            }
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // handle that the user canceled the sign-in flow
            } else {
                Alert.alert('Error', e.message);
            }
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? Colors.primary.dark : Colors.light.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                   
                    <GlassView style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(0, 115, 255, 0.74)' }]} intensity={90}>
                <View style={styles.cardContent}>
                    
                <View style={styles.logoWrap}>
                        <RNImage source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                    </View>
             
                    <View style={styles.inputContainer}>
                        <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                            <SymbolView name="envelope.fill" size={20} tintColor={Colors.glass.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: 'white' }]}
                                placeholder="Email"
                                placeholderTextColor={Colors.glass.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                        <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                            <SymbolView name="lock.fill" size={20} tintColor={Colors.glass.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: 'white' }]}
                                placeholder="Password"
                                placeholderTextColor={Colors.glass.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        {loading ? (
                            <ActivityIndicator color={Colors.primary.green} />
                        ) : (
                            <GlassButton
                                title={isSignUp ? 'Sign Up' : 'Log In'}
                                onPress={handleAuth}
                                variant="secondary" // Use Green Primary Color
                                style={styles.authButton}
                            />
                        )}

                        {Platform.OS === 'ios' && (
                            <View style={styles.appleWrapper}>
                                <AppleAuthentication.AppleAuthenticationButton
                                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                                    cornerRadius={16}
                                    style={styles.appleButton}
                                    onPress={handleAppleLogin}
                                />
                            </View>
                        )}
                    </View>

                    <Text
                        style={[styles.switchText, { color: Colors.glass.textSecondary }]}
                        onPress={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        <Text style={styles.switchTextBold}>{isSignUp ? 'Log In' : 'Sign Up'}</Text>
                    </Text>
                </View>
                </GlassView>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    logoWrap: {
        width: '100%',
        alignItems: 'center',
    },
    logo: {
        width: 220,
        height: 80,
    },
    card: {
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colors.glass.border,
        width: '100%',
        maxWidth: 420,
    },
    cardContent: {
        padding: 28,
        alignItems: 'center',
        gap: 15,
    },
    iconContainer: {
        marginBottom: 5,
        backgroundColor: 'rgb(195, 195, 195)',
        padding: 15,
        borderRadius: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 10,
    },
    inputContainer: {
        width: '100%',
        gap: 15,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        height: 60, // Fixed height for consistency
    },
    inputIcon: {
        marginRight: 15,
        width: 24, // Fix icon width area to align text consistently
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: '100%', // Fill the wrapper height
        fontSize: 16,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 10,
    },
    authButton: {
        width: '100%',
        height: 60, // Match input height
        borderRadius: 16,
    },
    switchText: {
        marginTop: 20,
        fontSize: 14,
        textAlign: 'center',
    },
    switchTextBold: {
        color: Colors.light.background,
        fontWeight: 'bold',
    },
    appleWrapper: {
        marginTop: 15,
        width: '100%',
    },
    appleButton: {
        width: '100%',
        height: 50,
    },
});
