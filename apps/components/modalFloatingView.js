//libraries
import Modal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'
//react native components
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function FloatingView({ isVisible, onClose, height, width, backdropColor, backdropOpacity, children }) {

    //local variables
    const styles = createStyles(height, width);

    return (
        <SafeAreaView>
            <Modal
                isVisible={isVisible}
                onBackdropPress={onClose}
                backdropColor={backdropColor}
                backdropOpacity={backdropOpacity}
                backdropTransitionOutTiming={1}
                style={{ justifyContent: 'center', alignItems: 'center', margin: 0, padding: 0 }}
                animationIn={'zoomIn'}
                animationOut={'zoomOut'}
            >
                <View style={styles.container}>
                    {children}
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const createStyles = (height, width) => StyleSheet.create({
    container: {
        height: height,
        width: width,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        elevation: 5,
    },
})