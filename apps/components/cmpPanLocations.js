//context providers
import { useThemes } from '../providers/themes'
import { useGlobalStyles } from '../providers/styles'
//libraries
import { Ionicons } from '@expo/vector-icons'
//react native components
import React, { useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, Animated, Easing, PanResponder, View } from 'react-native'

export default function PanLocations({ bookingPoints, setBookingPoints, mapRef, setActions, bookingStatus }) {

    //context variables =====================================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);

    //references ============================================================
    const animatedY = useRef(new Animated.Value(170)).current; // Start collapsed
    const animatedYClamped = animatedY.interpolate({ inputRange: [55, 170], outputRange: [170, 55], extrapolate: 'clamp', });

    const panResponder = useRef(
        PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 3, // Detect small drags
        onPanResponderGrant: () => { // On drag start
            animatedY.setOffset(animatedY.__getValue());
            animatedY.setValue(0);
        },

        onPanResponderMove: (_, gesture) => { animatedY.setValue(gesture.dy); },

        onPanResponderRelease: (_, gesture) => { // On drag end
            animatedY.flattenOffset();
            const shouldExpand = gesture.dy < -50 || gesture.vy < -0.5; 
            const finalValue = shouldExpand ? 170 : 55;
    
            Animated.timing(animatedY, { toValue: finalValue, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true, }).start();
        },
        })
    ).current;

    //functions =============================================================
    const swapPoints = () => {
        setBookingPoints((prev) => {
          const newPoints = [...prev];
          const tempPoints = { latitude: newPoints[0].latitude, longitude: newPoints[0].longitude, geoName: newPoints[0].geoName, city: newPoints[0].city };
          newPoints[0] = { ...newPoints[0], latitude: newPoints[1].latitude, longitude: newPoints[1].longitude, city: newPoints[1].city, geoName: newPoints[1].geoName };
          newPoints[1] = { ...newPoints[1], latitude: tempPoints.latitude, longitude: tempPoints.longitude, city: tempPoints.city, geoName: tempPoints.geoName };
          return newPoints;
        });
      
        mapRef.current.fitToCoordinates([bookingPoints[0], bookingPoints[1]], { edgePadding: { top: 100, right: 100, bottom: 150, left: 100 }, animated: true });
      };

  return (
    <Animated.View
        style={[styles.floatingContainer, { transform: [{ translateY: animatedYClamped }] }]}
        {...panResponder.panHandlers}
    >
        <View style={styles.floatingDataContainer}>
            <TouchableOpacity 
                onPress={() => setActions((prev) => ({ ...prev, locationInputVisible: true, onFocus: 'pickup' }))}
                disabled={bookingStatus !== 'inactive'}
            >
                <Text style={styles.bookingPoints} numberOfLines={1}>
                    <Text style={[styles.bookingPoints, { color: rgba(colors.text, 0.5)}]} numberOfLines={1}>{`From: `}</Text>
                    {bookingPoints[0].geoName}
                </Text>
            </TouchableOpacity>
            <View style={globalStyles.dividerLine} />
            <TouchableOpacity 
                onPress={() => setActions((prev) => ({ ...prev, locationInputVisible: true, onFocus: 'dropoff' }))}
                disabled={bookingStatus !== 'inactive'}
            >
                <Text style={styles.bookingPoints} numberOfLines={1}>
                    <Text style={[styles.bookingPoints, { color: rgba(colors.text, 0.5)}]} numberOfLines={1}>{`To: `}</Text>
                    {bookingPoints[1].geoName}
                </Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.floatingContainerButton} onPress={() => swapPoints()} disabled={bookingStatus !== 'inactive'}>
            <Ionicons name="swap-vertical" size={17} color={colors.constantWhite}/>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.toggleCurrentLocationButton, { opacity: bookingPoints[3].geoName ? 1 : .5 }]} 
            disabled={!bookingPoints[3].geoName}
            onPress={() => { mapRef.current?.animateToRegion({ latitude: bookingPoints[3].latitude, longitude: bookingPoints[3].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }}
        >
            <Ionicons name="locate" size={17} color={colors.constantWhite}/>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.toggleRiderLocationButton, { opacity: bookingPoints[2].geoName ? 1 : 0 }]} 
            disabled={!bookingPoints[2].geoName}
            onPress={() => { mapRef.current?.animateToRegion({ latitude: bookingPoints[2].latitude, longitude: bookingPoints[2].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }}
        >
            <Ionicons name="bicycle" size={17} color={colors.constantWhite}/>
        </TouchableOpacity>
    </Animated.View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    floatingContainer: {
        flexDirection: 'row',
        height: 125,
        width: '100%',
        backgroundColor: colors.form,
        alignSelf: 'center',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: colors.tertiary,
        elevation: 5, 
        marginBottom: 10
    },
    floatingDataContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'left',
        gap: 1.5
    },
    bookingPoints: {
        height: 45,
        fontFamily: fonts.Righteous,
        fontSize: 15,
        color: colors.text,
        textAlign: 'left',
        textAlignVertical: 'center',
        letterSpacing: 0.5,
    },
    floatingContainerButton: {
        alignSelf: 'center',
        backgroundColor: colors.primary,
        padding: 5,
        borderRadius: 12,
    },
    toggleCurrentLocationButton: {
        position: 'absolute',
        left: 0,
        top: -55, 
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    toggleRiderLocationButton: {
        position: 'absolute',
        left: 55,
        top: -55, 
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
})