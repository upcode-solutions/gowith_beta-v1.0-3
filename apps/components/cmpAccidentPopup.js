//context providers
import { useThemes } from '../providers/themes'
import { useGlobalStyles } from '../providers/styles'
//components
import FloatingView from './modalFloatingView'
//react native components
import { StyleSheet, Text, View, Dimensions } from 'react-native'
import React from 'react'

export default function AccidentPopup({ actions, setActions }) {

    const { colors, fonts, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);

  return (
    <FloatingView
        isVisible={actions.tiltWarningVisible}
        onClose={() => {}}
        backdropOpacity={.15}
        height={'fit-content'}
        width={Dimensions.get('window').width * .75}
    >
        <View style={styles.container}>
            <Text>warning</Text>
        </View>
    </FloatingView>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    container: {
        height: 'fit-content',
        width: '100%',
        backgroundColor: colors.background,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 15,
        shadowColor: colors.shadowColor,
        elevation: 5,
        gap: 15
    }
})