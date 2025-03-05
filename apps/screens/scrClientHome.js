//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import BottomSheet from '../components/modalBottomSheet';
import LocationInput from '../components/cmpLocationInput';
//libraries
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { set, ref, remove, push, get, onValue, update } from 'firebase/database';
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
//react native hooks
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Animated, PanResponder, Easing } from 'react-native'

export default function ClientHome() {

  //contexts providers ===================================================
  const { localControls, localData, firestoreUserData } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  const { showNotification } = useNotification();
  //local variables =======================================================
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: 'Makati', city: '', type: 'pickup' }, //manila bay
    { longitude: '', latitude: '', geoName: 'Instramuros', city: '', type: 'dropoff' }, // mall of asia
    { longitude: 121.0577140 , latitude: 14.6192831, geoName: 'Gateway Aranet Cubao', city: 'Quezon City', type: 'riders' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'clients' },
  ]);

  console.log(bookingPoints);
  
  //console.log(localData)
  const [riderDetails, setRiderDetails] = useState({ username: 'username', contactNumber: '09562517907', plateNumber: 'KLT 1234', color: 'green',  });
  const [bookingDetails, setBookingDetails] = useState({ price: '0', duration: '0', distance: '0', });
  const [actions, setActions] = useState({ locationAnimated: false, locationInputVisible: false, fareDetailsVisible: false, fetchingLocation: false, onFocus: '' });
  
  //references ============================================================
  const mapRef = useRef(null);
  const animatedY = useRef(new Animated.Value(170)).current; // Start collapsed
  const animatedYClamped = animatedY.interpolate({ inputRange: [55, 170], outputRange: [170, 55], extrapolate: 'clamp', });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2, // Detect small drags
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
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const swapPoints = () => { //swap pickup and dropoff
    setBookingPoints((prev) => { //swap points
      const newPoints = [...prev];
      const tempPoints = { latitude: newPoints[0].latitude, longitude: newPoints[0].longitude, geoName: newPoints[0].geoName };
      newPoints[0] = { ...newPoints[0], latitude: newPoints[1].latitude, longitude: newPoints[1].longitude, geoName: newPoints[1].geoName };
      newPoints[1] = { ...newPoints[1], latitude: tempPoints.latitude, longitude: tempPoints.longitude, geoName: tempPoints.geoName };
      return newPoints;
    });

    mapRef.current.fitToCoordinates(bookingPoints, { edgePadding: { top: 100, right: 100, bottom: 150, left: 100 }, animated: true });
  }

  const bookingHandler = async() => {
    const { username, contactNumber, weight } = firestoreUserData.personalInformation;
    const { price, distance, duration } = bookingDetails;
    const { city, bookingKey } = firestoreUserData.bookingDetails;
    
    try {
      if (bookingStatus === 'onQueue' || bookingStatus === 'active') {
        const { flag } = firestoreUserData.accountDetails; //accountDetails current flag

        setBookingStatus('pending');
        
        await remove(ref(realtime, `bookings/${city}/${bookingKey}`));

        await updateDoc(doc(firestore, localData.userType, localData.uid), { 
          accountDetails: { ...firestoreUserData.accountDetails, flag: riderDetails.username !== '' ? flag + 1 : flag }, //accountDetails flag
          bookingDetails: {} //remove booking key from firestore
        });
        
        setTimeout(() => { setBookingStatus('inactive'); }, 3000);
      } else if (bookingStatus === 'inactive') {
        
        setBookingStatus('pending');
  
        const key = push(ref(realtime, 'bookings')).key;
        if(!key) { return; }

        setBookingDetails({ ...bookingDetails, bookingKey: key });
        
        const bookingSnapshot = await get(ref(realtime, `bookings/${bookingPoints[0].city}`));
        const bookingExists = bookingSnapshot.exists() ? bookingSnapshot.size : 0;
        const queueNumber = bookingExists + 1;
  
        await set(ref(realtime, `bookings/${bookingPoints[0].city}/${key}`), {
          bookingDetails:{ bookingKey: key, queueNumber: queueNumber, timestamp: new Date().getTime(), price: price, distance: distance, duration: duration },
          clientInformation:{ username: username, contactNumber: contactNumber, weight: weight, pickupPoint: bookingPoints[0], dropoffPoint: bookingPoints[1]},
        });
  
        await updateDoc(doc(firestore, localData.userType, localData.uid), { 
          bookingDetails: { ...firestoreUserData.bookingDetails, bookingKey: key, city: bookingPoints[0].city, timestamp: serverTimestamp() }, 
        });
  
        setTimeout(() => { setBookingStatus('onQueue'); }, 3000);
      }
    } catch (error) { 
      console.warn('Error submitting booking:', error);
      setBookingStatus('inactive');
    }
  }

  //useEffects ============================================================
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

          setBookingPoints((prev) => { //update client location
            const newPoint = [...prev];
            newPoint[3] = { ...prev[3], longitude, latitude, geoName: currentCity[0].formattedAddress, city: currentCity[0].city };
            return newPoint;
          });
        }
      );
    }

    startLocationTracking();
    return () => { locationSubscription && locationSubscription.remove(); }
  }, []);

  useEffect(() => {
    showNotification('Client Home', 'success');
  },[])

  useEffect(() => { //animation at first render
    if (bookingPoints[3].latitude !== '' && bookingPoints[3].longitude !== '' && !actions.locationAnimated) {
      setTimeout(() => { mapRef.current?.animateToRegion({ longitude: bookingPoints[3].longitude, latitude: bookingPoints[3].latitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }, 2700);
      setActions((prev) => ({ ...prev, locationAnimated: true }));
    }
  }, [bookingPoints[3]]);

  useEffect(() => {
    if (bookingStatus === 'onQueue' || bookingStatus === 'active') {
      const { bookingKey, city } = firestoreUserData.bookingDetails;
      const queueBookingRef = ref(realtime, `bookings/${city}`);
  
      const queueUnsubscribe = onValue(queueBookingRef, (snapshot) => {
        if (snapshot.exists()) {
          const bookings = snapshot.val();
          const sortedBookings = Object.entries(bookings)
            .map(([key, value]) => ({ key, ...value.bookingDetails }))
            .filter((booking) => booking.queueNumber)
            .sort((a, b) => a.queueNumber - b.queueNumber);
  
          const updates = {};
          let updateNeeded = false;
  
          sortedBookings.forEach((booking, index) => {
            const correctQueueNumber = index + 1;
  
            if (booking.queueNumber !== correctQueueNumber) {
              updateNeeded = true;
              updates[`bookings/${city}/${booking.key}/bookingDetails/queueNumber`] = correctQueueNumber;
            }
          });
  
          if (updateNeeded) { update(ref(realtime), updates).catch((err) => console.error("Error updating queue:", err) ); }
        }
      });
  
      return () => queueUnsubscribe();
    }
  }, [bookingStatus]);  

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
            <TouchableOpacity style={styles.floatingContainerButton} onPress={() => swapPoints()} disabled={bookingStatus !== 'inactive'}>
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
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { opacity: bookingStatus === 'pending' ? 0.5 : 1 }]} 
            onPress={() => bookingHandler()}
            disabled={bookingStatus === 'pending' || bookingPoints[0].city === '' && bookingPoints[1].city === ''}
          >
            <Text style={globalStyles.primaryButtonText}>{bookingStatus === 'active' || bookingStatus === 'onQueue' ? 'Cancel Booking' : 'Book Now'}</Text>
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