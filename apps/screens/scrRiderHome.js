//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import BookingPopup from '../components/cmpBookingPopup';
import BottomControls from '../components/cmpBottomControls';
import AccidentPopup from '../components/cmpAccidentPopup';
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
import { Alert, Linking, StyleSheet, TouchableOpacity, View, } from 'react-native'

export default function RiderHome() {
  
  //context variables ======================================================
  const { localData, firestoreUserData } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles( fonts, colors, rgba );
  //local variables ========================================================
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' },
    { longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'riders' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'clients' },
  ]);
  const [riderDetails, setRiderDetails] = useState({ heading: 0, tiltStatus: null });
  const [bookingDetails, setBookingDetails] = useState({ queueNumber: 0, clientDetails: {}, bookingDetails: {}, steps: {} });
  const [actions, setActions] = useState({ loading: true, autoAccept: false, locationAnimated: false, tiltWarningVisible: false, clientInformationVisible: false });

  const [bookingCollection, setBookingCollection] = useState([]);
  const [rejectedBookings, setRejectedBookings] = useState([]);
  
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
        setActions((prev) => ({ ...prev, tiltWarningVisible: true }));
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
    const { username, firstName, lastName } = firestoreUserData.personalInformation;

    try {
      if (bookingStatus === 'active' || bookingStatus === 'onQueue') { 
        const { bookingKey, city } = firestoreUserData.bookingDetails;

        setBookingStatus('pending');

        if(bookingKey) {
          await remove(ref(realtime, `bookings/${city}/${bookingKey}/riderInformation`));
          await updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), {
            accountDetails: { ...firestoreUserData.accountDetails, flags: firestoreUserData.accountDetails.flags + 1 },
            bookingDetails: {}
          });
        } else { await remove(ref(realtime, `riders/${bookingPoints[2].city}/${username}`)); }

        setBookingPoints((prev) => { //update client location
          const newPoint = [...prev];
          newPoint[0] = { ...prev[0], longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' };
          newPoint[1] = { ...prev[1], longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' };
          return newPoint;
        });

        setBookingDetails({ queueNumber: 0, clientDetails: {}, bookingDetails: {} });
        setBookingStatus('inactive');

        setTimeout(() => { setBookingStatus('inactive'); }, 3000);

      } else if (bookingStatus === 'inactive') {
        const { latitude, longitude, city } = bookingPoints[2];
        const { plateNumber, vehicleColor, vehicleModel  } = firestoreUserData.vehicleDetails;
        const { heading, tiltStatus } = riderDetails;

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
      setBookingStatus('inactive');
      console.warn("scrRiderHome - bookingHandler", error);
    }
  }

  //useEffects =============================================================
  useEffect(() => { //map animation after rider is locatied
    if (bookingPoints[2].latitude !== '' && bookingPoints[2].longitude !== '' && !actions.locationAnimated) {
      setTimeout(() => { mapRef.current.animateCamera({ center: { latitude: bookingPoints[2].latitude, longitude: bookingPoints[2].longitude }, pitch: 50, heading: riderDetails.heading, zoom: 45 }, { duration: 500, }); }, 2800);
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
            newPoint[2] = { ...prev[2], longitude, latitude, city: currentCity[0].city, geoName: currentCity[0].formattedAddress};
            return newPoint;
          });

          if(bookingStatus === 'active') {
            const { bookingKey, key } = firestoreUserData.bookingDetails;
            await update(ref(realtime, `bookings/${bookingPoints[2].city}/${bookingKey}/riderInformation/riderStatus`), { 
              location: { latitude, longitude },
              city: bookingPoints[2].city,
            });
          } else if(bookingStatus === 'onQueue') {
            try {
              if(currentCity[0].city === bookingPoints[2].city && bookingStatus === 'onQueue') {
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
    headerTiltHandler();
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
      const { bookingKey, city } = firestoreUserData.bookingDetails 

      try {
        if (bookingKey && city) {
          const bookingSnapshot = await get(ref(realtime, `bookings/${city}/${bookingKey}`));
          const bookingData = bookingSnapshot.exists() ? bookingSnapshot.val() : {};
          if (!bookingData) { return; }

          const { accountStatus, contactNumber, dropoffPoint, pickupPoint, username, weight } = bookingData.clientInformation
          const { distance, price, duration, timestamp } = bookingData.bookingDetails

          setBookingPoints((prev) => {
            const newPoints = [...prev];
            newPoints[0] = { ...prev[0], ...pickupPoint }
            newPoints[1] = { ...prev[1], ...dropoffPoint }
            return newPoints;
          });

          setBookingDetails((prev) => ({ ...prev, 
            bookingDetails: { distance, duration, price, timestamp },
            clientDetails: { accountStatus, username, contactNumber, weight }
          }));

          setTimeout(() => { setBookingStatus('active'); }, 1000);
        } else {
          const queueSnapshot = await get(ref(realtime, `riders`));
          if(!queueSnapshot.exists()) { return; }
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

        }
      } catch (error) { console.error("Error checking queue:", error); }
    };

    const fetchBooking = async () => { //fetch bookings
      const bookingListener = onValue(ref(realtime, `bookings/${bookingPoints[2].city}`), async (snapshot) => {
        if (!snapshot.exists() || Object.entries(snapshot.val()).length === 0) { setBookingCollection([]); return; }
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
            .filter((booking) => !rejectedBookings.includes(booking.bookingDetails.bookingKey) && booking.bookingDetails.queueNumber > 0)
            .sort((a, b) => a.bookingDetails.queueNumber - b.bookingDetails.queueNumber);

          setBookingCollection(sortedBookingData)
        }
      });

      return () => { bookingListener && bookingListener()}
    }
  
    if(bookingStatus === 'inactive') { fetchQueue(); }
    if(bookingStatus === 'onQueue' || bookingDetails.queueNumber !== 0 ) { fetchBooking(); }
  }, [bookingStatus, bookingDetails?.queueNumber]);

  useEffect(() => { //update rider status
    const updateRiderStatus = async () => {
      try { 
        const { username } = firestoreUserData.personalInformation;
        const { bookingKey, city } = firestoreUserData.bookingDetails;
        const path = bookingKey && city ? `bookings/${city}/${bookingKey}/riderInformation` : `riders/${bookingPoints[2].city}/${username}`;
        const snapshot = await get(ref(realtime, path));
        const data = snapshot.exists() ? snapshot.val() : {};

        let updateNeeded = false;
        const updates = {};

        switch (true) {
          case Math.abs(data.riderStatus.heading - riderDetails.heading) > 50:
            updates[`riderStatus/heading`] = riderDetails.heading;
            updateNeeded = true;
            break;
          case data.riderStatus.tiltStatus !== riderDetails.tiltStatus:
            updates[`riderStatus/tiltStatus`] = riderDetails.tiltStatus;
            updateNeeded = true;
            break;
        }

        if (updateNeeded) { await update(ref(realtime, path), updates); }
      } catch (e) {console.log(e);}
    };

    if (bookingStatus === 'active' || bookingStatus === 'onQueue') { updateRiderStatus(); }
  }, [bookingStatus, riderDetails.heading, riderDetails.tiltStatus]);

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

      <TouchableOpacity //View Client Information
        style={[globalStyles.bookingInformationButton, { opacity: bookingStatus === 'active' ? 1 : 0 }]}
        disabled={Object.entries(bookingDetails.clientDetails).length === 0}
        onPress={() => setActions((prev) => ({ ...prev, clientInformationVisible: true }))}
      >
        <Ionicons style={globalStyles.bookingInformationButtonIcon} name="chevron-back" />
        <Ionicons style={globalStyles.bookingInformationButtonIcon} name="location-sharp"/>
      </TouchableOpacity>

      <BookingPopup //booking popup
        bookingStatus={bookingStatus} setBookingStatus={setBookingStatus}
        bookingPoints={bookingPoints} setBookingPoints={setBookingPoints}
        bookingCollection={bookingCollection}
        rejectedBookings={rejectedBookings} setRejectedBookings={setRejectedBookings}
        bookingDetails={bookingDetails} setBookingDetails={setBookingDetails}
      />

      <BottomControls //bottom controls
        actions={actions} setActions={setActions}
        bookingStatus={bookingStatus}
        bookingPoints={bookingPoints}
        bookingDetails={bookingDetails}
        bookingHandler={bookingHandler}
        mapRef={mapRef}
      />

      <AccidentPopup actions={actions} setActions={setActions}/>
      
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