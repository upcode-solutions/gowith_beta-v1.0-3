//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//screens
import Auth from '../scrAuth'
import Recovery from '../scrRecovery'
import Setup from '../scrSetup'
//react native components
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Stack = createNativeStackNavigator() //initiate stack

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName='SetupScreen' screenOptions={{ headerShown: false }} >
      <Stack.Screen name="AuthScreen" component={Auth} />
      <Stack.Screen name="SetupScreen" component={Setup} />
      <Stack.Screen name="RecoveryScreen" component={Recovery} />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({})