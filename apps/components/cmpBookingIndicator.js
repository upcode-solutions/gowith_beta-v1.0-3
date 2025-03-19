//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
//libraries
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
//react native hooks
import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'

export default function BookingIndicator({ bookingStatus, accidentHandler }) {

    //context providers
    const { localData } = useControls();
    const { fonts, colors, rgba } = useThemes();
    const styles = createStyles(fonts, colors, rgba);
    

    //functions
    const bookingStatusHandler = () => {
        let status = '';
        let color = '';
        
        switch (bookingStatus) {
            case 'inactive': status = 'Inactive'; color = colors.errorRedBackground; break;
            case 'active': status = 'Active'; color = colors.successGreenBackground; break;
            case 'pending': status = 'Pending'; color = colors.warningYellowBackground; break;
            case 'onQueue': status = 'Queuing'; color = colors.warningYellowBackground; break;
            default: status = 'Inactive'; color = colors.errorRedBackground; break;
        }

        return { status, color };
    }

  return (
    <View style={styles.container}>
        { localData && localData.userType === 'riders' &&
            <TouchableOpacity style={styles.sosButton} onPress={() => accidentHandler()}>
                <MaterialIcons name="sos" size={24} color={colors.form} />
            </TouchableOpacity>
        }
        <View style={styles.indicatorContainer}>
            <Ionicons name="ellipse" size={15} color={bookingStatusHandler().color} />
            <Text style={[styles.text, { color: bookingStatusHandler().color }]}>{bookingStatusHandler().status.toUpperCase()}</Text>
        </View>
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        position: 'absolute',
        right: 15,
        top: 15,
        gap: 15,
        zIndex: 1
    },
    sosButton: {
        height: 45,
        width: 45,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.errorRedBackground,
        justifyContent: 'center',
        shadowColor: colors.shadowGray,
        elevation: 5
    },
    indicatorContainer: {
        height: 45,
        width: 'fit-content',
        flexDirection: 'row',
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingRight: 17.5,
        borderRadius: 50,
        shadowColor: colors.shadowGray,
        elevation: 5,
        gap: 5
    },
    text: {
        fontFamily: fonts.Righteous,
        fontSize: 15,
    }
})