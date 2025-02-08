//context providers
import { useControls } from '../../providers/controls'

import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'

export default function HomeStack() {

  const { initiateLogoutHandler } = useControls();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity style={styles.button} onPress={() => initiateLogoutHandler(false)}>
        <Text>navigatorHomeStack</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5
  }
})