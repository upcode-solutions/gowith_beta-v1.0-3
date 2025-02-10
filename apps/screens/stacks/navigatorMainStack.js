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
  const suspensionDate = firestoreUserData?.accountDetails?.suspensionDate;

  // Parse the suspensionDate and compare it with the current date
  const isSuspended = suspensionDate ? new Date(suspensionDate.split('/').reverse().join('-')) > new Date() : false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      { isSuspended
        ? <Stack.Screen name="Suspended" component={Suspended} />
        : loggedIn
          ? <Stack.Screen name="HomeStack" component={HomeStack} />
          : <Stack.Screen name="AuthStack" component={AuthStack} />
      }
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({})