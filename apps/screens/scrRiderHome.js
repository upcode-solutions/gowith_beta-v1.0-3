//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import BottomSheet from '../components/modalBottomSheet';
import FloatingView from '../components/modalFloatingView';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, remove, set, get, update, onValue } from 'firebase/database';
//react-native hooks
import React, { useState, useEffect, useRef, lazy, act, use } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Alert, Switch, Keyboard, Dimensions, ToastAndroid, Linking } from 'react-native'

export default function RiderHome() {

  //contexts providers ===================================================
  const { localControls, firestoreUserData } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables ======================================================
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: '', type: 'riders' },
    //{ longitude: 121.011, latitude: 14.5995, geoName: 'Makati', type: 'pickup' }, //makati
    //{ longitude: 120.9842, latitude: 14.5995, geoName: 'Manila', type: 'dropoff' }, //manila
  ]);
  const [route, setRoute] = useState([]);
  const [heading, setHeading] = useState(0);
  const [tiltStatus, setTiltStatus] = useState(null);
  const [city, setCity] = useState('')
  //actions
  const [actions, setActions] = useState({ tiltWarningVisible: false, locationAnimated: false, autoAccept: false });
  //references ===========================================================
  const mapRef = useRef(null);
  const warningTimeout = useRef(null);

  //functions ============================================================
  const RequestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const buttonTextHandler = () => { //button text handler
    if (bookingStatus === 'onQueue') { return 'END QUEUE'; }
    else if (bookingStatus === 'pending') { return 'PLEASE WAIT...'; }
    else if (bookingStatus === 'active') { return 'END TRANSACTION'; }
    else { return 'START RIDE'; }
  };

  const tiltHandler = ({ x, y, z }) => { //tilt handler
    let currentStatus = '';
    
    if (x < 0.5 && x > -0.5 && z < .9 && z > -0.25) { currentStatus = 'nominal'; } 
    else { currentStatus = 'critical';  }

    if ( currentStatus === 'critical' ) {
      setTiltStatus('critical');
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
      setTiltStatus('nominal');
      setActions((prev) => ({ ...prev, tiltWarningVisible: false }));
    }
  }

  const riderStatusHandler = async () => { //rider status handler

    const { latitude, longitude } = bookingPoints[0];
    const { username, firstName, lastName } = firestoreUserData.personalInformation;
    const { plateNumber, vehicleColor, vehicleModel } = firestoreUserData.vehicleDetails;

    try {
      if (bookingStatus === 'active' || bookingStatus === 'onQueue') {
        setBookingStatus('pending');
        remove(ref(realtime, `riders/${city}/${username}`)); //remove booking from realtime
        setTimeout(() => { setBookingStatus('inactive'); }, 2500);
      } else if (bookingStatus === 'inactive') {
        setBookingStatus('pending');
        const bookingSnapshot = await get(ref(realtime, `riders/${city}`));
        const bookingExists = bookingSnapshot.exists() ? bookingSnapshot.size : 0;
        const queueNumber = bookingExists + 1;
        await set(ref(realtime, `riders/${city}/${username}`), { 
          personalInformation: { username, firstName, lastName, plateNumber, vehicleColor, vehicleModel, queueNumber },
          vehicleInformation: { plateNumber, vehicleColor, vehicleModel },
          statusDetails: { location : { latitude, longitude }, heading, tiltStatus, tiltStatus, city: city },
        });
        setTimeout(() => { setBookingStatus('onQueue'); }, 2500);
      }
    } catch (error) {
      setBookingStatus('inactive');
      console.warn('error', error); 
    }
  }

  
  //useEffects ===========================================================
  useEffect(() => { //animation at first render
    if (bookingPoints[0].latitude !== '' && bookingPoints[0].longitude !== '' && !actions.locationAnimated) {
      setTimeout(() => { mapRef.current?.animateToRegion({ latitude: bookingPoints[0]?.latitude, longitude: bookingPoints[0]?.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }, 2700);
      setActions((prev) => ({ ...prev, locationAnimated: true }));
    }
  }, [bookingPoints[0], heading, tiltStatus, bookingStatus, actions.locationAnimated]);

  useEffect(() => {
    let locationSubscription = null;
    
    const startLocationTracking = async () => {
      if (!await RequestForegroundPermissions()) { return }
  
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2.5 },
        async (location) => {
          const { latitude, longitude } = location.coords;
          if (!latitude || !longitude) { return }
  
          setTimeout(() => { setLoading(false); }, 2500);
  
          const currentCity = await Location.reverseGeocodeAsync({ latitude, longitude }).then(res => res[0]?.city);
  
          setBookingPoints((prev) => {
            const newPoints = [...prev];
            newPoints[0] = { ...newPoints[0], latitude, longitude };
            return newPoints;
          });
  
          if (bookingStatus === "active" || bookingStatus === "onQueue") {
            const { username, firstName, lastName } = firestoreUserData.personalInformation;
            const { plateNumber, vehicleColor, vehicleModel } = firestoreUserData.vehicleDetails;
  
            if (currentCity === city) {
              // 🔥 Just update the location in the same city
              await update(ref(realtime, `riders/${city}/${username}/statusDetails/location`), { latitude, longitude });
            } else {
              // 🔥 City changed → Remove from old city & add to new city
              const ridersRef = ref(realtime, `riders`);
              const snapshot = await get(ridersRef);
  
              if (snapshot.exists()) {
                const cities = Object.keys(snapshot.val());
                for (let cityName of cities) {
                  await remove(ref(realtime, `riders/${cityName}/${username}`));
                }
              }
  
              await set(ref(realtime, `riders/${currentCity}/${username}`), {
                personalInformation: { username, firstName, lastName, plateNumber, vehicleColor, vehicleModel },
                vehicleInformation: { plateNumber, vehicleColor, vehicleModel },
                statusDetails: { location: { latitude, longitude }, heading, tiltStatus, city: currentCity }
              });
  
              setCity(currentCity);
            }
          } else {
            setCity(currentCity);
          }
        }
      );
    };
  
    startLocationTracking();
    return () => { if (locationSubscription) locationSubscription.remove(); };
  
  }, [bookingStatus]);
  

  useEffect(() => { //listen to heading and tild
    const statusListener = async () => {
      const headingListener = await Location.watchHeadingAsync((headingData) => { setHeading(headingData.trueHeading); });
  
      // Accelerometer listener
      Accelerometer.setUpdateInterval(1000);
      const tiltListener = Accelerometer.addListener(tiltHandler);
    
      return () => { headingListener.remove(); tiltListener.remove(); };
    }

    if (bookingStatus === 'active' || bookingStatus === 'onQueue') { statusListener(); }
  }, [bookingStatus]);

  useEffect(() => { //update rider status
    let lastHeading = heading;
  
    const updateRiderStatus = async () => {
      try { 
        const { username } = firestoreUserData.personalInformation;
        const riderRef = ref(realtime, `riders/${city}/${username}`);
        const riderSnapshot = await get(riderRef);
  
        if (!riderSnapshot.exists()) { return; }
  
        const currentData = riderSnapshot.val();
        let updateNeeded = false;
        const updates = {};
  
        // Ensure the updates are made only if bookingStatus is 'active' or 'onQueue'
        if (bookingStatus === 'active' || bookingStatus === 'onQueue') {
          switch (true) {
            case Math.abs(currentData.statusDetails.heading - heading) > 50: // Update only if heading changes > 5 degrees
              updates['statusDetails/heading'] = heading;
              lastHeading = heading;
              updateNeeded = true;
              break;
  
            case currentData.statusDetails.tiltStatus !== tiltStatus: //update only if tiltStatus changed
              updates['statusDetails/tiltStatus'] = tiltStatus;
              updateNeeded = true;
              break;
          }
  
          if (updateNeeded) { await update(riderRef, updates); }
        }
      } catch (error) { console.warn('Error updating realtime database:', error); }
    };
  
    if (bookingStatus === 'active' || bookingStatus === 'onQueue') { 
      updateRiderStatus();
    }
  }, [bookingStatus, heading, tiltStatus]);
  
  //render ===============================================================
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
    <View style={{flex:1}}>

      <BookingIndicator bookingStatus={bookingStatus} />

      <View style={[globalStyles.bottomContainer, { paddingHorizontal: 0, paddingVertical: 0 }]}>
        <TouchableOpacity 
          style={[globalStyles.primaryButton, styles.locationButton, { opacity: bookingPoints[0].latitude && bookingPoints[0].longitude ? 1 : 0.5 }]}
          disabled={!bookingPoints[0].latitude || !bookingPoints[0].longitude}
          onPress={() => mapRef.current?.animateToRegion({ latitude: bookingPoints[0]?.latitude, longitude: bookingPoints[0]?.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 })}
        >
          <Ionicons name="locate-outline" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <View style={[styles.switchContainer]}>
            <Text style={[globalStyles.switchText]}>Auto Accept Booking</Text>
            <Switch
              trackColor={{ false: rgba(colors.labelGray, .75), true: rgba(colors.secondary, 0.3) }}
              thumbColor={actions.autoAccept ? colors.primary : colors.tertiary}
              onValueChange={(value) => setActions((prev) => ({ ...prev, autoAccept: value }))}
              value={actions.autoAccept}
            />
          </View>
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { opacity: bookingStatus === 'pending' ? 0.5 : 1 }]} 
            disabled={bookingStatus === 'pending'}
            onPress={() => riderStatusHandler()}
          >
            <Text style={globalStyles.primaryButtonText}>{ buttonTextHandler() }</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Mapview  
        points={bookingPoints}
        route={route}
        mapRef={mapRef}
        heading={heading}
      />

    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  locationButton: {
    marginLeft: 15,
    width: 45,
  },
  buttonContainer: {
    height: 'fit-contect',
    backgroundColor: colors.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: colors.shadowColor,
    elevation: 5,
    padding: 15,
    gap: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.form,
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  switchText: {
    fontFamily: fonts.RubikRegular,
    fontSize: 15,
    color: colors.text
  }
})