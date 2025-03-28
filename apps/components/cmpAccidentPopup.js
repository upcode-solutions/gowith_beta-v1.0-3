//context providers
import { useThemes } from '../providers/themes'
import { useGlobalStyles } from '../providers/styles'
//components
import FloatingView from './modalFloatingView'
//libraries
import { Ionicons } from '@expo/vector-icons'
//react native components
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react'

export default function AccidentPopup({ actions, setActions, warningTimeout, accidentHandler }) {

    //context variables
    const { colors, fonts, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    //local variables
    const [countDown, setCountDown] = useState(15);

    //functions
    const closeWarning = () => {
        setActions((prev) => ({...prev, tiltWarningVisible: false}));
        warningTimeout.current = null; 
    };
    const sosHandler = () => {
        closeWarning();
        setTimeout(() => accidentHandler(), 1500);
    };

    //useEffects
    useEffect(() => {
        if(actions.tiltWarningVisible) {
            if(countDown > 0) {
                let timer = setTimeout(() => setCountDown((prev) => prev - 1), 1000);
                return () => clearTimeout(timer);
            } else { 
                sosHandler(); 
            }
        } else { setTimeout(() => setCountDown(15), 1500); }
    }, [countDown, actions.tiltWarningVisible]);

  return (
    <FloatingView
        isVisible={actions.tiltWarningVisible}
        onClose={() => {}}
        backdropOpacity={.10}
        backdropColor={colors.errorRedBackground}
        height={'fit-content'}
        width={Dimensions.get('window').width * .75}
    >
        <View style={styles.container}>
            <View style={styles.messageContainer}>
                <Text style={[globalStyles.priceContainerText, styles.warningText]}>
                    Are you okay? Your device has been tilted for a long period of time. SOS protocol will be activated in 
                    { <Text style={[globalStyles.priceContainerText, styles.warningText, {color: colors.errorRedBackground}]}>{` ${countDown} seconds. `}</Text> }
                </Text>
                
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[globalStyles.primaryHollowButton, {flex: 1, borderColor: colors.errorRedBackground}]} onPress={() => closeWarning()}>
                    <Text style={[globalStyles.primaryHollowButtonText, {color: colors.errorRedBackground}]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[globalStyles.primaryButton, {flex: 1, backgroundColor: colors.errorRedBackground}]} onPress={() => sosHandler()}>
                    <Text style={globalStyles.primaryButtonText}>No</Text>
                </TouchableOpacity>
            </View>
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
    },
    messageContainer: {
        backgroundColor: rgba(colors.errorRedBackground, .15),
        padding: 15,
        borderRadius: 12,
    },
    warningText: {
        fontFamily: fonts.Righteous,
        fontSize: 15,
        color: colors.text,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10
    }
})