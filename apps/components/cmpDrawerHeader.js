//context providers
import { useThemes } from '../providers/themes';
//libraries
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
//react native hooks
import React from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'

export default function DrawerHeader() {
    
    //initialize navigation
    const navigation = useNavigation();
    //context providers
    const { fonts, colors, rgba } = useThemes();
    const styles = createStyles(fonts, colors, rgba);

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.drawerButton} onPress={() => navigation.toggleDrawer()}>
        <Ionicons name="menu" size={22} color="white" />
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        width: '100%',
        paddingVertical: '5%',
        paddingHorizontal: 20,
    },
    drawerButton: {
        backgroundColor: colors.primary,
        width: 47.5,
        height: 47.5,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.shadoGray,
        elevation: 10
    },
})