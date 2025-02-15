//context providers
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native components
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const GoBack = ({ direction }) => {

    //context providers
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => direction()} style={styles.backButton}>
                <Ionicons name="close" size={22} color={colors.background} />
                <Text style={styles.headerTitle}>EXIT</Text>
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    headerContainer: {
        position: 'absolute',
        top: 25,
        left: 25,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: rgba(colors.primary, .35),
    },
    backButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 15,
        fontFamily: fonts.RubikSemiBold,
        marginHorizontal: 5
    },
});

export default GoBack;
