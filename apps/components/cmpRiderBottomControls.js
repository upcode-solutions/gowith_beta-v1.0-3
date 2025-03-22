//context providers
import { useControls } from '../providers/controls'
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import FloatingView from './modalFloatingView';
//libraries
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
//firebase
import { realtime, firestore } from '../providers/firebase';
import { setDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { update, ref, remove } from 'firebase/database';
//react native components
import React, { useEffect, useRef, useMemo, useState, use } from 'react'
import {Animated, Easing, Image, PanResponder, StyleSheet, Text, TouchableOpacity, Switch, Dimensions, View } from 'react-native'

export default function RiderBottomControls({ actions, setActions, bookingStatus, setBookingStatus, bookingPoints, setBookingPoints, bookingDetails, bookingHandler, mapRef }) {

    //console.log('bookingDetails: ', bookingDetails);

    //context variables
    const { firestoreUserData, localData } = useControls();
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    //local variables
    const [confirmationAction, setConfirmationAction] = useState({ isVisible: false, action: '', message: '' });
    //references
    const animatedY = useRef(new Animated.Value(0)).current; // Start collapsed
    const animatedYClamped = animatedY.interpolate({ inputRange: [55, 125], outputRange: [125, 55], extrapolate: 'clamp', });

    //functions
    const panResponder = useMemo(() => {
      if (bookingStatus === 'inactive' || bookingStatus === 'onQueue') {
        return { panHandlers: {} }; // Disable swipe
      }
    
      return PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
        onPanResponderGrant: () => {
          animatedY.setOffset(animatedY.__getValue());
          animatedY.setValue(0);
        },
        onPanResponderMove: (_, gesture) => animatedY.setValue(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          animatedY.flattenOffset();
          const shouldExpand = gesture.dy < -50 || gesture.vy < -0.5;
          Animated.timing(animatedY, { toValue: shouldExpand ? 125 : 55, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true, }).start();
        }
      });
    }, [bookingStatus]); // Recalculate when bookingStatus changes

    //functions
    const imageDirectionHandler = (instruction) => {
      const lowercaseInstruction = instruction.toLowerCase();
      if (lowercaseInstruction.includes('left') && (
        lowercaseInstruction.includes('turn') || 
        lowercaseInstruction.includes('arrive') || 
        lowercaseInstruction.includes('end'))) {
        return require('../assets/images/turn-left.png');
      } else if (lowercaseInstruction.includes('right') && (
        lowercaseInstruction.includes('turn') || 
        lowercaseInstruction.includes('arrive') ||
        lowercaseInstruction.includes('end'))) {
        return require('../assets/images/turn-right.png');
      } else if (lowercaseInstruction.includes('back right') ||
        lowercaseInstruction.includes('uturn') &&
        lowercaseInstruction.includes('right') ||
        lowercaseInstruction.includes('uturn')
      ) {
        return require('../assets/images/turn-back-right.png');
      } else if (lowercaseInstruction.includes('back left') ||
        lowercaseInstruction.includes('uturn') &&
        lowercaseInstruction.includes('left')
      ) {
        return require('../assets/images/turn-back-left.png');
      } else {
        return require('../assets/images/straight.png');
      }
    };

    const clientPickupHandler = async () => { //update clientOnBoard in bookingDetails
      const { bookingKey, city } = firestoreUserData?.bookingDetails || {};
      await update(ref(realtime, `bookings/${city}/${bookingKey}/bookingDetails`), { clientOnBoard: true });
    }
    
    const clientDropOffHandler = async () => { //update clientOnBoard in bookingDetails
      const { bookingKey, city } = firestoreUserData?.bookingDetails || {};
      const { uid } = localData || {};
      const { personalInformation } = firestoreUserData || {};
      const { clientDetails } = bookingDetails || {};
      const { price, distance, duration } = bookingDetails?.bookingDetails || {};
      //create booking history in firestore
      try {
        setBookingStatus('pending');
        await update(ref(realtime, `bookings/${city}/${bookingKey}/bookingDetails`), { bookingStatus: 'complete' });
        await setDoc(doc(firestore, `transactions/${uid}_${bookingKey}`), {
          bookingDetails: { price, distance, duration, pickupPoint: bookingPoints[0], dropOffPoint: bookingPoints[1], bookingStatus: 'complete', timestamp: serverTimestamp() },
          clientInformation: { firstName: clientDetails.firstName, lastName: clientDetails.lastName, username: clientDetails.username },
          riderInformation: { firstName: personalInformation.firstName, lastName: personalInformation.lastName, username: personalInformation.username },
        });
        await updateDoc(doc(firestore, `${localData.userType}/${localData.uid}`), { bookingDetails: {} });
        setBookingPoints((prev) => {
          const newPoints = [...prev];
          newPoints[0] = { longitude: '', latitude: '', geoName: '', city: '', type: 'pickup' };
          newPoints[1] = { longitude: '', latitude: '', geoName: '', city: '', type: 'dropoff' };
          return newPoints;
        });
        setTimeout(async() => { await remove(ref(realtime, `bookings/${city}/${bookingKey}/riderInformation`)); }, 1500);
        setBookingStatus('inactive');
      } catch (e) { console.warn(`error creating booking history: ${e}`); }
    }

    const callHandler = () => { 
      console.log(bookingDetails?.clientDetails?.contactNumber);
    }

    const rideNowHandler = () => { 
      if(bookingStatus === 'onQueue' || bookingStatus === 'active') { setConfirmationAction({ isVisible: true, action: 'cancelBooking', message: 'Are you sure you want to cancel this booking?' });
      } else { setConfirmationAction({ isVisible: true, action: 'startBooking', message: 'Are you sure you want enter the queing list in this area?' }); }
    }

    const pickupDropOffHandler = async () => {
      const { clientOnBoard } = bookingDetails?.bookingDetails || {};
      const { bookingKey, city } = firestoreUserData?.bookingDetails || {};
      
      if (clientOnBoard) { setConfirmationAction({ isVisible: true, action: 'clientDropOff', message: 'Are you sure the client payed the amount?' }); }
      else { setConfirmationAction({ isVisible: true, action: 'clientPickup', message: 'Are you sure you pickup the client now?' }); }
    }

    const confirmationHandler = () => { 
      console.log(confirmationAction.action);
      
      if (confirmationAction.action === 'cancelBooking') { bookingHandler() }
      else if (confirmationAction.action === 'startBooking') { bookingHandler() }
      else if (confirmationAction.action === 'clientPickup') { clientPickupHandler() }
      else if (confirmationAction.action === 'clientDropOff') { clientDropOffHandler() }

      setConfirmationAction({ isVisible: false, action: '', message: '' });
    }

    //useEffect
    useEffect(() => { 
      if ( bookingDetails.steps && Object.entries(bookingDetails?.steps).length > 0) { Animated.timing(animatedY, { toValue: 160, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true, }).start(); }
      else { Animated.timing(animatedY, { toValue: 55, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true, }).start(); }
    
      const speak = () => {
        const { instruction, distanceKm, street } = bookingDetails?.steps;
        if (!instruction || !distanceKm || !street) return;
        const phrase = `In ${distanceKm} km, ${instruction} at ${street}`;
        Speech.speak(phrase, {
          language: 'fil-PH',
          pitch: 1.1,
          rate: 1,
          voice: 'com.apple.speech.synthesis.voice.karen',
          quality: 'Enhanced',
        });
      }
    
      if ( bookingDetails.steps && Object.entries(bookingDetails?.steps).length > 0 ) { speak(); }
    }, [bookingDetails.steps]);

    //render
  return (
    <View style={styles.bottomContainer}>

      <FloatingView
        isVisible={confirmationAction.isVisible}
        onClose={() => {}}
        backdropOpacity={.25}
        height={'fit-content'}
        width={Dimensions.get('window').width * .75}
      >
        <View style={styles.confirmationContainer}>
          <View style={styles.messageContainer}>
            <Text style={[globalStyles.priceContainerText, { textAlign: 'center', fontSize: 15 }]}>{confirmationAction.message}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[globalStyles.primaryHollowButton, { flex: 1 }]} onPress={() => setConfirmationAction({ visible: false, action: '', message: '' })}>
              <Text style={globalStyles.primaryHollowButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.primaryButton, { flex: 1 }]} onPress={() => confirmationHandler()}>
              <Text style={globalStyles.primaryButtonText}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </FloatingView>
        
      <View style={styles.floatingContainerWrapper}>
        <Animated.View 
          style={[styles.floatingContainer, { transform: [{ translateY: animatedYClamped }] }]} 
          {...panResponder.panHandlers}
        >

          <View style={styles.directionContainer}>
            <LinearGradient
              colors={[rgba(colors.primary, 0.20), rgba(colors.form, 0.25)]}
              style={styles.linearGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              pointerEvents='none'
            >
              <Image style={styles.directionImage} source={imageDirectionHandler(bookingDetails?.steps?.instruction || '')} />
              <View style={styles.directionInstructions}>
                <Text style={[styles.directionInstructionsText, { fontSize: 20 }]} numberOfLines={1}>{`${bookingDetails?.steps?.instruction?.toUpperCase() || ''} ( ${bookingDetails?.steps?.distanceKm || 0} km )`}</Text>
                <Text style={[styles.directionInstructionsText, { fontSize: 17.5 }]} numberOfLines={1}>{`${bookingDetails?.steps?.street || 'an unnamed road'}`}</Text>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity 
            style={[styles.toggleButton, { opacity: bookingPoints[2].city === '' ? 0 : 1 }]}
            onPress={() => mapRef.current.animateCamera({ center: { latitude: bookingPoints[2].latitude, longitude: bookingPoints[2].longitude }, zoom: 40, pitch: 45 })}
            disabled={bookingPoints[2].city === ''}
          > 
            <Ionicons name="locate" size={22} color={colors.constantWhite} />
          </TouchableOpacity>
        </Animated.View>

      </View>

      <View style={globalStyles.bottomControls}>
        { bookingStatus !== 'active' ? 
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
        : 
        <View style={[globalStyles.buttonContainer, { flexDirection: 'row' }]}>
          <TouchableOpacity 
            style={[globalStyles.primaryHollowButton, { flex: 1, opacity: bookingStatus !== 'active' || !bookingDetails?.steps?.instruction?.includes('arrive') && !bookingDetails?.steps?.distanceKm?.includes('0.00') ? 0.5 : 1 }]} 
            onPress={() => pickupDropOffHandler()}
            disabled={bookingStatus === 'pending' || !bookingDetails.steps?.instruction?.includes('arrive') && !bookingDetails?.steps?.distanceKm?.includes('0.00') }
          >
            <Text style={globalStyles.primaryHollowButtonText}>{bookingDetails?.bookingDetails?.clientOnBoard ? 'Drop Off' : 'Pick Up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[globalStyles.primaryButton, { flex: .35, backgroundColor: colors.secondary }]} 
            onPress={() => callHandler()}
          >
            <Ionicons name="send" size={22} color={colors.constantWhite} />
          </TouchableOpacity>
        </View>
        }
        <TouchableOpacity 
          style={[globalStyles.primaryButton, { opacity: bookingStatus === 'pending' ? 0.5 : 1 }]} 
          onPress={() => rideNowHandler()}
          disabled={bookingStatus === 'pending'}
        >
        <Text style={globalStyles.primaryButtonText}>{bookingStatus === 'active' || bookingStatus === 'onQueue' ? 'Cancel Ride' : 'Ride Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>

  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  confirmationContainer: {
    height: 'fit-content',
    width: '100%',
    backgroundColor: colors.background,
    alignSelf: 'center',
    borderRadius: 12,
    padding: 15,
    gap: 10
  },
  messageContainer: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.form,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  floatingContainerWrapper: {
    height: 140,
    position: 'absolute',
    top: -140,
    width: '100%',
    overflow: 'hidden', 
    alignSelf: 'center',
    zIndex: -1, 
    paddingHorizontal: 15,
  },
  floatingContainer: {
    flexDirection: 'row',
    height: 75,
    width: '100%',
    backgroundColor: colors.form,
    alignSelf: 'center',
    borderRadius: 12,
    shadowColor: 'black',
    elevation: 10, 
    marginBottom: 10
  },
  directionContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  linearGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 20
  },
  directionImage: {
    width: 45,
    height: '100%',
    resizeMode: 'contain',
  },
  directionInstructions: {
    flex: 1,
    alignItems: 'left',
    justifyContent: 'center',
  },
  directionInstructionsText: {
    fontFamily: fonts.Righteous,
    fontSize: 13,
    color: colors.primary
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
  toggleButton: {
    height: 45,
    width: 45,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
    top: -55,
    zIndex: 99,
    shadowColor: 'black',
    elevation: 5
  },
  switch: {
    height: 20,
  },
})