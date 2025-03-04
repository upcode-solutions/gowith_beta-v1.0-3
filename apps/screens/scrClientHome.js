//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import BottomSheet from '../components/modalBottomSheet';
import LocationInput from '../components/cmpLocationInput';
//libraries
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
//react native hooks
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Animated, PanResponder, Easing } from 'react-native'

export default function ClientHome() {

  //contexts providers ===================================================
  const { localControls } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables =======================================================
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: '', type: 'pickup' },
    { longitude: '', latitude: '', geoName: '', type: 'dropoff' },
    { longitude: '' , latitude: '', geoName: '', type: 'riders' },
    { longitude: '' , latitude: '', geoName: '', type: 'clients' },
  ]);
  const [bookingDetails, setBookingDetails] = useState({ price: '0', duration: '0', distance: '0'  });
  const [actions, setActions] = useState({ locationAnimated: false, locationInputVisible: false, fareDetailsVisible: false, fetchingLocation: false, onFocus: '' });
  
  //references ============================================================
  const mapRef = useRef(null);
  const animatedY = useRef(new Animated.Value(170)).current; // Start collapsed
  const animatedYClamped = animatedY.interpolate({ inputRange: [55, 170], outputRange: [170, 55], extrapolate: 'clamp', });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2, // Detect small drags
      onPanResponderGrant: () => {
        animatedY.setOffset(animatedY.__getValue()); // Save current position
        animatedY.setValue(0); // Reset animated value to zero before moving
      },
      onPanResponderMove: (_, gesture) => {
        animatedY.setValue(gesture.dy); // Update animation in real-time
      },
      onPanResponderRelease: (_, gesture) => {
        animatedY.flattenOffset(); // Merge offset into base value
        const shouldExpand = gesture.dy < -50 || gesture.vy < -0.5; // Detect upward swipe
        const finalValue = shouldExpand ? 170 : 55;
  
        Animated.timing(animatedY, {
          toValue: finalValue,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;
  

  //functions =============================================================
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const swapPoints = () => {

    setBookingPoints((prev) => {
      const newPoints = [...prev];
      const temp = newPoints[0];
      newPoints[0] = newPoints[1];
      newPoints[1] = temp;
      return newPoints;
    });

    mapRef.current.fitToCoordinates(bookingPoints, { edgePadding: { top: 100, right: 100, bottom: 150, left: 100 }, animated: true });
  }

  //useEffects ============================================================
  useEffect(() => { //animation at first render
      if (bookingPoints[3].latitude !== '' && bookingPoints[3].longitude !== '' && !actions.locationAnimated) {
        setTimeout(() => { mapRef.current?.animateToRegion({ longitude: bookingPoints[3].longitude, latitude: bookingPoints[3].latitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }, 2700);
        setActions((prev) => ({ ...prev, locationAnimated: true }));
      }
    }, [bookingPoints[3]]);

  useEffect(() => {
    let locationSubscription = null;

    const startLocationTracking = async () => {
      if (!await requestForegroundPermissions()) { return; }
      
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2.5 },
        async (location) => {
          const { latitude, longitude } = location.coords;
          if (!latitude || !longitude) { return }
          
          setTimeout(() => { setLoading(false); }, 2500);
          
          const currentCity = await Location.reverseGeocodeAsync(location.coords);

          setBookingPoints((prev) => {
            const newPoint = [...prev];
            newPoint[3] = { ...prev[3], longitude, latitude, geoName: currentCity[0].formattedAddress, type: 'clients' };
            return newPoint;
          });
        }
      );
    }

    startLocationTracking();
    return () => { locationSubscription && locationSubscription.remove(); }
  }, []);

  //render ================================================================
  if (loading) { //loading screen
    return (
      <Loading 
        loadingBackgroundColor={colors.background} 
        loadingMessage={'Preparing Map...'} 
        ActivityIndicatorColor={colors.primary}
        textColor={colors.primary}
      />
    ); 
  }

  return (
    <View style={globalStyles.container}>

      <BookingIndicator bookingStatus={bookingStatus} />
      
      <View style={styles.bottomContainer}>

        <BottomSheet
          isVisible={actions.locationInputVisible}
          onClose={() => {actions.fetchingLocation ? null : setActions((prev) => ({ ...prev, locationInputVisible: false }))}}
          backgroundColor={colors.background}
          height={'90%'}
          children={
            <LocationInput 
              setBookingPoints={setBookingPoints} 
              bookingPoint={bookingPoints}
              homeActions={actions}
              setHomeActions={setActions}
              onFocus={actions.onFocus}
            />
          }
        />

        <BottomSheet
          isVisible={actions.fareDetailsVisible}
          onClose={() => setActions((prev) => ({ ...prev, fareDetailsVisible: false }))}
          backgroundColor={colors.background}
        >
          <View style={{ gap: 10}}>
            <View style={[styles.priceContainer, { flexDirection: `column`}]}>
              {Object.entries(bookingDetails).map(([key, value], index) => (
                <View key={index} style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={[styles.priceContainerText, { color: rgba(colors.text, 0.5) }]}>{key.toUpperCase()}</Text>
                  <Text style={styles.priceContainerText}>{key === 'price' ? `₱ ${value}` : key === 'distance' ? `${value} km` : `~ ${Math.ceil(value)} min`}</Text>
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
            <View style={styles.floatingContainerDataContainer}>
              <TouchableOpacity onPress={() => setActions((prev) => ({ ...prev, locationInputVisible: true, onFocus: 'pickup' }))}>
                <Text style={styles.bookingPoints} numberOfLines={1}>
                  <Text style={[styles.bookingPoints, { color: rgba(colors.text, 0.5)}]} numberOfLines={1}>{`From: `}</Text>
                  {bookingPoints[0].geoName}
                </Text>
              </TouchableOpacity>
              <View style={globalStyles.dividerLine} />
              <TouchableOpacity onPress={() => setActions((prev) => ({ ...prev, locationInputVisible: true, onFocus: 'dropoff' }))}>
                <Text style={styles.bookingPoints} numberOfLines={1}>
                  <Text style={[styles.bookingPoints, { color: rgba(colors.text, 0.5)}]} numberOfLines={1}>{`To: `}</Text>
                  {bookingPoints[1].geoName}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.floatingContainerButton} onPress={() => swapPoints()}>
              <Ionicons name="swap-vertical" size={17} color={colors.constantWhite}/>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleCurrentLocationButton, { opacity: bookingPoints[3].geoName ? 1 : 0 }]} 
              disabled={!bookingPoints[3].geoName}
              onPress={() => { mapRef.current?.animateToRegion({ latitude: bookingPoints[3].latitude, longitude: bookingPoints[3].longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }}
            >
              <Ionicons name="locate" size={17} color={colors.constantWhite}/>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceContainerText}>PRICE</Text>
            <View style={styles.priceContainerDataContainer}>
              <Text style={styles.priceContainerText}>{`₱ ${bookingDetails.price}`}</Text>
              <Ionicons style={styles.priceContainerIcon} name="information-circle-outline" onPress={() => setActions((prev) => ({ ...prev, fareDetailsVisible: true }))}/>
            </View>
          </View>
          <TouchableOpacity style={globalStyles.primaryButton} onPress={() => {}}>
            <Text style={globalStyles.primaryButtonText}>Edit Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Mapview 
        mapRef={mapRef}
        points={bookingPoints}
        setBookingDetails={setBookingDetails}
      />

    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  floatingContainerWrapper: {
    height: 195,
    position: 'absolute',
    top: -195,
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
    backgroundColor: colors.form,
    alignSelf: 'center',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: colors.tertiary,
    elevation: 5, 
    marginBottom: 10
  },
  floatingContainerDataContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'left',
    gap: 1.5
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
  bottomControls: {
    width: '100%',
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 10
  },
  priceContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.form,
    borderRadius: 12,
  },
  priceContainerDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  priceContainerIcon: {
    color: colors.primary,
    fontSize: 20,
  },
  priceContainerText: {
    fontFamily: fonts.Righteous,
    fontSize: 15,
    color: colors.text
  },
})