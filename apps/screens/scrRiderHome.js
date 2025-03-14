//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import FloatingView from '../components/modalFloatingView';
import BookingPopup from '../components/cmpBookingPopup';
//libraries
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { set, ref, remove, push, get, onValue, update } from 'firebase/database';
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { Alert, Dimensions, Image, Linking, StyleSheet, Switch, Text, TouchableOpacity, View, } from 'react-native'
import firebase from 'firebase/compat/app';

export default function RiderHome() {
  
  //context variables ======================================================
  const { localControls, localData, firestoreUserData } = useControls();
  
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles( fonts, colors, rgba );
  const styles = createStyles( fonts, colors, rgba );
  //local variables ========================================================
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' },
    { longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'riders' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'clients' },
  ]);
  const [riderDetails, setRiderDetails] = useState({ heading: 0, tiltStatus: null });
  const [bookingDetails, setBookingDetails] = useState({ queueNumber: 0, });
  const [actions, setActions] = useState({ loading: true, autoAccept: false, locationAnimated: false, tiltWarningVisible: false, clientInformationVisible: false });

  const [bookingCollection, setBookingCollection] = useState([]);
  //references =============================================================
  const mapRef = useRef(null);
  const warningTimeout = useRef(null);

  //functions ==============================================================
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const tiltHandler = ({ x, y, z }) => { //accelerometer: tild Identifier (critical or nominal)
    let currentStatus = '';

    if (x < 0.5 && x > -0.5 && z < .9 && z > -0.25) { currentStatus = 'nominal'; } 
    else { currentStatus = 'critical'; }

    if ( currentStatus === 'critical' ) {
      setRiderDetails((prev) => ({ ...prev, tiltStatus: 'critical' }));
      if(!warningTimeout.current && !actions.tiltWarningVisible) { 
        warningTimeout.current = setTimeout(() => {
          setActions((prev) => ({ ...prev, tiltWarningVisible: true }));
          Alert.alert( 'Warning', 'You are device is tilting', [{ text:'OK', 
            onPress: () => { 
              setActions((prev) => ({ ...prev, tiltWarningVisible: false })); 
              warningTimeout.current = null; 
            } 
          }])
        }, 15000);
      }
    } else {
      if(warningTimeout.current) { 
        clearTimeout(warningTimeout.current); 
        warningTimeout.current = null;
      }
      setRiderDetails((prev) => ({ ...prev, tiltStatus: 'nominal' }));
      setActions((prev) => ({ ...prev, tiltWarningVisible: false }));
    }
  }

  const bookingHandler = async() => { //rider queue handler, active or inactive
    const { latitude, longitude, city } = bookingPoints[2];
    const { username, firstName, lastName } = firestoreUserData.personalInformation;
    const { plateNumber, vehicleColor, vehicleModel  } = firestoreUserData.vehicleDetails;
    const { heading, tiltStatus } = riderDetails;
    
    try {
      if (bookingStatus === 'active' || bookingStatus === 'onQueue') { 
        setBookingStatus('pending');
  
        await remove(ref(realtime, `riders/${bookingPoints[2].city}/${username}`));

        setTimeout(() => { setBookingStatus('inactive'); }, 3000);
      } else if (bookingStatus === 'inactive') {
        setBookingStatus('pending');

        const queueSnapshot = await get(ref(realtime, `riders/${bookingPoints[2].city}`));
        const queueData = queueSnapshot.exists() ? queueSnapshot.size : null;
        const queueNumber = queueData ? queueData + 1 : 1;

        await set(ref(realtime, `riders/${bookingPoints[2].city}/${username}`), { 
          personalInformation: { username, firstName, lastName },
          vehicleInformation: { plateNumber, vehicleColor, vehicleModel },
          riderStatus: { queueNumber, location: { latitude, longitude }, heading, tiltStatus, city, timestamp: new Date().getTime() },
        });
  
        setTimeout(() => { setBookingStatus('onQueue'); }, 3000);
        setBookingDetails((prev) => ({ ...prev, queueNumber }));
      }
    } catch (error) {
      console.warn("scrRiderHome - bookingHandler", error);
      setBookingStatus('inactive');
    }
  }

  //useEffects =============================================================
  useEffect(() => { //map animation after rider is locatied
    if (bookingPoints[2].latitude !== '' && bookingPoints[2].longitude !== '' && !actions.locationAnimated) {
      setTimeout(() => { mapRef.current?.animateToRegion({ longitude: bookingPoints[2].longitude, latitude: bookingPoints[2].latitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }, 2700);
      setActions((prev) => ({ ...prev, locationAnimated: true }));
    }
  },[bookingPoints[2]]);

  useEffect(() => { //location, tilt and heading tracker
    const { username, firstName, lastName } = firestoreUserData.personalInformation;
    const { plateNumber, vehicleColor, vehicleModel } = firestoreUserData.vehicleDetails;
    const { heading, tiltStatus } = riderDetails;
    let locationSubscription = null;
    
    const startLocationTracking = async () => { //actively track rider location and update status if booking is onQueue || active
      if (!await requestForegroundPermissions()) { return Linking.openSettings(); }
      
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2.5 },
        async (location) => {
          const { latitude, longitude } = location.coords; 
          if (!latitude || !longitude) { return }
          
          setTimeout(() => { setActions({ ...actions, loading: false }); }, 2500); 
          const currentCity = await Location.reverseGeocodeAsync(location.coords);
          
          setBookingPoints((prev) => { //update client location
            const newPoint = [...prev];
            newPoint[2] = { ...prev[2], longitude, latitude, geoName: currentCity[0].formattedAddress};
            return newPoint;
          });

          if(bookingStatus === 'onQueue' || bookingStatus === 'active') { 
            try {
              if(currentCity[0].city === bookingPoints[2].city) {
                await update(ref(realtime, `riders/${bookingPoints[2].city}/${username}/riderStatus`), { location: { latitude, longitude }, })
              } else {
                const riderSnapshot = await get(ref(realtime, `riders`));
  
                if(riderSnapshot.exists()) {
                  const cities = Object.keys(riderSnapshot.val());
                  for (let cityName of cities) { await remove(ref(realtime, `riders/${cityName}/${username}`)); }
                }
  
                const cityQueueSnapshot = await get(ref(realtime, `riders/${currentCity[0].city}`));
                const cityQueueData = cityQueueSnapshot.exists() ? Object.keys(cityQueueSnapshot.val()).length + 1 : 1;
  
                await set(ref(realtime, `riders/${currentCity[0].city}/${username}`), {
                  personalInformation: { username, firstName, lastName },
                  vehicleInformation: { plateNumber, vehicleColor, vehicleModel },
                  riderStatus: { location: { latitude, longitude }, heading, tiltStatus, city: currentCity[0].city, timestamp: new Date().getTime(), queueNumber: cityQueueData },
                });
  
                setBookingPoints((prev) => { //update client location
                  const newPoint = [...prev];
                  newPoint[2] = { ...prev[2], city: currentCity[0].city };
                  return newPoint;
                });
              }
            } catch (error) { console.warn("scrRiderHome - startLocationTracking", error); }
          } else {
            setBookingPoints((prev) => { //update client location
              const newPoint = [...prev];
              newPoint[2] = { ...prev[2], city: currentCity[0].city };
              return newPoint;
            });
          }
          
        }
      );
    }

    const headerTiltHandler = async() => { //tilt and heading handler for security
      //heading listener
      const headingListener = await Location.watchHeadingAsync((headingData) => { setRiderDetails({ ...riderDetails, heading: headingData.trueHeading }); });
      //tilt listener
      Accelerometer.setUpdateInterval(1000);
      const tiltListener = Accelerometer.addListener(tiltHandler)

      return () => { headingListener.remove(); tiltListener.remove(); };
    }

    startLocationTracking();
    if(bookingStatus === 'onQueue' || bookingStatus === 'active') { headerTiltHandler(); }
    return () => { locationSubscription && locationSubscription.remove(); };
  },[bookingStatus]);

  useEffect(() => { //queue updater
    let queueListener = null;
  
    const checkQueue = async () => {
      queueListener = onValue(ref(realtime, `riders/${bookingPoints[2].city}`), (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          const sortedQueue = Object.entries(snapshotData)
            .map(([username, data]) => ({ username, ...data.riderStatus }))
            .filter((rider) => rider.queueNumber !== null)
            .sort((a, b) => a.queueNumber - b.queueNumber);
          
          const updates = {};
          let updateNeeded = false;
  
          sortedQueue.forEach((rider, index) => {
            if (rider.queueNumber !== index + 1) {
              updates[`riders/${bookingPoints[2].city}/${rider.username}/riderStatus/queueNumber`] = index + 1;
              updateNeeded = true;
              setBookingDetails((prev) => ({ ...prev, queueNumber: index + 1 }));
            }
          });
  
          if (updateNeeded) { update(ref(realtime), updates); }
        }
      });
  
      return () => { queueListener && queueListener(); };
    }
  
    if(bookingStatus === 'onQueue') { checkQueue(); }
  }, [bookingStatus, bookingPoints]);

  useEffect(() => { //fetch queue at first render
    const { username } = firestoreUserData.personalInformation;
  
    const fetchQueue = async () => { //fetch queue and parse the data
      try {
        const queueSnapshot = await get(ref(realtime, `riders`));
        if (!queueSnapshot.exists()) return;
  
        const ridersData = queueSnapshot.val();
  
        for (const cityName in ridersData) {
          if (ridersData[cityName][username]) {
            const riderData = ridersData[cityName][username];
            setBookingStatus('onQueue');
            setBookingPoints((prev) => {
              const newPoints = [...prev];
              newPoints[2] = { longitude: riderData.riderStatus.location.longitude, latitude: riderData.riderStatus.location.latitude, geoName: '', city: cityName, type: 'riders' };
              return newPoints;
            });
            setBookingDetails((prev) => ({ ...prev, queueNumber: riderData.riderStatus.queueNumber }));
            return;
          }
        }
      } catch (error) { console.error("Error checking queue:", error); }
    };

    const fetchBooking = async () => { //fetch bookings
      const bookingListener = onValue(ref(realtime, `bookings/${bookingPoints[2].city}`), async (snapshot) => {
        if (!snapshot.exists()) { return; }
        const ridersSnapshot = await get(ref(realtime, `riders/${bookingPoints[2].city}`));
        const snapshotDataSize = ridersSnapshot.exists() ? ridersSnapshot.size : 0;
        const bookingData = snapshot.val()

        if (snapshotDataSize > 1) {
          const sortedBookingData = Object.entries(bookingData)
            .map(([bookingKey, data]) => ({ bookingKey, ...data }))
            .filter((booking) => booking.bookingDetails.queueNumber === bookingDetails.queueNumber)
            .sort((a, b) => a.bookingDetails.queueNumber - b.bookingDetails.queueNumber);
          
          setBookingCollection(sortedBookingData)
        } else {
          const sortedBookingData = Object.entries(bookingData)
            .map(([bookingKey, data]) => ({ bookingKey, ...data }))
            .sort((a, b) => a.bookingDetails.queueNumber - b.bookingDetails.queueNumber);

          setBookingCollection(sortedBookingData)
        }
      });

      return () => { bookingListener && bookingListener()}
    }
  
    if(bookingStatus === 'inactive') { fetchQueue(); }
    if(bookingStatus === 'onQueue' || bookingDetails.queueNumber !== 0 ) { fetchBooking(); }
  }, [bookingStatus, bookingDetails?.queueNumber]);

  //render =================================================================
  if (actions.loading) { //loading screen
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

      <TouchableOpacity 
        style={[globalStyles.bookingInformationButton, { opacity: bookingPoints[3].latitude === '' && bookingPoints[3].longitude === '' ? 0 : 1 }]}
        disabled={bookingPoints[3].latitude === '' || bookingPoints[3].longitude === ''}
        onPress={() => setActions((prev) => ({ ...prev, clientInformationVisible: true }))}
      >
        <Ionicons style={globalStyles.bookingInformationButtonIcon} name="chevron-back" />
        <Ionicons style={globalStyles.bookingInformationButtonIcon} name="bicycle"/>
      </TouchableOpacity>

      <BookingPopup bookingCollection={bookingCollection}/>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, { opacity: bookingPoints[2].city === '' ? 0 : 1 }]}
          onPress={() => { mapRef.current?.animateToRegion({ longitude: bookingPoints[2].longitude, latitude: bookingPoints[2].latitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }}
          disabled={bookingPoints[2].city === ''}
        >
          <Ionicons name="locate" size={22} color={colors.constantWhite} />
        </TouchableOpacity>

        <View style={globalStyles.bottomControls}>
          <View style={globalStyles.priceContainer}>
            <Text style={globalStyles.priceContainerText}>AUTO ACCEPT BOOKING</Text>
            <Switch
              style={styles.switch}
              value={actions.autoAccept}
              onValueChange={(value) => { setActions((prev) => ({ ...prev, autoAccept: value })); }}
              thumbColor={colors.tertiary}
              trackColor={{ false: rgba(colors.tertiary, 0.5), true: colors.primary }}
            />
          </View>
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { opacity: bookingStatus === 'pending' ? 0.5 : 1 }]} 
            onPress={() => bookingHandler()}
            //disabled={bookingStatus === 'pending' || bookingPoints[0].city === '' && bookingPoints[1].city === ''}
          >
            <Text style={globalStyles.primaryButtonText}>{bookingStatus === 'active' || bookingStatus === 'onQueue' ? 'Cancel Ride' : 'Ride Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BookingIndicator bookingStatus={bookingStatus} />
      
      <Mapview 
        mapRef={mapRef}
        points={bookingPoints}
        bookingDetails={bookingDetails}
        setBookingDetails={setBookingDetails}
        heading={riderDetails.heading}
      />

    </View>
  )
}

const createStyles = ( fonts, colors, rgba ) => StyleSheet.create({
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
  toggleButton: {
    height: 45,
    width: 45,
    position: 'absolute',
    top: -55,
    left: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  switch: {
    height: 20,
  },
})