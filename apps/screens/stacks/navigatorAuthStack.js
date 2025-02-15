//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//screens
import Auth from '../scrAuth'
import Setup from '../scrSetup'
import RecoveryStack from './navigationRecoveryStack'
//react native components
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Stack = createNativeStackNavigator() //initiate stack

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName='AuthScreen' screenOptions={{ headerShown: false }} >
      <Stack.Screen name="AuthScreen" component={Auth} />
      <Stack.Screen name="SetupScreen" component={Setup} />
      <Stack.Screen name="RecoveryStack" component={RecoveryStack} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({})