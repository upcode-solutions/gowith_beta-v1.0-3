//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//screens
import Home from '../scrHome'
//react native components
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const Stack = createNativeStackNavigator() //initiate stack

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScren" component={Home} />
    </Stack.Navigator>
  )
}