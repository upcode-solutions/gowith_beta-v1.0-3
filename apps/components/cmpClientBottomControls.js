//context providers
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import BottomSheet from '../components/modalBottomSheet';
import FloatingView from '../components/modalFloatingView';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
//react native hooks
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, Animated, Easing, PanResponder, Keyboard, Dimensions, View } from 'react-native'

export default function ClientBottomControls({ bookingPoints, setBookingPoints, mapRef, bookingStatus, bookingDetails, bookingHandler, transactionCompleteHandler }) {

    //context variables ======================================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles( fonts, colors, rgba );
    const styles = createStyles(fonts, colors, rgba);
    //local variables ========================================================
    const [actions, setActions] = useState({ locationInputVisible: false, fareDetailsVisible: false, onFocus: '', keyboardVisible: false, fetchLocation: false });  
    const count = actions.onFocus === 'pickup' ? 0 : 1;
    const [location, setLocation] = useState([]);
    const [confirmationAction, setConfirmationAction] = useState({ isVisible: false, action: '', message: '' });
    //references =============================================================
    const inputRef = useRef(null);
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

    //functions ==============================================================
    const userCurrentLocation = () => {
        const { latitude, longitude, geoName } = bookingPoints[3];
        
        setBookingPoints((prev) => {
            const newPoint = [...prev];
            newPoint[count] = { ...prev[count], latitude, longitude, geoName, };
            return newPoint;
        });
    }

    const fetchLocation = async () => {
        try {
            setActions((prev) => ({ ...prev, fetchingLocation: true }));
            const coordinates = await Location.geocodeAsync(location.geoName)
            const { latitude, longitude } = coordinates[0];
            const city = await Location.reverseGeocodeAsync({ latitude, longitude }).then((res) => res[0].city);
            
            setBookingPoints((prev) => {
                const newPoint = [...prev];
                newPoint[count] = { ...newPoint[count], latitude, longitude, geoName: location.geoName, city: city };
                return newPoint;
            })

            setActions((prev) => ({ ...prev, fetchingLocation: false }));
        } catch (e) { 
            console.log(e); 
            setActions((prev) => ({ ...prev, fetchingLocation: false }));
        }
    }

    const confirmLocationInput = async () => {
        try {
            await fetchLocation(); // Ensure fetchLocation completes before proceeding
    
            setBookingPoints((prev) => {
                const newPoint = [...prev];
                newPoint[count] = { ...prev[count], geoName: location.geoName };
                return newPoint;
            });

            Keyboard.dismiss();
            setActions((prev) => ({ ...prev, locationInputVisible: false, onFocus: '' }));
        } catch (e) { console.log(e); }
    }

    const swapPoints = () => { //swap locations
        setBookingPoints((prev) => {
          const newPoints = [...prev];
          const tempPoints = { latitude: newPoints[0].latitude, longitude: newPoints[0].longitude, geoName: newPoints[0].geoName, city: newPoints[0].city };
          newPoints[0] = { ...newPoints[0], latitude: newPoints[1].latitude, longitude: newPoints[1].longitude, city: newPoints[1].city, geoName: newPoints[1].geoName };
          newPoints[1] = { ...newPoints[1], latitude: tempPoints.latitude, longitude: tempPoints.longitude, city: tempPoints.city, geoName: tempPoints.geoName };
          return newPoints;
        });
      
        mapRef.current.fitToCoordinates([bookingPoints[0], bookingPoints[1]], { edgePadding: { top: 100, right: 100, bottom: 150, left: 100 }, animated: true });
    };

    const confirmationHandler = () => { 
        if (confirmationAction.action === 'transactionComplete') { transactionCompleteHandler() }
        setConfirmationAction((prev) => ({ ...prev, isVisible: false }));
    }

    //useEffect ==============================================================
    useEffect(() => {
        const timeout = setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); } }, 100); // Delay to ensure component is ready
        return () => clearTimeout(timeout); // Cleanup on unmount
    }, []);

    useEffect(() => {
        if (actions.onFocus === 'pickup') { setLocation(bookingPoints[0]); } 
        else { setLocation(bookingPoints[1]); }
    }, [bookingPoints, actions.onFocus]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => { setActions(prev => ({ ...prev, keyboardVisible: true })); });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { setActions(prev => ({ ...prev, keyboardVisible: false })); });
    
        return () => { keyboardDidShowListener.remove(); keyboardDidHideListener.remove(); };
    }, []);

    useEffect(() => {
        if (!actions.keyboardVisible && location.geoName) { fetchLocation(); }
    }, [actions.keyboardVisible, location.geoName]);

    useEffect(() => {
        //console.log(`Booking Status: ${bookingDetails?.bookingDetails?.bookingStatus}`);
        if (bookingDetails?.bookingDetails?.bookingStatus === 'complete') {
            setConfirmationAction({ isVisible: true, action: "transactionComplete", message: 'Transaction Complete, please pay the rider with the right amount before you confirm' }); 
        }
    }, [bookingDetails.bookingDetails]);


    //rendering ==============================================================
  return (
    <View style={styles.bottomContainer}>

        <FloatingView
            isVisible={confirmationAction.isVisible}
            onClose={() => {}}
            backdropOpacity={.25}
            height={'fit-content'}
            width={Dimensions.get('window').width * .75}
        >
        <View style={styles.confirmationContainer}>
            <View style={styles.messageContainer}>
            <Text style={[globalStyles.priceContainerText, { textAlign: 'center', fontSize: 15 }]}>{confirmationAction.message}</Text>
            </View>
            <View style={styles.buttonContainer}>
            <TouchableOpacity style={[globalStyles.primaryButton, { flex: 1 }]} onPress={() => confirmationHandler()}>
                <Text style={globalStyles.primaryButtonText}>CONFIRM</Text>
            </TouchableOpacity>
            </View>
        </View>
        </FloatingView>

        <BottomSheet
            isVisible={actions.locationInputVisible}
            onClose={() => {actions.fetchLocation ? null : setActions((prev) => ({ ...prev, locationInputVisible: false }))}}
            backgroundColor={colors.background}
            height={'90%'}
            children={
                <View style={styles.inputContainer}>
                    <View style={globalStyles.textBox}>
                        <TextInput
                            ref={inputRef}
                            style={[globalStyles.input, { flex: 1 }]}
                            placeholder={`Enter your ${actions.onFocus} point`}
                            placeholderTextColor={rgba(colors.text, .5)}
                            value={location.geoName}
                            onChange={(e) => setLocation({ ...location, geoName: e.nativeEvent.text })}
                            returnKeyType='done'
                        />
                        <TouchableOpacity onPress={() => setLocation((prev) => ({ ...prev, geoName: '' }))}>
                            <Ionicons name="close" color={colors.primary} size={25} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.currentLocationContainer} onPress={() => userCurrentLocation()}>
                        <Ionicons name="location-outline" color={colors.primary} size={25} />
                        <Text style={[globalStyles.input, { fontFamily: fonts.Righteous, color: colors.primary }]} numberOfLines={1}>{`Use Current Location: ${bookingPoints[3].geoName}`}</Text>
                    </TouchableOpacity>
                    <View style={styles.suggestionContainer} onPress={() => Keyboard.dismiss()}>
            
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={globalStyles.primaryButton} 
                            onPress={() => confirmLocationInput()}
                            disabled={actions.fetchingLocation}
                        >
                            <Text style={globalStyles.primaryButtonText}>SELECT LOCATION</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            }
        />

        <BottomSheet
          isVisible={actions.fareDetailsVisible}
          onClose={() => setActions((prev) => ({ ...prev, fareDetailsVisible: false }))}
          backgroundColor={colors.background}
        >
          <View style={{ gap: 10}}>
            <View style={[globalStyles.priceContainer, { flexDirection: `column`}]}>
              {Object.entries(bookingDetails).filter(([key, value]) => ['price', 'distance', 'duration'].includes(key)).map(([key, value], index) => (
                <View key={index} style={[globalStyles.priceDataContainer, { width: '100%'}]}>
                  <Text style={[globalStyles.priceContainerText, { color: rgba(colors.text, 0.5) }]}>{key.toUpperCase()}</Text>
                  <Text style={globalStyles.priceContainerText}>{key === 'price' ? `₱ ${value}` : key === 'distance' ? `${value} km` : `~ ${Math.ceil(value)} min`}</Text>
                </View>
              ))}
            </View>
            <View style={globalStyles.buttonContainer}>
              <TouchableOpacity style={globalStyles.primaryButton} onPress={() => setActions((prev) => ({ ...prev, fareDetailsVisible: false }))}>
                  <Text style={globalStyles.primaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        <View style={styles.floatingContainerWrapper}>
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

                <LinearGradient
                    colors={[rgba(colors.secondary, 0.15), rgba(colors.secondary, 0.15)]}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0 }}
                />
            </Animated.View>
        </View>

        <View style={globalStyles.bottomControls}>
          <View style={globalStyles.priceContainer}>
            <Text style={globalStyles.priceContainerText}>PRICE</Text>
            <View style={globalStyles.priceDataContainer}>
              <Text style={globalStyles.priceContainerText}>{`₱ ${bookingDetails.price}`}</Text>
              <Ionicons style={globalStyles.priceContainerIcon} name="information-circle-outline" onPress={() => setActions((prev) => ({ ...prev, fareDetailsVisible: true }))}/>
            </View>
          </View>
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { opacity: bookingStatus === 'pending' ? 0.5 : 1 }]} 
            onPress={() => bookingHandler()}
            disabled={bookingStatus === 'pending' || bookingPoints[0].city === '' && bookingPoints[1].city === ''}
          >
            <Text style={globalStyles.primaryButtonText}>{bookingStatus === 'active' || bookingStatus === 'onQueue' ? 'Cancel Booking' : 'Book Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    confirmationContainer: {
        height: 'fit-content',
        width: '100%',
        backgroundColor: colors.background,
        alignSelf: 'center',
        borderRadius: 12,
        padding: 15,
        gap: 10
    },
    messageContainer: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: colors.form,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10
    },
    inputContainer: {
        height: '100%',
        paddingBottom: 15,
        gap: 10
    },
    currentLocationContainer: {
        height: 45,
        width: '100%',
        backgroundColor: rgba(colors.secondary, .35),
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        gap: 10
    },
    suggestionContainer: {
        flex: 1,
        backgroundColor: colors.form,
        borderRadius: 12,
        width: '100%',
        paddingHorizontal: 25,
    },
    buttonContainer: {
        height: 45,
        width: '100%',
    },

    bottomContainer: {
        backgroundColor: colors.background,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        zIndex: 99,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        shadowColor: colors.shadowGray,
        elevation: 6,
    },
    floatingContainerWrapper: {
        height: 190,
        position: 'absolute',
        top: -190,
        width: '100%',
        overflow: 'hidden', 
        alignSelf: 'center',
        zIndex: -1, 
        paddingHorizontal: 15,
    },
    floatingContainer: {
        flexDirection: 'row',
        height: 125,
        width: '100%',
        alignSelf: 'center',
        marginBottom: 10,
        backgroundColor: colors.form,
        borderRadius: 12,
        paddingHorizontal: 25,
        paddingVertical: 10,
        shadowColor: colors.shadowGray,
        elevation: 10,
    },
    linearGradient: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.form,
        borderRadius: 12,
        paddingHorizontal: 25,
        paddingVertical: 10,
        overflow: 'hidden',
        position: 'absolute',
        inset: 0,
        zIndex: -1,
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