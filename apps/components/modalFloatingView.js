//libraries
import Modal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'
//react native components
import React from 'react'
import { View } from 'react-native'

export default function FloatingView({ isVisible, onClose, height, width, backdropColor, backdropOpacity, children }) {

    return (
        <SafeAreaView>
            <Modal
                isVisible={isVisible}
                onBackdropPress={onClose}
                backdropColor={backdropColor}
                backdropOpacity={backdropOpacity}
                backdropTransitionOutTiming={5}
                backdropTransitionInTiming={5}
                style={{ justifyContent: 'center', alignItems: 'center', margin: 0, padding: 0 }}
                animationIn={'zoomIn'}
                animationOut={'zoomOut'}
            >
                <View style={{ height: height, width: width, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', elevation: 12 }}>
                    {children}
                </View>
            </Modal>
        </SafeAreaView>
    )
}