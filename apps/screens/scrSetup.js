//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
import { textBeeConfig } from '../providers/keys';
//firebase
import { firestore } from '../providers/firebase'
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore'
//libraries
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
//components
import Loading from '../components/cmpLoading';
import FloatingView from '../components/modalFloatingView';
import BottomSheet from '../components/modalBottomSheet';
//sliders
import SetupSlider from './pages/sliderSetup'
import { OtpInput } from './pages/pagesSetup';
//react native components
import React, { useEffect, useState, useRef, use } from 'react'
import { StyleSheet, Text, Image, ImageBackground, View, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Dimensions, Animated, Easing } from 'react-native'
import { set } from 'firebase/database';

export default function Setup({ route, navigation }) {

    //context providers varables ==============================================================================================
    const { localControls, setLocalControls, setLocalData, setFirestoreUserData } = useControls();
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    const { showNotification } = useNotification();
    //local variables
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({ firstname: 'Rez', lastname: 'Angelo', username: 'Dominguez', dob: { date: '2', month: '7', year: '2002' }, weight: '86', contactNumber: '9562517907', otp: '' });
    const [actionState, setActionState] = useState({ keyboardVisible: false, datePickerVisible: false, eulaVisible: false, eulaAccepted: false, otpModal: false, contactNumberVerified: false });
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const pagesCount = 2;
    const [generatedOtp, setGeneratedOtp] = useState('');
    //refenerences ============================================================================================================
    const logoOpacityRef = useRef(new Animated.Value(1)).current;

    //functions ===============================================================================================================
    const errorHandler = (error) => { //handle error
      if (error) {
        showNotification(error, 'error', 5000);
        setErrorMessage(error);
        setLoading(false);
      }
    }

    const getDateFromDOB = () => { //get date from credentials and set if empty
        const { date, month, year } = credentials.dob;
        if (date === '' || month === '' || year === '') { return new Date(); } 
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(date));
    }

    const handleConfirm = (event, selectedDate) => { //handle date picker
        if (selectedDate) { 
          setCredentials(prev => ({ ...prev, dob: { 
            date: selectedDate.getDate(), 
            month: selectedDate.getMonth() + 1, 
            year: selectedDate.getFullYear() 
          }}));
        }
        setActionState(prev => ({ ...prev, datePickerVisible: false }));
    };

    const sendSMS = async () => { //verify contact number
        switch (true) {
          case credentials.contactNumber === '': showNotification('Contact Number is required. Please try again.', 'error', 3000); return;
          case credentials.contactNumber.length < 10 || credentials.contactNumber.length > 11: showNotification('Contact Number must be at least 10 digits long. Please try again.', 'error', 3000); return;
        }

        const userType = ['clients', 'riders']; //check clients and riders collection for the same number
        for (const type of userType) {
            const q = query(collection(firestore, type), where('personalInformation.contactNumber', '==', credentials.contactNumber));
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot.docs);
            
            if(!querySnapshot.empty) {
              showNotification('Contact Number already exists. Please try again.', 'error', 3000);
              setCredentials(prev => ({ ...prev, contactNumber: '' }));
              return;
            }
        }

        setLoading(true);
        let otp;
        do { otp = Math.floor(100000 + Math.random() * 900000).toString(); } 
        while (otp === credentials.otp);
        setGeneratedOtp(otp);
        setCredentials(prev => ({ ...prev, otp: '' }));

        const recepients = `+63${credentials.contactNumber}`;
        try {
          const { apiKey, deviceId } = textBeeConfig;
          const response = await axios.post(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
            recipients: [ recepients ],
            message: `Greeetings ${credentials.firstname},\n\nYour GOWITH verification code is ${otp}, please do not share with anyone.`,
          }, { headers: { 'x-api-key': apiKey,}, });
          if(response.data.data.successCount === 1) {
            setLoading(false);
            setActionState(prev => ({ ...prev, otpModal: true }));
            setLocalControls(prev => ({
                ...prev,
                cdTimestamp: new Date().getTime()
            }));
          }
        } catch (error) {
          console.warn(error);
          setLoading(false);
          showNotification('Failed to send verification code. Please try again.', 'error', 3000);
        }
    };

    const verifyOtp = () => { //verify otp
      if (credentials.otp === generatedOtp) {  
        setActionState(prev => ({ ...prev, otpModal: false, contactNumberVerified: true })); 
        showNotification('Contact number has been successfully verified.', 'success', 3000);
        setErrorMessage('');
      }
      else { errorHandler('Invalid OTP entered. Please check your SMS and try again.'); }
    };

    const submitHandler = async () => { //submit form
      if (currentPage < pagesCount - 1) { return setCurrentPage(currentPage + 1); }
      
      setErrorMessage('');
      setLoading(true);
        
      switch (true) {
        case credentials.firstname === '': return errorHandler('First name is required. Please enter your first name and try again.');
        case credentials.lastname === '': return errorHandler('Last name is required. Please enter your last name and try again.');
        case credentials.username === '': return errorHandler('Username is required. Please enter your username and try again.');
        case /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(credentials.username): return errorHandler('Username must not contain special characters. Please try again.');
        case credentials.username.length < 9: return errorHandler('Username must be at least 5 characters long. Please try again.');
        case credentials.contactNumber === '': return errorHandler('Contact Number is required. Please enter your contact number and try again.');
        case credentials.contactNumber.length < 10 || credentials.contactNumber.length > 11: return errorHandler('Contact Number must be at least 10 digits long. Please try again.');
        case credentials.dob.date === '' || credentials.dob.month === '' || credentials.dob.year === '': return errorHandler('Date of Birth is required. Please enter your date of birth and try again.');
        case credentials.dob.year > new Date().getFullYear(): return errorHandler('Date of Birth cannot be in the future. Please try again.');
        case credentials.dob.year - new Date().getFullYear() < 18 && credentials.dob.year < 1900: return errorHandler('Your age is inappropriate for GOWITH. Please try again.');
        case credentials.weight === '': return errorHandler('Weight is required. Please enter your weight and try again.');
        case credentials.weight < 0: return errorHandler('Weight cannot be negative. Please try again.');
        case credentials.weight > 250: return errorHandler('Aint no way you can be that heavy. You need a doctor. Please try again.');
        case actionState.eulaAccepted === false: return errorHandler('Please accept the End-User License Agreement.');
        case actionState.contactNumberVerified === false: return errorHandler('Please verify your contact number.');
      }

      try {
        const userType = ['clients', 'riders'];
        for( const type of userType ) { //check if user exists in firestore
          const userCollection = collection(firestore, type); //get user collection
          const userQuery = query(userCollection, where('personalInformation.username', '==', credentials.username)); //query user collection
          const userSnapshot = await getDocs(userQuery); //get user snapshot
          if (userSnapshot.docs.length > 0) { //if user exists
            errorHandler('Username already exists. Please try again.');
            setCurrentPage(0);
            return; 
          }
        }

        const { authLocalData } = route.params;
        const userRef = doc(firestore, authLocalData?.type, authLocalData?.uid);

        const firestoreUserData = {
          accountDetails: {
            userType: authLocalData?.type,
            accountUid: authLocalData?.uid,
            accountStatus: 'unverified',
            dateCreated: `${new Date().getMonth()}/${new Date().getDate()}/${new Date().getFullYear()}`,
            suspensionDate: ``,
            suspensionDuration: ``,
            suspensionReason: ``,
            suspensionAmount: 0,
            deviceId: Device.deviceName,
            flags: '',
          },
          personalInformation: {
            firstName: credentials.firstname,
            lastName: credentials.lastname,
            username: credentials.username,
            contactNumber: credentials.contactNumber,
            dateOfBirth: `${credentials.dob.month}/${credentials.dob.date}/${credentials.dob.year}`,
            weight: credentials.weight,
            email: authLocalData?.email,
          },
          emergencyContacts: {},
          bookingDetails: {},
          imageURL:{}
        };
        
        if (authLocalData.type === 'clients') { await setDoc(userRef, firestoreUserData); } //set user document
        else if (authLocalData.type === 'riders') { await updateDoc(userRef, firestoreUserData); }
        else { errorHandler('An error has occurred. Please try again.'); }

        setLocalData (prev => ({ ...prev, email: authLocalData?.email, uid: authLocalData?.uid, password: authLocalData?.password, userType: authLocalData?.type }));
        setFirestoreUserData(firestoreUserData);
        setLocalControls(prev => ({ ...prev, loggedIn: true }));
        setLoading(false);

      } catch (error) { 
        console.log(error); 
        errorHandler('An error has occurred. Please try again.'); 
      } //log error
    };

    //useEffects ==============================================================================================================
    useEffect(() => { //keyboard listeners
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setActionState(prev => ({ ...prev, keyboardVisible: true }));
        Animated.timing(logoOpacityRef, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease }).start();
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setActionState(prev => ({ ...prev, keyboardVisible: false }));
        Animated.timing(logoOpacityRef, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.ease  }).start();
      })
      
      return () => { keyboardDidHideListener.remove(); keyboardDidShowListener.remove(); }
    },[])

    useEffect(() => { //focus listener
      if(route.params) {
        const { authLocalData } = route.params;
        !authLocalData && navigation.navigate('AuthScreen');
      } else { navigation.navigate('AuthScreen'); }
    },[route.params]);

    //renders =================================================================================================================
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={globalStyles.container}>
        <ImageBackground
          source={require('../assets/images/scenery.png')}
          style={globalStyles.imageBackground}
          imageStyle={styles.imageBackground}
        >

          <FloatingView
            isVisible={loading}
            onClose={() => {}}
            height={Dimensions.get('screen').width * .5}
            width={Dimensions.get('screen').width * .5}
            backdropColor={colors.primary}
            backdropOpacity={0.4}
            children={ 
              <Loading 
                loadingBackgroundColor={colors.form} 
                loadingMessage={'Please wait...'} 
                ActivityIndicatorColor={localControls.darkMode ? colors.constantWhite : colors.primary}
                textColor={localControls.darkMode ? colors.constantWhite : colors.primary}
              /> 
            }
          />

          <BottomSheet
            isVisible={actionState.otpModal}
            onClose={() => { 
              setActionState(prev => ({ ...prev, otpModal: false }));
              setCredentials(prev => ({ ...prev, contactNumber: '', otp: '' }));
              setGeneratedOtp('');
              errorHandler('Failed to verify phone number. Please try again.');
            }}
            backgroundColor={colors.background}
          >
            <OtpInput
              credentials={credentials}
              setCredentials={setCredentials}
              setActionState={setActionState}
              sendSMS={sendSMS}
              verifyOtp={verifyOtp}
              errorMessage={errorMessage}
              localControls={localControls}
              setLocalControls={setLocalControls}  // Add this line
            />
          </BottomSheet>

          <LinearGradient
            colors={[rgba(colors.primary, .75), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.secondary, .75)]}
            style={globalStyles.overlay}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0.75, y: 1.10 }}
            pointerEvents='none'
          />

          <Animated.Image
            source={localControls.darkMode ? require('../assets/images/logoDark.png') : require('../assets/images/logoLight.png')}
            style={[globalStyles.logo, { opacity: logoOpacityRef }]}
            resizeMode="contain"
          />

          <View style={styles.formCotainer}>

            <SetupSlider
              credentials={credentials}
              setCredentials={setCredentials}
              errorMessage={errorMessage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              actionState={actionState}
              setActionState={setActionState}
              sendSMS={sendSMS}
              verifyOtp={verifyOtp}
              localControls={localControls}
              setLocalControls={setLocalControls}  // Add this line
            />

            <View style={styles.eulaContainer}>
              <View style={styles.eula}>
                <TouchableOpacity onPress={() => setActionState((prev) => ({ ...prev, eulaAccepted: !prev.eulaAccepted })) }>
                  <Ionicons name={actionState.eulaAccepted ? 'checkbox' : 'square-outline'} size={25} color={colors.constantWhite} />
                </TouchableOpacity>
                <View style={styles.horizontalContainer}>
                  <Text style={styles.eulaText}>I agree to the </Text>
                  <TouchableOpacity onPress={() => setActionState(prev => ({ ...prev, otpModal: !prev.otpModal }))}>
                    <Text style={[styles.eulaText, { color: colors.accent }]}>End-User License Agreement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>

              <View style={styles.pageIndicator}>
                {Array.from({ length: pagesCount }).map((_, index) => (
                  <Ionicons
                    key={index}
                    name={index === currentPage ? 'ellipse' : 'ellipse-outline'}
                    size={12}
                    color={index === currentPage ? colors.constantWhite : rgba(colors.constantWhite, .5)}
                  />
                ))}
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[globalStyles.secondaryButton, { opacity: currentPage <= 0 ? .5 : 1, flex: .50 }]}
                  onPress={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 0}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.constantWhite} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[globalStyles.primaryButton, {flex: 1}]}
                  onPress={() => submitHandler()}
                >
                  <Text style={globalStyles.primaryButtonText}>{ currentPage < pagesCount - 1 ? 'NEXT' : 'FINISH'}</Text>
                </TouchableOpacity>
              </View>

            </View>

          </View>

          {actionState.datePickerVisible && (
            <DateTimePicker
              value={getDateFromDOB()}
              mode="date"
              display="default"
              onChange={handleConfirm}
            />
          )}

        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  horizontalContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBackground: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  formCotainer: {
    position: 'absolute',
    bottom: '2.5%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15
  },
  eulaContainer: {
    flexDirection: 'row',
    height: 45,
    width: '100%',
    paddingHorizontal: 25,
  },
  eula: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: rgba(colors.shadowGray, .35),
    borderRadius: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 10
  },
  eulaText: {
    width: 'fit-content',
    fontFamily: fonts.RubikRegular,
    color: colors.constantWhite,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 25,
  },
  pageIndicator: {
    flex: .60,
    height: 45,
    backgroundColor: rgba(colors.shadowGray, .15),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5
  },
  buttons: {
    flex: 1,
    flexDirection: 'row',
    gap: 10
  }
})