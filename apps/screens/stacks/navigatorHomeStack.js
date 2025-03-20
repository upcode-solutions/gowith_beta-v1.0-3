//context providers
import { useControls } from '../../providers/controls';
//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//screens
import DrawerClient from './DrawerClient';
import DrawerRider from './DrawerRider';
import AccidentView from '../scrAccidentView';
//react native components
import React from 'react'

const Stack = createNativeStackNavigator() //initiate stack

export default function HomeStack() {

  //context variables
  const { localData, firestoreUserData } = useControls();  

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      { firestoreUserData && firestoreUserData.accountDetails.accidentOccured
        ? <Stack.Screen name="AccidentView" component={AccidentView} /> 
        : localData.userType === 'clients'
          ? <Stack.Screen name="DrawerClient" component={DrawerClient} />
          : <Stack.Screen name="DrawerRider" component={DrawerRider} />
      }
    </Stack.Navigator>
  )
}