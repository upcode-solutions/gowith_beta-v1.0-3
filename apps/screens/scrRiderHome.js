//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import BookingPopup from '../components/cmpBookingPopup';
import RiderBottomControls from '../components/cmpRiderBottomControls';
import AccidentPopup from '../components/cmpAccidentPopup';
//libraries
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { set, ref, remove, push, get, onValue, update } from 'firebase/database';
import { doc, onSnapshot, collection, updateDoc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { Text, Linking, TouchableOpacity, View, } from 'react-native'

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
  const [riderDetails, setRiderDetails] = useState({ heading: 0, tiltStatus: 'nominal' });
  const [bookingDetails, setBookingDetails] = useState({ queueNumber: 0, clientDetails: {}, bookingDetails: {}, steps: {} });
  const [actions, setActions] = useState({ loading: true, autoAccept: false, locationAnimated: false, tiltWarningVisible: false, clientInformationVisible: false, accidentOccured: false });

  const [bookingCollection, setBookingCollection] = useState([]);
  const [rejectedBookings, setRejectedBookings] = useState([]);

  //references =============================================================
  const mapRef = useRef(null);
  const warningTimeout = useRef(null);

  //functions ==============================================================
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const tiltHandler = async ({ x, y, z }) => {
    const newStatus = Math.abs(x) > 0.5 || Math.abs(z) < -0.5 || z < -0.25 || z > 0.9 ? 'critical' : 'nominal';
  
    tiltHandler.timer = setTimeout(() => (tiltHandler.timer = null), 2000);
    setRiderDetails(prev => ({ ...prev, tiltStatus: newStatus }));
    
    if (newStatus === 'critical' && !warningTimeout.current) {
        warningTimeout.current = setTimeout(() => setActions(prev => ({ ...prev, tiltWarningVisible: true })), 5000);
    } else if (newStatus === 'nominal' && warningTimeout.current) {
        clearTimeout(warningTimeout.current);
        warningTimeout.current = null;
        setActions(prev => ({ ...prev, tiltWarningVisible: false }));
    }
  };

  const fetchBookingCollection = async() => {
    if(bookingStatus !== 'onQueue') { return; }

    try {
      const bookingSnapshot = await get(ref(realtime, `bookings/${bookingPoints[2].city}`));
      const bookingData = bookingSnapshot.exists() ? Object.values(bookingSnapshot.val()).filter(booking => booking?.bookingDetails?.queueNumber > 0) : [];
      setBookingCollection(bookingData);
    } catch (e) { console.log(e); }
  };

  const bookingHandler = async() => { //rider queue handler, active or inactive
    const { username, firstName, lastName } = firestoreUserData.personalInformation;

    try {
      if (bookingStatus === 'active' || bookingStatus === 'onQueue') { 
        const { bookingKey, city } = firestoreUserData.bookingDetails || {};

        setBookingStatus('pending');

        if(bookingKey) {
          await remove(ref(realtime, `bookings/${city}/${bookingKey}/riderInformation`));
          
          const bookingSnapshot = await get(ref(realtime, `bookings/${city}`));
          if (bookingSnapshot.exists()) {
            const bookingData = bookingSnapshot.exists() ? Object.values(bookingSnapshot.val()).filter(booking => booking?.bookingDetails?.queueNumber > 0).length + 1 : 0;
            await update(ref(realtime, `bookings/${city}/${bookingKey}/bookingDetails`), { queueNumber: bookingData, clientOnBoard: false });
          }

          await updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), {
            accountDetails: { ...firestoreUserData.accountDetails, flags: firestoreUserData.accountDetails.flags + 1 },
            bookingDetails: {}
          });
        } else { await remove(ref(realtime, `riders/${bookingPoints[2].city}/${username}`)); }

        setBookingDetails({ queueNumber: 0, clientDetails: {}, bookingDetails: {}, steps: {} });

        setBookingPoints((prev) => { //update client location
          const newPoint = [...prev];
          newPoint[0] = { ...prev[0], longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' };
          newPoint[1] = { ...prev[1], longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' };
          return newPoint;
        });

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
          riderStatus: { accidentOccured: false, queueNumber, location: { latitude, longitude }, heading, tiltStatus, city, timestamp: new Date().getTime() },
        });
  
        setTimeout(() => { setBookingStatus('onQueue'); }, 3000);
        setBookingDetails((prev) => ({ ...prev, queueNumber }));
      }
    } catch (error) {
      setBookingStatus('inactive');
      console.warn("scrRiderHome - bookingHandler", error);
    }
  };

  const accidentHandler = async() => { //accident handler
    console.log(`accident handler`);
    try {
      const { bookingKey, city } = firestoreUserData.bookingDetails || {};
      const clientOnBoard = await get(ref(realtime, `bookings/${city}/${bookingKey}/bookingDetails/clientOnBoard`)).then(res => res.exists() ? res.val() : null);
      setActions((prev) => ({ ...prev, accidentOccured: true }));
      await updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), { 'accountDetails.accidentOccured': true });
      
      if (bookingKey && city) { //booked rider
        const {username} = firestoreUserData.personalInformation;

        if (bookingKey && city && clientOnBoard) { //booked and client on board
          update(ref(realtime, `bookings/${city}/${bookingKey}/bookingDetails`), { accidentOccured: true }); 
          return;
        } else if (bookingKey && city && !clientOnBoard) {
          updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), { 'bookingDetails': {} });
        }
        const riderSnapshot = await get(ref(realtime, `bookings/${city}/${bookingKey}/riderInformation`)).then(res => res.exists() ? res.val() : null);
        await update(ref(realtime, `bookings/${city}/${bookingKey}/bookingDetails`), { queueNumber: 1 });
        await remove(ref(realtime, `bookings/${city}/${bookingKey}/riderInformation`));
        //set rider to queue
        await set(ref(realtime, `riders/${bookingPoints[2].city}/${username}`), { ...riderSnapshot, riderStatus: { ...riderSnapshot.riderStatus, accidentOccured: true, queueNumber: 0 } });
      } else { //rider on queue
        const { username } = firestoreUserData.personalInformation;
        update(ref(realtime, `riders/${bookingPoints[2].city}/${username}/riderStatus`), { accidentOccured: true, accidentTimestamp: new Date().getTime(), queueNumber: 0 }); 
        console.log(`rider on queue`);
      }
      //updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), { 'accountDetails.accidentOccured': true });
    } catch (e) { console.log(`error updating rider status: ${e}`); }
  };

  //useEffects =============================================================
  useEffect(() => { //map animation after rider is locatied
    if (bookingPoints[2].latitude !== '' && bookingPoints[2].longitude !== '' && !actions.locationAnimated && !firestoreUserData.accountDetails.accidentOccured) {
      setTimeout(() => { mapRef.current && mapRef.current.animateCamera({ center: { latitude: bookingPoints[2].latitude || 0, longitude: bookingPoints[2].longitude || 0 }, pitch: 50, heading: riderDetails.heading || 0, zoom: 45 }, { duration: 500, }); }, 2800);
      setActions((prev) => ({ ...prev, locationAnimated: true }));
    }
  },[bookingPoints[2]]);

  useEffect(() => { //location, tilt and heading tracker
    const { username, firstName, lastName } = firestoreUserData.personalInformation || {};
    const { plateNumber, vehicleColor, vehicleModel } = firestoreUserData.vehicleDetails || {};
    const { heading, tiltStatus } = riderDetails;
    let locationSubscription = null;
    
    const startLocationTracking = async () => { //actively track rider location and update status if booking is onQueue || active
      if (!await requestForegroundPermissions()) { return Linking.openSettings(); }
      
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2.5 },
        async (location) => {
          const { accountDetails } = firestoreUserData || {};
          const { latitude, longitude } = location.coords; 
          if (!latitude || !longitude) { return }
          
          //if (accountDetails.accidentOccured || accountDetails.suspensionReason) { return }

          setTimeout(() => { setActions({ ...actions, loading: false }); }, 2500); 
          
          const currentCity = await Location.reverseGeocodeAsync(location.coords);
          
          setBookingPoints((prev) => { //update client location
            const newPoint = [...prev];
            newPoint[2] = { ...prev[2], longitude, latitude, city: currentCity[0].city, geoName: currentCity[0].formattedAddress};
            return newPoint;
          });

          if(bookingStatus === 'active') {
            const { bookingKey, city } = firestoreUserData.bookingDetails;
            await update(ref(realtime, `bookings/${city}/${bookingKey}/riderInformation/riderStatus`), { location: { latitude, longitude }, city: currentCity[0].city,});
          } else if(bookingStatus === 'onQueue') {
            try {
              if(currentCity[0].city === bookingPoints[2].city && bookingStatus === 'onQueue') {
                await update(ref(realtime, `riders/${bookingPoints[2].city}/${username}/riderStatus`), { 
                  location: { latitude, longitude },
                  tiltStatus: riderDetails.tiltStatus,
                });
              } else {
                setBookingStatus('pending');
                const riderSnapshot = await get(ref(realtime, `riders`));
  
                if(riderSnapshot.exists()) {
                  const cities = Object.keys(riderSnapshot.val());
                  for (let cityName of cities) { await remove(ref(realtime, `riders/${cityName}/${username}`)); }
                }
  
                const cityQueueSnapshot = await get(ref(realtime, `riders/${currentCity[0].city}`));
                const cityQueueData = cityQueueSnapshot.exists() ? Object.entries(cityQueueSnapshot.val()).filter(([_, value]) => value.queueNumber > 0).length + 1 : 1;
  
                await set(ref(realtime, `riders/${currentCity[0].city}/${username}`), {
                  personalInformation: { username, firstName, lastName },
                  vehicleInformation: { plateNumber, vehicleColor, vehicleModel },
                  riderStatus: { location: { latitude, longitude }, heading, tiltStatus, city: currentCity[0].city, timestamp: new Date().getTime(), queueNumber: cityQueueData }
                });
                
                setBookingPoints((prev) => { //update client location
                  const newPoint = [...prev];
                  newPoint[2] = { ...prev[2], city: currentCity[0].city };
                  return newPoint;
                });
                
                setTimeout(() => { setBookingStatus('onQueue'); }, 1000);
                fetchBookingCollection();
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
      const headingListener = await Location.watchHeadingAsync((headingData) => {
        setRiderDetails((prev) => {
          if (Math.abs(headingData.trueHeading - prev.heading) > 50) { return { ...prev, heading: headingData.trueHeading };}
          return prev;
        });
      });
      
      //tilt listener
      Accelerometer.setUpdateInterval(1000);
      const tiltListener = Accelerometer.addListener(tiltHandler)

      return () => { headingListener.remove(); tiltListener.remove(); };
    }

    startLocationTracking();
    if(!actions.loading && bookingStatus === 'active' || bookingStatus === 'onQueue') { headerTiltHandler(); }
    return () => { locationSubscription && locationSubscription.remove(); };
  },[bookingStatus]);

  useEffect(() => { //queue updater of riders
    let queueListener = null;
  
    const checkQueue = async () => {
      queueListener = onValue(ref(realtime, `riders/${bookingPoints[2].city}`), (snapshot) => {
        if (snapshot.exists()) {
          const snapshotData = snapshot.val();
          const sortedQueue = Object.entries(snapshotData)
            .map(([username, data]) => ({ username, ...data.riderStatus }))
            .filter((rider) => (rider.queueNumber !== null || rider.queueNumber !== undefined) && !rider.accidentOccured )
            .sort((a, b) => a.queueNumber - b.queueNumber);
          
          const updates = {};
          let updateNeeded = false;
  
          sortedQueue.forEach((rider, index) => {

            if (!rider.accidentOccured && rider.queueNumber !== index + 1) {
              updates[`riders/${bookingPoints[2].city}/${rider.username}/riderStatus/queueNumber`] = index + 1;
              updateNeeded = true;

              if (rider.username === firestoreUserData.personalInformation.username) { setBookingDetails((prev) => ({ ...prev, queueNumber: index + 1 })); }
            }
          });
  
          if (updateNeeded) { update(ref(realtime), updates); }
          fetchBookingCollection();
        }
      });
  
      return () => { queueListener && queueListener(); };
    }
  
    if(bookingStatus === 'onQueue' && !actions.accidentOccured ) { checkQueue(); }
  }, [bookingStatus, bookingPoints, actions.accidentOccured]);

  useEffect(() => { //fetch queue at first render
    const { username } = firestoreUserData.personalInformation;
  
    const fetchQueue = async () => { //fetch queue and parse the data
      const { bookingKey, city } = firestoreUserData.bookingDetails || {};

      try {
        if (bookingKey && city) {
          const bookingSnapshot = await get(ref(realtime, `bookings/${city}/${bookingKey}`));
          if (!bookingSnapshot.exists()) { return; }
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
              // Set accident status from existing data
              setActions(prev => ({ 
                ...prev, 
                accidentOccured: riderData.riderStatus?.accidentOccured || false 
              }));
              return;
            }
          }

        }
      } catch (error) { console.error("Error checking queue:", error); }
    };

    const fetchBooking = async () => { //fetch bookings on change
      const bookingListener = onValue(ref(realtime, `bookings/${bookingPoints[2].city}`), async (snapshot) => {
        if (!snapshot.exists()) { return }
        const ridersSnapshot = await get(ref(realtime, `riders/${bookingPoints[2].city}`));
        const snapshotDataSize = ridersSnapshot.exists() ? ridersSnapshot.size : 0;
        const bookingData = snapshot.val()

        if (!bookingData) { return setBookingCollection([]); }

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

  useEffect(() => {
    const { bookingKey, city } = firestoreUserData.bookingDetails || {};
    if (!bookingKey || !city) return;

    const unsubscribe = onValue(ref(realtime, `bookings/${city}/${bookingKey}`), async (snapshot) => {
      if (!snapshot.exists()) {
        setBookingStatus('inactive');
        console.log('booking ended');
        await updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), { bookingDetails: {} }).catch(console.error);
        setBookingDetails({ queueNumber: 0, clientDetails: {}, bookingDetails: {}, steps: {} });
        setBookingPoints((prev) => {
          const newPoints = [...prev];
          newPoints[0] = { longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' };
          newPoints[1] = { longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' };
          return newPoints;
        })
        console.log('booking ended');
        return;
      }
  
      const bookingData = snapshot.val();
      if (!bookingData?.clientInformation || !bookingData?.bookingDetails) return;
  
      setBookingPoints(prev => prev.map((point, i) => 
        i < 2 ? { ...point, ...(i === 0 ? bookingData.clientInformation.pickupPoint : bookingData.clientInformation.dropoffPoint) } : point
      ));
  
      setBookingDetails({
        bookingDetails: bookingData.bookingDetails,
        clientDetails: bookingData.clientInformation
      });
    });
  
    return () => unsubscribe();
  }, [firestoreUserData.bookingDetails, bookingStatus]);

  useEffect(() => { //update rider status
    const updateRiderStatus = async () => { //update rider's tilt and heading in realtime
      try { 
        const { username } = firestoreUserData.personalInformation || {};
        const { bookingKey, city } = firestoreUserData.bookingDetails || {};
        const path = bookingKey && city ? `bookings/${city}/${bookingKey}/riderInformation` : `riders/${bookingPoints[2].city}/${username}`;
        const snapshot = await get(ref(realtime, path));
        const data = snapshot.exists() ? snapshot.val() : {};

        let updateNeeded = false;
        const updates = {};

        if (!data.riderStatus) { return; }

        if (data.riderStatus.tiltStatus !== riderDetails.tiltStatus) {
          updates[`riderStatus/tiltStatus`] = riderDetails.tiltStatus;
          updateNeeded = true;
        }
        if (Math.abs(data.riderStatus.heading - riderDetails.heading) > 75) {
          updates[`riderStatus/heading`] = riderDetails.heading;
          updateNeeded = true;
        }

        if (updateNeeded) { await update(ref(realtime, path), updates); }
      } catch (e) {console.log(`error updating rider status: ${e}`);}
    };

    if (bookingStatus === 'active' || bookingStatus === 'onQueue') { updateRiderStatus(); }
  }, [bookingStatus, riderDetails]);

  //render =================================================================
  if (actions.loading) { //loading screen
    return (
      <Loading 
      loadingBackgroundColor={colors.background} 
      loadingMessage={'Preparing Map...'} 
      ActivityIndicatorColor={colors.primary}textColor={colors.primary}
      />
    )
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

      <RiderBottomControls //bottom controls
        actions={actions} setActions={setActions}
        bookingStatus={bookingStatus}
        setBookingStatus={setBookingStatus}
        bookingPoints={bookingPoints}
        setBookingPoints={setBookingPoints}
        bookingDetails={bookingDetails}
        bookingHandler={bookingHandler}
        mapRef={mapRef}
      />

      <AccidentPopup 
        actions={actions} 
        setActions={setActions} 
        warningTimeout={warningTimeout} 
        accidentHandler={accidentHandler}
      />
      
      <BookingIndicator bookingStatus={bookingStatus} accidentHandler={accidentHandler}/>
      
      <Mapview 
        bookingStatus={bookingStatus}
        mapRef={mapRef}
        points={bookingPoints}
        bookingDetails={bookingDetails}
        setBookingDetails={setBookingDetails}
        heading={riderDetails.heading}
      />

    </View>
  )
}