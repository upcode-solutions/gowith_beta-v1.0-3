//context providers
import { useThemes } from '../providers/themes'
import { useGlobalStyles } from '../providers/styles'
//components
import FloatingView from '../components/modalFloatingView'
//react native components
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function AccidentView() {

  //context variables
  const { colors, fonts, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);

  return (
    <View style={styles.container}>
      <Text>Accident View</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
})