//context providers
import { useThemes } from '../providers/themes';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native hooks
import React from 'react'
import { StyleSheet, View, Text } from 'react-native'

export default function BookingIndicator({ bookingStatus }) {

    //context providers
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
        <Ionicons name="ellipse" size={15} color={bookingStatusHandler().color} />
        <Text style={[styles.text, { color: bookingStatusHandler().color }]}>{bookingStatusHandler().status.toUpperCase()}</Text>
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.form,
        position: 'absolute',
        right: 0,
        top: 0,
        justifyContent: 'center',
        alignItems: 'center',
        width: 'fit-content',
        height: 45,
        borderRadius: 25,
        marginTop: 15,
        marginRight: 15,
        paddingHorizontal: 15,
        gap: 10,
        zIndex: 1,
        shadowColor: colors.shadowColor,
        elevation: 5
    },
    text: {
        fontFamily: fonts.Righteous,
        fontSize: 15,
    }
})