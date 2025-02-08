//context providers
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';

import React from 'react'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'

export default function Loading({ loadingBackgroundColor, loadingMessage, ActivityIndicatorColor, textColor }) {

    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, textColor);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: loadingBackgroundColor || colors.primary}]}>
      <ActivityIndicator size={50} color={ActivityIndicatorColor || colors.constantWhite} />
      <Text style={[globalStyles.headerText, styles.text]}>{loadingMessage || 'Loading...'}</Text>
    </View>
  )
}

const createStyles = (fonts, colors, textColor) => StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20
    },
    text: {
      fontFamily: fonts.RubikSemiBold,
      fontSize: 16,
      color: textColor
    }
})