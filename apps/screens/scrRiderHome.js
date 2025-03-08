//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
//libraries
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { set, ref, remove, push, get, onValue, update } from 'firebase/database';
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, Switch} from 'react-native'

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
  const [riderDetails, setRiderDetails] = useState({});
  const [bookingDetails, setBookingDetails] = useState({ price: '0', duration: '0', distance: '0', });
  const [actions, setActions] = useState({ loading: true, autoAccept: false, locationAnimated: false, clientInformationVisible: false, });

  //references =============================================================
  const mapRef = useRef(null);

  //functions ==============================================================
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const bookingHandler = async() => {

    const { username } = firestoreUserData.personalInformation;

    try {
      if (bookingStatus === 'active' || bookingStatus === 'onQueue') { 
        setBookingStatus('pending');
  
        await remove(ref(realtime, `riders/${bookingPoints[2].city}/${username}`));

        setTimeout(() => { setBookingStatus('inactive'); }, 3000);
      } else if (bookingStatus === 'inactive') {
        setBookingStatus('pending');
  
        setTimeout(() => { setBookingStatus('onQueue'); }, 3000);
      }
    } catch (error) {
      console.warn("scrRiderHome - bookingHandler", error);
      setBookingStatus('inactive');
    }
  }

  //useEffects =============================================================
  useEffect(() => {
    if (bookingPoints[2].latitude !== '' && bookingPoints[2].longitude !== '' && !actions.locationAnimated) {
      setTimeout(() => { mapRef.current?.animateToRegion({ longitude: bookingPoints[2].longitude, latitude: bookingPoints[2].latitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }, 2700);
      setActions((prev) => ({ ...prev, locationAnimated: true }));
    }
  },[bookingPoints[2]]);

  useEffect(() => { 
    const { username } = firestoreUserData.personalInformation;
    const { bookingKey, city, flag } = firestoreUserData.accountDetails;
    let locationSubscription = null;
    
    const queueCheck = async () => {
      try {
        const { bookingKey, city } = firestoreUserData.bookingDetails;
        let queueRef = null;
    
        if (bookingKey && city) { queueRef = ref(realtime, `bookings/${city}/${bookingKey}`); } 
        else { queueRef = ref(realtime, `riders/${bookingPoints[2].city}`); }
    
        const queueSnapshot = await get(queueRef);
        const queueData = queueSnapshot.exists() ? queueSnapshot.val() : null;
    
        if (!queueData) { return; }

        for (const riderKey in queueData) {
          if (riderKey === username) {
            console.log(riderKey);
            setBookingStatus('onQueue');
          }
        }
      } catch (error) {
        console.log("scrRiderHome - queueCheck", error);
      }
    };

    const startLocationTracking = async () => {
      if (!await requestForegroundPermissions()) { return; }
      
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2.5 },
        async (location) => {
          const { latitude, longitude } = location.coords; 
          if (!latitude || !longitude) { return }
          
          setTimeout(() => { setActions({ ...actions, loading: false }); }, 2500); 
          const currentCity = await Location.reverseGeocodeAsync(location.coords);
          
          setBookingPoints((prev) => { //update client location
            const newPoint = [...prev];
            newPoint[2] = { ...prev[2], longitude, latitude, geoName: currentCity[0].formattedAddress, city: currentCity[0].city };
            return newPoint;
          });
          
        }
      );
    }

    queueCheck();
    startLocationTracking();
    return () => { locationSubscription && locationSubscription.remove(); };
  },[]);

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
        header={riderDetails.header}
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