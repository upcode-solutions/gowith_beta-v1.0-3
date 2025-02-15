//libraries
import Modal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'
//react native components
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function FloatingView({ isVisible, onClose, height, width, backdropColor, backdropOpacity, children }) {

    return (
        <SafeAreaView>
            <Modal
                isVisible={isVisible}
                onBackdropPress={onClose}
                backdropColor={backdropColor}
                backdropOpacity={backdropOpacity}
                backdropTransitionInTiming={5}
                backdropTransitionOutTiming={5}
                style={{ justifyContent: 'center', alignItems: 'center', margin: 0, padding: 0 }}
                animationIn={'zoomIn'}
                animationOut={'zoomOut'}
            >
                <View style={[styles.container, { height: height, width: width }]}>
                    {children}
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = () => StyleSheet.create({
    container: {
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        elevation: 5,
    },
})