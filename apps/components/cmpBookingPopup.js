//context providers
import { useControls } from '../providers/controls'
import { useThemes } from '../providers/themes'
import { useGlobalStyles } from '../providers/styles'
//components
import FloatingView from './modalFloatingView'
//libraries
import { realtime, firestore } from '../providers/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { get, ref, remove, set, update } from 'firebase/database'
//react native components
import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, Image, View, TouchableOpacity, PanResponder, Dimensions } from 'react-native'

export default function BookingPopup({ 
  bookingStatus, setBookingStatus,
  bookingPoints, setBookingPoints,
  bookingCollection, 
  rejectedBookings, setRejectedBookings,
  bookingDetails, setBookingDetails,
}) {

  //console.log(`rejectedBookings: ${rejectedBookings}`);
  
  
  //context variables
  const { localData, firestoreUserData } = useControls(); 
  const { colors, fonts, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables
  const [collectedBookings, setCollectedBookings] = useState([])
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  //functions
  const badgeHandler = (status) => {
    switch (status) {
      case 'verified': return colors.successGreenBackground;
      case 'pending': return colors.warningYellowBackground;
      default: return colors.errorRedBackground;
    }
  }

  const rejectHandler = async () => {
    setRejectedBookings((prev) => [...prev, collectedBookings[currentIndex]?.bookingDetails?.bookingKey]);
    console.log(collectedBookings);
    
    setIsVisible(false);
    
    if (currentIndex < collectedBookings.length - 1) { setTimeout(() => { setCurrentIndex((prev) => prev + 1) }, 200); }

    try {
      const { uid } = localData;
      const riderSnapshot = await get(ref(realtime, `riders/${bookingPoints[2].city}`));
      const riderSize = riderSnapshot.exists() ? riderSnapshot.size : null;

      if (riderSize > 1 && bookingDetails.queueNumber !== riderSize ) {
        await update(ref(realtime, `riders/${bookingPoints[2].city}/${uid}/riderStatus/`), { queueNumber: riderSize });
        await remove(ref(realtime, `riders/${bookingPoints[2].city}/${uid}`));
      }
    } catch (e) { console.log(e); }
  }

  const acceptHandler = async() => { 
    const { uid, userType } = localData;
    const { bookingKey, distance, duration, price } = collectedBookings[currentIndex]?.bookingDetails;
    const { accountStatus, contactNumber, dropoffPoint, pickupPoint, username } = collectedBookings[currentIndex].clientInformation

    setBookingStatus('pending');

    try {
      await updateDoc(doc(firestore, `${userType}/${uid}`), {
        bookingDetails: {
          bookingKey: collectedBookings[currentIndex]?.bookingDetails?.bookingKey,
          city: collectedBookings[currentIndex]?.clientInformation?.pickupPoint?.city,
          timestamp: serverTimestamp(),
        }
      });

      const snapshotRider = await get(ref(realtime, `riders/${bookingPoints[2].city}/${firestoreUserData.personalInformation.username}`));
      if (!snapshotRider.exists()) { return; }
      const riderData = snapshotRider.val();

      if (riderData.riderStatus && riderData.riderStatus.queueNumber) { //might become an error
        delete riderData.riderStatus.queueNumber;
      }
      
      await update(ref(realtime, `bookings/${bookingPoints[2].city}/${bookingKey}`), { 
        'bookingDetails/queueNumber': 0,
        riderInformation: { ...riderData }
      });
      
      await remove(ref(realtime, `riders/${bookingPoints[2].city}/${firestoreUserData.personalInformation.username}`));
      
      setBookingPoints((prev) => {
        const newPoints = [...prev];
        newPoints[0] = { ...prev[0], ...pickupPoint }
        newPoints[1] = { ...prev[1], ...dropoffPoint }
        return newPoints;
      });

      setBookingDetails((prev) => ({ ...prev, 
        bookingDetails: { distance, duration, price },
        clientDetails: { accountStatus, username, contactNumber }
      }));

      setTimeout(() => { setBookingStatus('active'); }, 1000);
      setIsVisible(false);

    } catch (e) { 
      console.log(e);
      setBookingStatus('onQueue');
    }
  }

  //useEffects
  useEffect(() => {
    const filteredBookings = bookingCollection.filter(booking => 
        !rejectedBookings.includes(booking.bookingDetails.bookingKey)
    );
    setCollectedBookings(filteredBookings);
  }, [bookingCollection, rejectedBookings]);

  useEffect(() => {
    const shouldShowPopup = 
    collectedBookings.length > 0 && 
    currentIndex < collectedBookings.length && 
    Object.entries(bookingDetails?.clientDetails || {}).length === 0 && 
    bookingStatus === 'onQueue';
    
    setIsVisible(shouldShowPopup);
  }, [collectedBookings, currentIndex])

  return (
    <FloatingView
      isVisible={isVisible}
      onClose={() => rejectHandler()}
      backdropOpacity={.15}
      height={'fit-content'}
      width={Dimensions.get('window').width * .75}
    >
      <View style={styles.container}>
        <View style={styles.clientContainer}>
          <View style={styles.clientInformation}>
            <Image style={styles.avatar} source={require('../assets/images/emptyProfile.png')} />
            <View style={styles.clientDetails}>
              <Text style={[styles.badge, { backgroundColor: badgeHandler(collectedBookings[currentIndex]?.clientInformation?.accountStatus)}]} numberOfLines={1}>
                {collectedBookings[currentIndex]?.bookingDetails?.accountStatus.toUpperCase()}
              </Text>
              <Text style={[globalStyles.priceContainerText, { fontSize: 17.5 }]} numberOfLines={1}>
                <Text style={[globalStyles.priceContainerText, { fontSize: 17.5, color: rgba(colors.primary, .25) }]}>Name: </Text>
                {collectedBookings[currentIndex]?.clientInformation?.username.toUpperCase()}
              </Text>
              <Text style={[globalStyles.priceContainerText, { fontSize: 15 }]} numberOfLines={1}>
                <Text style={[globalStyles.priceContainerText, { fontSize: 15, color: rgba(colors.primary, .25) }]}>+63 </Text>
                {collectedBookings[currentIndex]?.clientInformation?.contactNumber}
              </Text>
            </View>
          </View>
          <View style={styles.bookingDetails}>
            <View style={styles.bookingDetailsData}>
              <Text style={[globalStyles.priceContainerText, { fontSize: 17.5, color: rgba(colors.text, .25) }]}>PICKUP</Text>
              <Text style={[globalStyles.priceContainerText, { fontSize: 17.5 }]} numberOfLines={1}>{collectedBookings[currentIndex]?.clientInformation?.pickupPoint?.city}</Text>
            </View>
            <View style={styles.bookingDetailsData}>
              <Text style={[globalStyles.priceContainerText, { fontSize: 17.5, color: rgba(colors.text, .25) }]}>DROPOFF</Text>
              <Text style={[globalStyles.priceContainerText, { fontSize: 17.5 }]} numberOfLines={1}>{collectedBookings[currentIndex]?.clientInformation?.dropoffPoint?.city}</Text>
            </View>

            { collectedBookings[currentIndex] && Object.entries(collectedBookings[currentIndex]?.bookingDetails)
              .filter(([key, _]) => key === 'distance' || key === 'duration' || key === 'price')
              .map(([key, value], index) => {
                return (
                  <View key={index} style={styles.bookingDetailsData}>
                    <Text style={[globalStyles.priceContainerText, { fontSize: 17.5, color: rgba(colors.text, .25) }]}>{key.toUpperCase()}</Text>
                    <Text style={[globalStyles.priceContainerText, { fontSize: 17.5 }]} numberOfLines={1}>{ key === 'price' ? `Php ${value}` : key === 'duration' ? `${value} min.` : `${value} km`}</Text>
                  </View>
                )
            })}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[globalStyles.primaryHollowButton, {flex: 1}]} onPress={() => rejectHandler()}>
            <Text style={globalStyles.primaryHollowButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.primaryButton, {flex: 1}]} onPress={() => acceptHandler()}>
            <Text style={globalStyles.primaryButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FloatingView>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 15,
    gap: 10
  },
  clientContainer: {
    backgroundColor: rgba(colors.form, .5),
    borderRadius: 12,
    overflow: 'hidden'
  },
  clientInformation: {
    flexDirection: 'row',
    backgroundColor: rgba(colors.tertiary, .35),
    padding: 15,
    gap: 10
  },
  clientDetails: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  badge: {
    width: 100,
    fontFamily: fonts.Righteous,
    fontSize: 12,
    textAlign: 'center',
    color: colors.form,
    padding: 2,
    borderRadius: 6
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: 6
  },
  bookingDetails: {
    backgroundColor: rgba(colors.tertiary, .10),
    padding: 15,
  },
  bookingDetailsData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10
  }
})