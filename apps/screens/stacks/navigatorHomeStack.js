//context providers
import { useControls } from '../../providers/controls';
//libraries
import { createNativeStackNavigator } from '@react-navigation/native-stack'
//screens
import DrawerClient from './DrawerClient';
import DrawerRider from './DrawerRider';
//react native components
import React from 'react'

const Stack = createNativeStackNavigator() //initiate stack

export default function HomeStack() {

  //context variables
  const { localData } = useControls();
  console.log(localData.userType);
  

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {localData.userType === 'clients'
        ? <Stack.Screen name="DrawerClient" component={DrawerClient} />
        : <Stack.Screen name="DrawerRider" component={DrawerRider} />
      }
    </Stack.Navigator>
  )
}