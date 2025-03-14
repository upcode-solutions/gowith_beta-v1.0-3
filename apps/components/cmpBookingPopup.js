import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import FloatingView from '../components/modalFloatingView';
import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function BookingPopup({ bookingCollection }) {
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);

    // State to track the current booking being displayed
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Ensure bookingCollection is valid and has entries
    const filteredBookings = bookingCollection.filter((booking) => booking?.bookingDetails?.queueNumber);

    useEffect(() => {
        if (filteredBookings.length > 0 && currentIndex < filteredBookings.length) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [currentIndex, filteredBookings]);

    // If there are no bookings left, return nothing
    if (filteredBookings.length === 0 || currentIndex >= filteredBookings.length) {
        return null;
    }

    const currentBooking = filteredBookings[currentIndex];

    return (
        <FloatingView
            isVisible={isVisible}
            onClose={() => {
                setIsVisible(false);
                setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                }, 200); // Delay to ensure smooth transition
            }}
            height={180}
            width={Dimensions.get('window').width * 0.9}
            backdropOpacity={0.25}
        >
            <View style={styles.container}>
                <Text style={globalStyles.priceContainerText}>
                    Queue No: {currentBooking.bookingDetails.queueNumber}
                </Text>
                <Text style={globalStyles.priceContainerText}>
                    Price: {currentBooking.bookingDetails.price ?? 'N/A'}
                </Text>
                <Text style={globalStyles.priceContainerText}>
                    Distance: {currentBooking.bookingDetails.distance ?? 'N/A'} km
                </Text>

                {/* Close Button */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                        setIsVisible(false);
                        setTimeout(() => {
                            setCurrentIndex((prev) => prev + 1);
                        }, 200);
                    }}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
        </FloatingView>
    );
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: colors.primary,
        minHeight: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
