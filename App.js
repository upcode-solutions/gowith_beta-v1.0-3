//libraries
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
//providers
import NotificationProvider from './apps/providers/notification';
import ControlsProvider from './apps/providers/controls';
import ThemesProvider from './apps/providers/themes';
//main stacks
import MainStack from './apps/screens/stacks/navigatorMainStack';
//libraries
import * as ScreenOrientation from 'expo-screen-orientation';
//native hooks
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export default function App() {

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
    lockOrientation();
  }, []);

  return (
    <ControlsProvider>
      <ThemesProvider>
        <NavigationContainer>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.appContainer}>
              <NotificationProvider>
                <MainStack />
              </NotificationProvider>
            </View>
          </SafeAreaView>
        </NavigationContainer>
      </ThemesProvider>
    </ControlsProvider>
  )    
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white'
  },
  appContainer: {
    flex: 1,
    /* borderTopRightRadius: 14,
    borderTopLeftRadius: 14, */
    backgroundColor: 'rgb(49, 23, 135)',
    overflow: 'hidden'
  }
})