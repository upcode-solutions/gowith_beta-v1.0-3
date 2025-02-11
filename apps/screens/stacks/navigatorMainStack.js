//context providers
import { useControls } from '../../providers/controls'
//screen navigators
import Suspended from '../scrSuspended'
import AuthStack from './navigatorAuthStack'
import HomeStack from './navigatorHomeStack'
//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//react native components
import React from 'react'
import { StyleSheet } from 'react-native'

const Stack = createNativeStackNavigator() //initiate stack

export default function navigatorMainStack() {
  const { localControls, firestoreUserData } = useControls();
  const { loggedIn } = localControls;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      { firestoreUserData.accountDetails?.suspensionDate?.length > 0
        ? <Stack.Screen name="SuspendedScreen" component={Suspended} />
        : loggedIn
          ? <Stack.Screen name="HomeStack" component={HomeStack} />
          : <Stack.Screen name="AuthStack" component={AuthStack} />
      }
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({})