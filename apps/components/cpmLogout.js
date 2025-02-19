//providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
//drawer
import { DrawerItem } from '@react-navigation/drawer';
//packages
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { ref, remove } from 'firebase/database'; // For Realtime Database
import { doc, updateDoc } from 'firebase/firestore'; // For Cloud Firestore
//native components
import React from 'react'
import { View } from 'react-native'

export default function Logout({ styleControls }) {

    const { localControls, firestoreUserData, initiateLogoutHandler } = useControls();
    const { colors } = useThemes(); //theme context

  return (
    <View style={{ height: 'fit-content', gap: 10}}>
      <View style={{ height: 1.5, backgroundColor: localControls.darkMode ? colors.constantWhite : styleControls.fontColor, marginHorizontal: 15 }}/>
      <DrawerItem
        label="Logout"
        labelStyle={{ fontSize: styleControls.fontSize, color: styleControls.fontColor, fontFamily: styleControls.font, marginLeft: styleControls.iconMarginLeft, letterSpacing: styleControls.letterSpacing }}
        style={{ borderRadius: styleControls.border }}
        icon={() => 
            <Ionicons 
                name='log-out-outline'
                size={styleControls.iconSize}
                color={colors.text}
                style={{ marginLeft: styleControls.iconMarginLeft }}
            />
        }
        contentContainerStyle={{ paddingLeft: 50 }} // Add padding here
        onPress={() => initiateLogoutHandler(false)}
      />
    </View>
  )
}