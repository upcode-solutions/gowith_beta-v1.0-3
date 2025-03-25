//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
import BookingIndicator from '../components/cmpBookingIndicator';
import ClientBottomControls from '../components/cmpClientBottomControls';
import FloatingView from '../components/modalFloatingView';
//libraries
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { set, ref, remove, push, get, onValue, update } from 'firebase/database';
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
//react native hooks
import React, { useState, useEffect, useRef, act, use } from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'

export default function ClientHome() {

  //contexts providers ===================================================
  const { localControls, localData, firestoreUserData } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  const { showNotification } = useNotification();
  //local variables =======================================================
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: 'Pateros', city: '', type: 'pickup' },
    { longitude: '', latitude: '', geoName: 'Taguig', city: '', type: 'dropoff' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'riders' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'clients' },
  ]);
  const [riderDetails, setRiderDetails] = useState({});
  const [bookingDetails, setBookingDetails] = useState({ price: '0', duration: '0', distance: '0', queueNumber: '0', bookingDetails: { } });
  const [actions, setActions] = useState({ loading: true, locationAnimated: false, locationInputVisible: false, fareDetailsVisible: false, fetchingLocation: false, riderInformationVisible: false, onFocus: '' });
  
  //references ============================================================
  const mapRef = useRef(null);

  //functions =============================================================
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const bookingHandler = async() => {
    const { username, contactNumber, weight, firstName, lastName } = firestoreUserData.personalInformation;
    const { price, distance, duration } = bookingDetails;
    const { city, bookingKey } = firestoreUserData.bookingDetails;
    const { flag, accountStatus } = firestoreUserData.accountDetails; //accountDetails current flag
    
    try {
      if (bookingStatus === 'onQueue' || bookingStatus === 'active') {

        setBookingStatus('pending');
        
        await remove(ref(realtime, `bookings/${city}/${bookingKey}`));

        await updateDoc(doc(firestore, localData.userType, localData.uid), { 
          accountDetails: { ...firestoreUserData.accountDetails, flags: riderDetails?.personalInformation !== '' ? flag + 1 : flag }, //accountDetails flag
          bookingDetails: {} //remove booking key from firestore
        });

        setRiderDetails({});
        setBookingDetails({ price: '0', duration: '0', distance: '0', });
        setBookingPoints((prev) => {
          const newPoints = [...prev];
          newPoints[2] = { longitude: '', latitude: '', geoName: '', city: '', type: 'riders' };
          return newPoints;
        });
        setTimeout(() => { setBookingStatus('inactive'); }, 3000);
      } else if (bookingStatus === 'inactive') {
        
        setBookingStatus('pending');
  
        const key = push(ref(realtime, 'bookings')).key;
        if(!key) { return; }

        setBookingDetails({ ...bookingDetails, bookingKey: key });
        
        const bookingSnapshot = await get(ref(realtime, `bookings/${bookingPoints[0].city}`));
        const bookingData = bookingSnapshot.exists() ? bookingSnapshot.val() : {};
        let queueNumber;

        if (accountStatus === 'unverified') {
          queueNumber = Object.keys(bookingData).length + 1
        } else {
          const filterVerifiedUsers = Object.keys(bookingData).filter((key) => bookingData[key].bookingDetails.accountStatus === 'verified' && bookingData[key].bookingDetails.queueNumber > 0);
          queueNumber = filterVerifiedUsers.length + 1
        }
  
        if (queueNumber && queueNumber > 0) {
          await set(ref(realtime, `bookings/${bookingPoints[0].city}/${key}`), {
            bookingDetails:{ accidentId: '', accidentOccured: false, accidentTime: '', clientOnBoard: false, accountStatus: accountStatus, bookingKey: key, queueNumber: queueNumber, timestamp: new Date().getTime(), price: price, distance: distance, duration: duration},
            clientInformation:{ username: username, contactNumber: contactNumber, weight: weight, pickupPoint: bookingPoints[0], dropoffPoint: bookingPoints[1], firstName: firstName, lastName: lastName },
          });
    
          await updateDoc(doc(firestore, localData.userType, localData.uid), { 
            bookingDetails: { ...firestoreUserData.bookingDetails, bookingKey: key, city: bookingPoints[0].city, timestamp: serverTimestamp() }, 
          });

          setTimeout(() => { setBookingStatus('onQueue'); }, 3000); 
        } else { throw new Error('failed to submit booking'); }
      }
    } catch (error) { 
      console.warn('Error submitting booking:', error);
      setBookingStatus('inactive');
    }
  }

  const transactionCompleteHandler = () => { console.log('complete'); }

  const accidentOccuredHandler = async() => { 
    try {
      const { userType, uid } = localData;
      setTimeout(async() => { 
        await updateDoc(doc(firestore, `${userType}/${uid}`), {'accountDetails.accidentOccured': true })
      }, 3000);
      setBookingStatus('inactive');
      console.log('Accident occured');
      
    } catch (error) { console.log(error); }
  }

  //useEffects ============================================================
  useEffect(() => { //animation at first render
    if (bookingPoints[3].latitude !== '' && bookingPoints[3].longitude !== '' && !actions.locationAnimated) {
      setTimeout(() => { mapRef.current && mapRef.current?.animateToRegion({ longitude: bookingPoints[3].longitude || 0, latitude: bookingPoints[3].latitude || 0, latitudeDelta: 0.01, longitudeDelta: 0.01 }); }, 2700);
      setActions((prev) => ({ ...prev, locationAnimated: true }));
    }
  }, [bookingPoints[3]]);

  useEffect(() => { //location tracking and fetch queue
    let locationSubscription = null;

    const startLocationTracking = async () => { //location tracking
      if (!await requestForegroundPermissions()) { return; }
      
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2500, distanceInterval: 2.5 },
        async (location) => {
          const { latitude, longitude } = location.coords; 
          if (!latitude || !longitude) { return }
          
          setTimeout(() => { setActions({ ...actions, loading: false }); }, 2500); 
          const currentCity = await Location.reverseGeocodeAsync(location.coords);

          setBookingPoints((prev) => { //update client location
            const newPoint = [...prev];
            newPoint[3] = { ...prev[3], longitude, latitude, geoName: currentCity[0].formattedAddress, city: currentCity[0].city };
            return newPoint;
          });
        }
      );
    }

    const fetchQueue = async() => { //fetch queue (redux)
      const { bookingKey, city } = firestoreUserData.bookingDetails || {};
      
      if(!bookingKey || !city) { return; }

      const fetchQueue = await get(ref(realtime, `bookings/${city}/${bookingKey}`));
      const queueSnapshot = fetchQueue.exists() ? fetchQueue.val() : {};
      if (Object.entries(queueSnapshot).length > 0) {
        const { clientInformation, bookingDetails, riderInformation } = queueSnapshot || {};

        if (riderInformation) { setBookingStatus('active'); }
        else { setBookingStatus('onQueue'); }

        setBookingPoints((prev) => {
          const newPoint = [...prev]; 
          newPoint[0] = { ...prev[1], ...clientInformation.pickupPoint };
          newPoint[1] = { ...prev[2], ...clientInformation.dropoffPoint };
          return newPoint;
        })

        setBookingDetails((prev) => ({ ...prev, 
          price: bookingDetails.price, 
          distance: bookingDetails.distance, 
          duration: bookingDetails.duration, 
          queueNumber: bookingDetails.queueNumber, 
          bookingDetails: {...prev.bookingDetails, 
            clientOnBoard: bookingDetails.clientOnBoard,
            bookingStatus: bookingDetails.bookingStatus,
          } 
        }));
      }
    }

    

    startLocationTracking();
    fetchQueue();
    return () => { locationSubscription && locationSubscription.remove(); };
  }, []);

  useEffect(() => {
    if (bookingStatus === 'onQueue') {
      const { city } = firestoreUserData.bookingDetails;
      const queueBookingRef = ref(realtime, `bookings/${city}`);
  
      const queueUnsubscribe = onValue(queueBookingRef, (snapshot) => { //queue number listener
        if (snapshot.exists() && Object.entries(riderDetails).length === 0) {
          const bookings = snapshot.val();
          const sortedBookings = Object.entries(bookings)
            .map(([key, value]) => ({ key, ...value.bookingDetails }))
            .filter((booking) => booking.queueNumber)
            .sort((a, b) => {
              if (a.accountStatus === 'verified' && b.accountStatus !== 'verified') return -1;
              if (a.accountStatus !== 'verified' && b.accountStatus === 'verified') return 1;
              return a.queueNumber - b.queueNumber;
            });
  
          const updates = {};
          let updateNeeded = false;
  
          sortedBookings.forEach((booking, index) => {
            const correctQueueNumber = index + 1;
            if (booking.queueNumber === correctQueueNumber) { return; }
  
            if (booking.queueNumber !== correctQueueNumber) {
              updateNeeded = true;
              updates[`bookings/${city}/${booking.key}/bookingDetails/queueNumber`] = correctQueueNumber;
            }
          });
  
          if (updateNeeded) {
            update(ref(realtime), updates).catch((err) => console.error("Error updating queue:", err));
          }
        }
      });
  
      return () => queueUnsubscribe() 
    }
  }, [bookingStatus]);

  useEffect(() => {
    const { bookingKey, city } = firestoreUserData.bookingDetails;
    if (!bookingKey || !city) return;
    let lastLocation = null;
    
    const bookingSubscriber = onValue(ref(realtime, `bookings/${city}/${bookingKey}`), async(snapshot) => {
        if (!snapshot.exists()) return;
        const bookingData = snapshot.val();
        //console.log("Updated bookingData:", bookingData);
        
        const riderInformation = bookingData?.riderInformation;
        const bookingDetails = bookingData?.bookingDetails;

        if (bookingDetails) {
            setBookingDetails((prev) => ({ ...prev, bookingDetails: { ...prev.bookingDetails, bookingStatus: bookingDetails.bookingStatus } }));
            if (bookingDetails.accidentOccured && bookingDetails.accidentId) accidentOccuredHandler();
        }

        if (!riderInformation) {
            console.log('No rider assigned yet.');
            setBookingStatus('onQueue');
            setRiderDetails({});
            setBookingDetails({ price: '0', duration: '0', distance: '0', queueNumber: '0', bookingDetails: {} });
            setBookingPoints((prev) => {
                const newPoint = [...prev];
                newPoint[2] = { ...prev[2], longitude: '', latitude: '', geoName: '', city: '', type: 'riders' };
                return newPoint;
            });
            return;
        }

        const { personalInformation, riderStatus } = riderInformation;
        const { clientOnBoard } = bookingData?.bookingDetails || {};
        if (!riderStatus || !riderStatus.location) return;

        if (lastLocation !== riderStatus.location) {
            lastLocation = riderStatus.location;
            const geoName = await Location.reverseGeocodeAsync(riderStatus.location).then((res) => res[0]?.formattedAddress);
            setBookingPoints((prev) => {
                const newPoint = [...prev];
                newPoint[2] = { ...prev[2], longitude: riderStatus.location.longitude, latitude: riderStatus.location.latitude, city: riderStatus.city, geoName };
                return newPoint;
            });
        }

        setBookingStatus('active');
        console.log(`heading: ${riderStatus.heading}, tiltStatus: ${riderStatus.tiltStatus}`);
        setRiderDetails((prev) => ({ ...prev, heading: riderStatus.heading, tiltStatus: riderStatus.tiltStatus, personalInformation }));
        setBookingDetails((prev) => ({ ...prev, bookingDetails: { ...prev.bookingDetails, clientOnBoard } }));
    });

    return () => bookingSubscriber();
  }, [firestoreUserData?.bookingDetails?.bookingKey, firestoreUserData?.bookingDetails?.city]);


  
  //render ================================================================
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

      <BookingIndicator bookingStatus={bookingStatus} />

      <TouchableOpacity 
        style={[globalStyles.bookingInformationButton, { opacity: bookingPoints[2].latitude === '' && bookingPoints[2].longitude === '' ? 0 : 1 }]}
        disabled={bookingPoints[2].latitude === '' || bookingPoints[2].longitude === ''}
        onPress={() => setActions((prev) => ({ ...prev, riderInformationVisible: true }))}
      >
        <Ionicons style={globalStyles.bookingInformationButtonIcon} name="chevron-back" />
        <Ionicons style={globalStyles.bookingInformationButtonIcon} name="bicycle"/>
      </TouchableOpacity>

      <FloatingView 
        isVisible={actions.riderInformationVisible}
        onClose={() => setActions((prev) => ({ ...prev, riderInformationVisible: false }))}
        height={'fit-content'}
        width={Dimensions.get('window').width - 30}
      >
        <View style={globalStyles.floatiingView}>
          <View style={globalStyles.floatingViewProfileContainer}>
            <Image style={globalStyles.floatingViewImage} source={require('../assets/images/emptyProfile.png')} />
            <View style={{flex: 1}}>
              { Object.entries(riderDetails?.personalInformation ?? {}).map(([key, value], index) => (
                <View key={index} style={styles.priceDataContainer}>
                  <Text style={[globalStyles.priceContainerText, { opacity: .5 }]}>{key.toUpperCase()}</Text> 
                  <Text style={globalStyles.priceContainerText}>{value.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={globalStyles.floatingViewDataContainer}>
            <Text style={globalStyles.priceContainerText}>VEHICLE INFORMATION</Text>
            <View style={globalStyles.dividerLine}/>
            { Object.entries(riderDetails?.vehicleInformation ?? {}).map(([key, value], index) => (
              key === 'username' || key === 'contactNumber' || key === 'weight' || key === 'imageURL' ? null :
              <View key={index} style={styles.priceDataContainer}>
                <Text style={[globalStyles.priceContainerText, { opacity: .5 }]}>{key.toUpperCase()}</Text> 
                <Text style={globalStyles.priceContainerText}>{value.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={globalStyles.primaryButton} onPress={() => setActions((prev) => ({ ...prev, riderInformationVisible: false }))}>
            <Text style={globalStyles.primaryButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </FloatingView>
      
      <ClientBottomControls
        actions={actions}
        setActions={setActions}
        bookingPoints={bookingPoints}
        setBookingPoints={setBookingPoints} 
        mapRef={mapRef} 
        bookingStatus={bookingStatus} 
        bookingDetails={bookingDetails}
        bookingHandler={bookingHandler}
        transactionCompleteHandler={transactionCompleteHandler}
      />

      <Mapview 
        bookingStatus={bookingStatus}
        mapRef={mapRef}
        points={bookingPoints}
        bookingDetails={bookingDetails}
        setBookingDetails={setBookingDetails}
        heading={riderDetails?.heading}
      />

    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
})