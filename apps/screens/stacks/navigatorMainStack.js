//context providerts
import { useControls } from '../../providers/controls'
//screen navigators
import AuthStack from './navigatorAuthStack'
import HomeStack from './navigatorHomeStack'
//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//react native components
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Stack = createNativeStackNavigator() //initiate stack

export default function navigatorMainStack() {

  const { localControls } = useControls();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      { localControls.loggedIn
        ? <Stack.Screen name="Home" component={HomeStack} />
        : <Stack.Screen name="Auth" component={AuthStack} />
      }
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({})