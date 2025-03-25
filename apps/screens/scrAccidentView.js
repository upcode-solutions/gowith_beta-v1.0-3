//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//libraries
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
//firebase
import { firestore, realtime } from '../providers/firebase';
import { doc, setDoc, getDocs, getDoc, updateDoc, serverTimestamp, Timestamp, collection } from 'firebase/firestore';
import { ref, get, remove, update, set } from 'firebase/database';
//react native components
import React, { useEffect, useRef, useState } from 'react'
import { Image, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, TouchableWithoutFeedback, Dimensions, LogBox, NativeEventEmitter } from 'react-native'

export default function AccidentView() {

  //context variables
  const { firestoreUserData, localData } = useControls();
  const { colors, fonts, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  const { showNotification } = useNotification();
  //local variables
  const [action, setAction] = useState({ KeyboardVisile: false, inputVisible: false, rendered: false });
  const [input, setInput] = useState('Noxsie123!');
  const [errorMessage, setErrorMessage] = useState('');
  const [necessaryData, setNecessaryData] = useState({});

  //setNecessaryData({ userType, bookingKey, city, uid, accidentHistory, bookingDetails: bookingSnapshot });
  
  //functions
  const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  const textBoxBacgroundHandler = () => {
    let input = colors.form;

    if (errorMessage) {
      const loweredErrorMessage = errorMessage.toLowerCase();
      if (loweredErrorMessage.includes('input')) { input = colors.errorRedText; }
    }

    return [input];
  }

  const parseFalseData = async() => {
    const data = {
      accountDetails: {
        accidentHistory: [],
        accidentOccured: false,
        accountStatus: "verified",
        accountUid: "hacS2bUiCPM2GXPJx4JWPRN7iCW2",
        dateCreated: serverTimestamp(),
        deviceId: "sdk_gphone64_x86_64",
        flags: 0,
        passwordChangedDate: "",
        suspensionAmount: 0,
        suspensionDate: "",
        suspensionDuration: "",
        suspensionReason: "",
        userType: "riders"
    },
    vehicleDetails: {
      OR: "hacS2bUiCPM2GXPJx4JWPRN7iCW2",
      CR: "hacS2bUiCPM2GXPJx4JWPRN7iCW2",
      vehicleColor: "GREEN",
      vehicleModel: "HONDA PRESS",
      plateNumber: "123-HALA"
    },
    emergencyDetails: {},
    bookingDetails: {},
    imageURL: {}
  };

  await updateDoc(doc(firestore, `riders/hacS2bUiCPM2GXPJx4JWPRN7iCW2`), data);  
}

  const errorMessageHandler = (message) => { //error handler
    setErrorMessage(message);
    showNotification(message, 'error', 5000);
  }

  const createAccidentReport = async (accidentType) => {
    const { userType, uid, bookingKey, city, accidentHistory, bookingDetails } = necessaryData || {};
    const { accidentId } = bookingDetails?.bookingDetails || {};
    const { clientOnBoard } = bookingDetails?.bookingDetails || {};
    const { username, firstName, lastName } = firestoreUserData?.personalInformation || {};
    const { accidentStatus } = firestoreUserData?.accountDetails || {};

    const accidentRef = doc(collection(firestore, "accidents"));
  
    if (!necessaryData || !firestoreUserData) return console.log("Missing necessary data");
  
    const lastAccident = accidentHistory?.length ? accidentHistory[accidentHistory.length - 1] : null;
    const latestAccident = lastAccident ? await getDoc(doc(firestore, `accidents/${lastAccident}`)).then(res => res.exists() ? res.data() : {}) : {};
  
    if (lastAccident && Date.now() - (latestAccident?.accidentDetails?.accidentDateTime?.toMillis?.() || 0) < 10800000 || accidentStatus === 'pending') {
      return console.log("Accident report blocked");
    }
  
    try {
      if (userType === 'clients') {
        await updateDoc(doc(firestore, `${userType}/${uid}`), { 
          'accountDetails.accidentHistory': [...(accidentHistory || []), `${accidentId}`],
          'accountDetails.accidentStatus': 'pending' 
        });
      } else if (userType === 'riders') {
        const { vehicleColor, vehicleModel, plateNumber } = firestoreUserData?.vehicleDetails || {};

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

  
        if (clientOnBoard) {
          await update(ref(realtime, `bookings/${city}/${bookingKey}`), { 
            'bookingDetails/accidentId': `${accidentRef.id}`, 
            'bookingDetails/accidentTime': Date.now() 
          });
        }
  
        const data = { 
          accidentDetails: { accidentDateTime: serverTimestamp(), accidentId: accidentRef.id, detectionStatus: true, location: { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }, type: `${userType} - accident ${accidentType}` },
          riderInformation: { username, firstName, lastName, vehicleColor, vehicleModel, plateNumber },
          clientInformation: bookingDetails?.clientInformation || {},
          bookingDetails: bookingDetails?.bookingDetails ? {
            bookingKey: bookingDetails.bookingDetails.bookingKey,
            price: bookingDetails.bookingDetails.price,
            distance: bookingDetails.bookingDetails.distance,
            duration: bookingDetails.bookingDetails.duration,
            pickupPoint: bookingDetails.clientInformation?.pickupPoint,
            dropoffPoint: bookingDetails.clientInformation?.dropoffPoint,
          } : {},
          paramedicInformation: {}
        };
  
        await updateDoc(doc(firestore, `${userType}/${uid}`), { 
          'accountDetails.accidentHistory': [...(accidentHistory || []), `${accidentRef.id}`],
          'accountDetails.accidentStatus': 'pending' 
        });
  
        await setDoc(doc(firestore, `accidents/${accidentRef.id}`), data);
      }
    } catch (error) {
      console.log(`${userType} create accident report error:`, error);
    }
  };
  
    
  const submitHandler = async() => { //lift accident
    
    //detects if there is a + in the front of the input
    try {
      if (input[0] === '+') {
      } else if (firestoreUserData.personalInformation.password === input) {
        if (localData.userType === 'clients') {
          await remove(ref(realtime, `bookings/${necessaryData.city}/${necessaryData.bookingKey}`));
          await updateDoc(doc(firestore, `${necessaryData.userType}/${necessaryData.uid}`), { 
            'accountDetails.accidentOccured': false, 
            'accountDetails.accidentStatus': 'settled',
            'bookingDetails': {}
          });
        }
        if (necessaryData.userType === 'riders') {;
          const { accountDetails, bookingDetails } = firestoreUserData || {};
          const lastAccident = accountDetails.accidentHistory[accountDetails.accidentHistory.length - 1] || [];
          
          if (lastAccident.length) {
            await updateDoc(doc(firestore, `accidents/${lastAccident}`), { 'accidentDetails.detectionStatus': false });
          }

          const { clientOnBoard } = necessaryData.bookingDetails.bookingDetails || {};
          
          await updateDoc(doc(firestore, `${necessaryData.userType}/${necessaryData.uid}`), { 
            'accountDetails.accidentOccured': false, 
            'accountDetails.accidentStatus': 'settled',
            'accountDetails.suspensionDuration': clientOnBoard ? `7` : `3`,
            'accountDetails.suspensionDate': serverTimestamp(),
            'accountDetails.suspensionReason': 'Negligence resulting to false accident report',
            'bookingDetails': {}
          });
          
          if (bookingDetails?.bookingDetails?.clientOnBoard) {
            console.log(`client accident report`); //
            await remove(ref(realtime, `bookings/${necessaryData.city}/${necessaryData.bookingKey}/riderInformation`));
          } else {
            const username = firestoreUserData.personalInformation.username;
            const ridersSnapshot = await get(ref(realtime, `riders`)).then(res => res.val());
            
            ridersSnapshot && Object.keys(ridersSnapshot).forEach(city => {
              if (ridersSnapshot[city][username]) {
                remove(ref(realtime, `riders/${city}/${username}`));
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(`${userType} create accident report`, error);
      errorMessageHandler('Unknown Input, Please try again.');
    }
  }

  //useEffects
  useEffect(() => {
    if (!firestoreUserData?.personalInformation || !localData?.userType) {
        console.log('Required data not yet available:', { 
            hasUserData: !!firestoreUserData?.personalInformation,
            hasLocalData: !!localData?.userType 
        });
        return;
    }

    const fetchData = async () => {
        try {
            const { bookingKey, city } = firestoreUserData.bookingDetails || {};
            const { userType, uid } = localData;
            const { accidentHistory } = firestoreUserData.accountDetails || {};
    
            let bookingSnapshot = null;
            if (bookingKey && city) { bookingSnapshot = await get(ref(realtime, `bookings/${city}/${bookingKey}`)).then(res => res.exists() ? res.val() : null);  }
    
            setTimeout(() => {
              setNecessaryData({ userType, bookingKey, city, uid, accidentHistory, bookingDetails: bookingSnapshot });
            }, 1000);
        } catch (error) {  console.log(`${userType} init`, error); }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (necessaryData.userType) {
      const createReport = async () => {
        try {
          if (localData.userType === 'riders') {
            if (necessaryData.bookingKey && necessaryData.city && necessaryData.bookingDetails?.bookingDetails?.clientOnBoard) {
                await createAccidentReport('onBoard');
            } else {
                await createAccidentReport('onQueue');
            }
          } else if (localData.userType === 'clients') { createAccidentReport('onBoard'); }
        } catch (error) {  console.log(`${userType} init`, error);  }
      };

      createReport();
    }
  }, [necessaryData]);

  //renders

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ImageBackground style={globalStyles.imageBackground} imageStyle={styles.imageBackground} source={require('../assets/images/scenery.png')}>
        
        <LinearGradient
          colors={[rgba(colors.primary, .85), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.primary, .75)]}
          style={[globalStyles.overlay, { filter: 'blur(5px)' }]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0.75, y: 1.10 }}
          pointerEvents='none'
        />

        <View style={styles.container}>
        
          <View style={styles.contentContainer}>
            <View style={[globalStyles.headerContainer, { justifyContent: 'center', flexDirection: 'column', paddingVertical: 20 }]}>
                <Text style={[globalStyles.headerText, { textAlign: 'center', fontSize: 20 }]}>HELP IS ON THEIR WAY</Text>
            </View>

            <View style={styles.imageContainer}>
              <Image style={styles.image} source={require('../assets/images/vectorDoctor.png')} />
            </View>

            <View style={[globalStyles.headerContainer, { justifyContent: 'center', flexDirection: 'column', paddingVertical: 20 }]}>
                <Text style={[globalStyles.headerText, { textAlign: 'center', paddingHorizontal: 20 }]}>Please, stay still and avoid moving your body to avoid futher injury. Help will arrive soon</Text>
            </View>
            <View style={styles.formContainer}>
                <View style={globalStyles.headerContainer}>
                    <Ionicons name="key" color={colors.constantWhite} size={20} />
                    <Text style={[globalStyles.headerText, { fontSize: 15 }]}>False Alarm?</Text>
                </View>
                <View style={[
                  globalStyles.textBox, 
                  { backgroundColor: textBoxBacgroundHandler()[0] },
                  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
                ]}>
                  <TextInput
                    style={[globalStyles.textInput, { flex: 1 }]}
                    placeholder="Password to cancel the accident"
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={input}
                    onChangeText={(text) => setInput(text)}
                    secureTextEntry={action.inputVisible}
                  />
                  <TouchableOpacity onPress={() => setAction({ ...action, inputVisible: !action.inputVisible })}>
                    <Ionicons name={action.inputVisible ? "eye-off" : "eye"} color={rgba(colors.primary, 1)} size={20} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={globalStyles.primaryButton} onPress={() => submitHandler()}>
                  <Text style={globalStyles.primaryButtonText}>CONFIRIM</Text>
                </TouchableOpacity>
            </View>
          </View>

        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  imageBackground: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  container: {
    flex: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    height: 'fit-content',
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: colors.shadowGray,
    elevation: 10
  },
  imageContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15
  },
  image: {
    height: '100%',
    width: '100%',
    resizeMode: 'contain'
  },
  formContainer: {
    gap: 10
  }
})