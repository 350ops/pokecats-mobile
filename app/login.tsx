import { GlassButton } from '@/components/ui/GlassButton';
import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Image as RNImage, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
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
        <View style={styles.container}>
            <StatusBar style="light" />
            <RNImage source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            <GlassView style={styles.card} intensity={90}>
                <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                        <SymbolView name="pawprint.fill" size={50} tintColor={Colors.primary.green} />
                    </View>

                    <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
                    <Text style={styles.subtitle}>{isSignUp ? 'Join the community' : 'Login to continue'}</Text>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <SymbolView name="envelope.fill" size={20} tintColor={Colors.glass.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor={Colors.glass.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <SymbolView name="lock.fill" size={20} tintColor={Colors.glass.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
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
                            <View style={{ marginTop: 15, width: '100%' }}>
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
                        style={styles.switchText}
                        onPress={() => setIsSignUp(!isSignUp)}
                    >
                        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                        <Text style={styles.switchTextBold}>{isSignUp ? 'Log In' : 'Sign Up'}</Text>
                    </Text>
                </View>
            </GlassView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary.dark,
        justifyContent: 'center',
        alignItems: 'center', // Center content
        padding: 20,
        gap: 20,
    },
    logo: {
        width: 250,
        height: 100, // Approximate height
        marginBottom: 10,
    },
    card: {
        borderRadius: 30,
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
        borderWidth: 1,
        borderColor: Colors.glass.border,
        overflow: 'hidden', // Ensure padding doesn't break radius visual
    },
    cardContent: {
        padding: 30,
        alignItems: 'center',
        gap: 15,
        width: '100%',
    },
    iconContainer: {
        marginBottom: 5,
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
        padding: 15,
        borderRadius: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.glass.textSecondary,
        marginBottom: 10,
    },
    inputContainer: {
        width: '100%',
        gap: 15,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
        color: 'white',
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
        color: Colors.glass.textSecondary,
        marginTop: 20,
        fontSize: 14,
        textAlign: 'center',
    },
    switchTextBold: {
        color: Colors.primary.green,
        fontWeight: 'bold',
    },
    appleButton: {
        width: '100%',
        height: 50,
    },
});
