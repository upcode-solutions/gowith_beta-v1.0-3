import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function Setup({ navigation, route }) {

    const { authLocalData } = route.params;
    console.log(authLocalData);

  return (
    <View>
      <Text>scrSetup</Text>
    </View>
  )
}

const styles = StyleSheet.create({})