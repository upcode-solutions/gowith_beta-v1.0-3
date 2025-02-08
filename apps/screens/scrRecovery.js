//context providers
import { useThemes } from '../providers/themes';

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function Recovery() {

  const { fonts, colors, rgba } = useThemes();

  return (
    <View>
      <Text>scrRecovery</Text>
    </View>
  )
}

const styles = StyleSheet.create({})