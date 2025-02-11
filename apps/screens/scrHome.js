//context providers
import { useControls } from '../providers/controls';

import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'

export default function Home() {

  //comtext providers
  const { initiateLogoutHandler } = useControls();

  return (
    <View>
      <Text>scrHome</Text>
      <Button title='Logout' onPress={() => initiateLogoutHandler()}/>
    </View>
  )
}

const styles = StyleSheet.create({})