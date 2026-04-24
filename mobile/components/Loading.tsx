import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Logo from './Logo';

interface LoadingProps {
    message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
    return (
        <View style={styles.container}>
            <Logo size={80} style={styles.logo} />
            <ActivityIndicator size="small" color="#0ea5e9" style={styles.spinner} />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        marginBottom: 24,
    },
    spinner: {
        marginBottom: 12,
    },
    text: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default Loading;
