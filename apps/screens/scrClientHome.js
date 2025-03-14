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
import FloatingView from '../components/modalFloatingView';
import LocationInput from '../components/cmpLocationInput';
import PanLocations from '../components/cmpPanLocations';
//libraries
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { set, ref, remove, push, get, onValue, update } from 'firebase/database';
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
//react native hooks
import React, { useState, useEffect, useRef, act } from 'react'
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
    { longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' },
    { longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'riders' },
    { longitude: '' , latitude: '', geoName: '', city: '', type: 'clients' },
  ]);
  const [riderDetails, setRiderDetails] = useState({});
  const [bookingDetails, setBookingDetails] = useState({ price: '0', duration: '0', distance: '0', });
  const [actions, setActions] = useState({ loading: true, locationAnimated: false, locationInputVisible: false, fareDetailsVisible: false, fetchingLocation: false, riderInformationVisible: false, onFocus: '' });
  
  //references ============================================================
  const mapRef = useRef(null);

  //functions =============================================================
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const bookingHandler = async() => {
    const { username, contactNumber, weight } = firestoreUserData.personalInformation;
    const { price, distance, duration } = bookingDetails;
    const { city, bookingKey } = firestoreUserData.bookingDetails;
    const { flag, accountStatus } = firestoreUserData.accountDetails; //accountDetails current flag
    
    try {
      if (bookingStatus === 'onQueue' || bookingStatus === 'active') {

        setBookingStatus('pending');
        
        await remove(ref(realtime, `bookings/${city}/${bookingKey}`));

        await updateDoc(doc(firestore, localData.userType, localData.uid), { 
          accountDetails: { ...firestoreUserData.accountDetails, flag: riderDetails?.personalInformation !== '' ? flag + 1 : flag }, //accountDetails flag
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
          const filterVerifiedUsers = Object.keys(bookingData).filter((key) => bookingData[key].bookingDetails.accountStatus === 'verified');
          queueNumber = filterVerifiedUsers.length + 1
        }
  
        if (queueNumber && queueNumber > 0) {
          await set(ref(realtime, `bookings/${bookingPoints[0].city}/${key}`), {
            bookingDetails:{ bookingKey: key, queueNumber: queueNumber, timestamp: new Date().getTime(), price: price, distance: distance, duration: duration, accountStatus: accountStatus },
            clientInformation:{ username: username, contactNumber: contactNumber, weight: weight, pickupPoint: bookingPoints[0], dropoffPoint: bookingPoints[1]},
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

  //useEffects ============================================================
  useEffect(() => {
    let locationSubscription = null;
    const { bookingKey, city } = firestoreUserData.bookingDetails;

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
            newPoint[3] = { ...prev[3], longitude, latitude, geoName: currentCity[0].formattedAddress, city: currentCity[0].city };
            return newPoint;
          });
        }
      );
    }

    const queueListener = onValue(ref(realtime, `bookings/${city}/${bookingKey}`), (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : null;
      
      if (!data) { return }

      setBookingStatus('onQueue');
      
      if (data?.riderInformation) {
        const { location, city, geoName, header } = data.riderInformation.statusDetails || {};
        const { vehicleInformation, personalInformation } = data.riderInformation || {};

        setBookingStatus('active');
        setBookingPoints((prev) => { //update rider location
          const newPoint = [...prev];
          newPoint[2] = { ...prev[2], longitude: location.longitude, latitude: location.latitude, geoName: geoName, city: city };
          return newPoint;
        });
        setRiderDetails((prev) => ({ ...prev, vehicleInformation: { ...vehicleInformation }, personalInformation: { ...personalInformation }, header }));
        //setActions((prev) => ({ ...prev, riderInformationVisible: true }));
        //setTimeout(() => { showNotification('Rider is on the way, Please wait and check your map', 'nofication', 5000); }, 3000);
      }

      const { pickupPoint, dropoffPoint } = data.clientInformation;
      const { price, duration, distance } = data.bookingDetails;

      setBookingPoints((prev) => { //update client location
        const newPoint = [...prev];
        newPoint[0] = { ...prev[0], longitude: pickupPoint.longitude, latitude: pickupPoint.latitude, geoName: pickupPoint.geoName, city: pickupPoint.city };
        newPoint[1] = { ...prev[1], longitude: dropoffPoint.longitude, latitude: dropoffPoint.latitude, geoName: dropoffPoint.geoName, city: dropoffPoint.city };
        return newPoint;
      });

      setBookingDetails((prev) => ({ ...prev, price, duration, distance }));
    })

    startLocationTracking();
    return () => { locationSubscription && locationSubscription.remove(); queueListener && queueListener(); };
  }, []);

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
            .sort((a, b) => {
              if (a.accountStatus === 'verified' && b.accountStatus !== 'verified') return -1;
              if (a.accountStatus !== 'verified' && b.accountStatus === 'verified') return 1;
              return a.queueNumber - b.queueNumber;
            });
  
          const updates = {};
          let updateNeeded = false;
  
          sortedBookings.forEach((booking, index) => {
            const correctQueueNumber = index + 1;
  
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
  
      return () => queueUnsubscribe();
    }
  }, [bookingStatus]);
  
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
            <View style={[globalStyles.priceContainer, { flexDirection: `column`}]}>
              {Object.entries(bookingDetails).map(([key, value], index) => (
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
          <PanLocations 
            bookingPoints={bookingPoints}
            setBookingPoints={setBookingPoints}
            mapRef={mapRef}
            setActions={setActions}
            bookingStatus={bookingStatus}
          />
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

      <Mapview 
        mapRef={mapRef}
        points={bookingPoints}
        bookingDetails={bookingDetails}
        setBookingDetails={setBookingDetails}
        header={riderDetails?.header}
      />

    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
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
})