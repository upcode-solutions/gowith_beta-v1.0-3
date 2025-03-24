//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//keys
import { textBeeConfig } from '../providers/keys';
//libraries
import axios from 'axios';
//pages
import { OtpInput } from './pages/pagesSetup';
//slider
import { RecoverySlider } from './pages/sliderRecovery';
//components
import Loading from '../components/cmpLoading';
import BottomSheet from '../components/modalBottomSheet';
import FloatingView from '../components/modalFloatingView';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
//firbase
import { firestore, auth } from '../providers/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Text, TextInput, Image, ImageBackground, TouchableWithoutFeedback, TouchableOpacity, Keyboard, Dimensions, Animated, Easing } from 'react-native'

export default function RecoveryCredentials({ navigation }) {

  //context providers
  const {showNotification} = useNotification();
  const {localControls, setLocalControls, setFirestoreUserData, setLocalData} = useControls();
  const {fonts, colors, rgba} = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local Variables =========================================
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', username: '', contactNumber: '', firestoreUserData: {} });
  const [actionState, setActionState] = useState({ keyboardVisible: false, recoverViaEmail: true, contactNumberVerified: false, otpModal: false });
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [cdTime, setCdTime ] = useState(0);
  //references ==============================================
  const imageOpacityRef = useRef(new Animated.Value(1)).current;

  //functions ================================================
  const errorHandler = (error) => { //handle error
    if (error) {
      showNotification(error, 'error', 10000);
      setErrorMessage(error);
      setLoading(false);
    }
  }

  const toggleAction = () => { //toggles between login and signup
    setErrorMessage(''); //reset error
    setActionState({ ...actionState, recoverViaEmail: !actionState.recoverViaEmail }) //toggle
  }
    
  const sendSMS = async () => { //verify contact number
    try {
      let userExist = false;
      const userType = ['clients', 'riders'];
      for (const type of userType) {
        const q = query(collection(firestore, type), where('personalInformation.contactNumber', '==', credentials.contactNumber));
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty) { 
          userExist = true; 
          setCredentials(prev => ({ ...prev, firestoreUserData: querySnapshot.docs[0].data() }));
          break;
        }
      }

      if (userExist) {
        let otp
        do { otp = Math.floor(100000 + Math.random() * 900000).toString(); }
        while (otp === credentials.otp);
        setCredentials(prev => ({ ...prev, otp: '' }));
        
        const recepients = `+63${credentials.contactNumber}`;
        const { apiKey, deviceId } = textBeeConfig;
        const response = await axios.post(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
          recipients: [ recepients ],
          message: `Greeetings ${credentials.firstname},\n\nYour GOWITH verification code is ${otp}, please do not share with anyone.`,
        }, { headers: { 'x-api-key': apiKey,}, });
        if(response.data.data.successCount === 1){
          setLoading(false);
          setLocalControls(prev => ({ ...prev, cdTimestamp: new Date().getTime() / 1000 }));
          showNotification('SMS has been sent. Please check your inbox.', 'success', 5000);
          setGeneratedOtp(otp);
        }
      } else { throw new Error('Contact Number does not exist. Please try again.'); }

    } catch (error) { 
      errorHandler(error.message);
      setLoading(false);
    }
  }

  const verifyOtp = () => { //verify otp
    if (credentials.otp === generatedOtp && generatedOtp.length > 0) { 
      setLoading(false);
      setActionState(prev => ({ ...prev, otpModal: false, contactNumberVerified: true }));
      setErrorMessage('');
      showNotification('Contact number has been successfully verified.', 'success', 5000);
    } else {
      setLoading(false);
      errorHandler('Invalid OTP code entered. Please check your SMS and try again.');
    }
  }

  const emailValidator = (email) => { //validates email
    const validDomains = [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, /^[a-zA-Z0-9._%+-]+@yahoo\.com$/, /^[a-zA-Z0-9._%+-]+@outlook\.com$/]; //trusted domains
    for (const domain of validDomains) { if (domain.test(email)) return true; } //check if email is valid
    return false;
  }

  const submitHandler = async() => {

    setErrorMessage('');

    if (actionState.recoverViaEmail) {
      
      switch (true) {
        case credentials.email === '': errorHandler('Email is required. Please enter your email and try again.'); return;
        case credentials.username === '': errorHandler('Username is required. Please enter your username and try again.'); return;
        case !emailValidator(credentials.email): errorHandler('Domain is invalid. Email must be Gmail, Outlook, or Yahoo.'); return;
      }

      const userType = ['clients', 'riders'];
      const loweredEmail = credentials.email.toLowerCase(); // convert email to lowercase
      for (const type of userType) { //loop through user types
        const userCollection = collection(firestore, type); //get user collection
        const userQuery = query(userCollection, where('personalInformation.email', '==', loweredEmail), where('personalInformation.username', '==', credentials.username)); //query user collection
        const userSnapshot = await getDocs(userQuery); //get user snapshot
        if (userSnapshot.docs.length > 0) { //if user exists in firestore
          await sendPasswordResetEmail(auth, loweredEmail); //send password reset email
          setLoading(false);
          setLocalControls(prev => ({ ...prev, cdTimestamp: new Date().getTime() / 1000 }));
          setCredentials(prev => ({ ...prev, email: '', username: '' }));
          showNotification('Password reset email has been sent. Please check your inbox.', 'success', 5000);
          navigation.navigate('AuthScreen');
          return;
        }
      }

      errorHandler('Username or email does not exist. Please check your credentials and try again.');
    }
    else if (!actionState.recoverViaEmail) {
      switch(true){
        case credentials.contactNumber === '': errorHandler('Contact number is required. Please enter your contact number and try again.'); return;
        case !actionState.contactNumberVerified: errorHandler('Please verify your contact number.'); return;
        case Object.keys(credentials.firestoreUserData).length === 0: errorHandler('Username or contact number does not exist. Please check your credentials and try again.'); return;
      }

      navigation.navigate('RecoveryAction', { firestoreUserData: credentials.firestoreUserData });
    }
  }

  //useEffect
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => { 
      Animated.timing(imageOpacityRef, { toValue: 0, duration: 300, easing: Easing.linear, useNativeDriver: true, }).start();
      setActionState(prev => ({ ...prev, keyboardVisible: true })) 
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { 
      Animated.timing(imageOpacityRef, { toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: true, }).start();
      setActionState(prev => ({ ...prev, keyboardVisible: false })) 
    });
    return () => { keyboardDidShowListener.remove(); keyboardDidHideListener.remove(); }
  }, []);


  useEffect(() => {
    if (!localControls.cdTimestamp) return;

    const calculateRemainingTime = () => {
      const currentTime = new Date().getTime();
      const cdTimeStart = localControls.cdTimestamp * 1000;
      const cdDuration = 1.5 * 60 * 1000;
      const remainingTime = cdTimeStart + cdDuration;
      if (remainingTime < currentTime || actionState.contactNumberVerified) {
        setCdTime(0);
        setLocalControls(prev => ({ ...prev, cdTimestamp: null }));
      } else { setCdTime(Math.ceil((remainingTime - currentTime) / 1000)); }
    };

    calculateRemainingTime();
    const interval = setInterval(() => { calculateRemainingTime(); }, 1000);
    return () => { clearInterval(interval); }

  }, [localControls.cdTimestamp]);

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={globalStyles.container}>
        <ImageBackground 
          source={require('../assets/images/scenery.png')}
          style={globalStyles.imageBackground}
          imageStyle={styles.imageBackground}
          resizeMode="cover"
        >

        <Animated.Image
          style={[globalStyles.logo, { opacity: imageOpacityRef }]}
          source={ localControls.darkMode ? require('../assets/images/logoDark.png') : require('../assets/images/logoLight.png') }
        />

        <LinearGradient
          colors={[rgba(colors.primary, .75), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.secondary, .75)]}
          style={globalStyles.overlay}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0.75, y: 1.10 }}
          pointerEvents='none'
        />

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
          onClose={() => setActionState({ ...actionState, otpModal: false })}
          backgroundColor={colors.background}
        >
          <OtpInput
            credentials={credentials}
            setCredentials={setCredentials}
            actionState={actionState}
            errorMessage={errorMessage}
            sendSMS={sendSMS}
            verifyOtp={verifyOtp}
            localControls={localControls}
            setLocalControls={setLocalControls}
            setLoading={setLoading}
            generatedOtp={generatedOtp}
          />
        </BottomSheet>

        <View style={[styles.formContainer]}>

          <RecoverySlider
            credentials={credentials}
            setCredentials={setCredentials}
            errorMessage={errorMessage}
            actionState={actionState}
            setActionState={setActionState}
            sendSMS={sendSMS}
            verifyOtp={verifyOtp}
          />

          <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>

            <TouchableOpacity style={[globalStyles.primaryButton, { opacity: cdTime > 0 && actionState.recoverViaEmail ? .5 : 1 }]} onPress={() => submitHandler()} disabled={cdTime > 0 && actionState.recoverViaEmail}>
              <Text style={globalStyles.primaryButtonText}>{actionState.recoverViaEmail ? `RECOVER VIA EMAIL ${cdTime > 0 ? `(${cdTime}s)` : ''}` : 'RECOVER VIA SMS'}</Text>
            </TouchableOpacity>

            <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>
              <TouchableOpacity onPress={() => toggleAction()}>
                <Text style={styles.toggleButton}>{actionState.recoverViaEmail ? 'Doesn\'t have access to email? Use SMS' : 'Have access to email? Use Email'}</Text>
              </TouchableOpacity>
            </View>

          </View>

        </View>

        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  imageBackground: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  formContainer: {
    position: 'absolute',
    bottom: '2.5%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15
  },
  buttonContainer: {
    gap: 10,
    width: '100%',
    paddingHorizontal: 25,
  },
  toggleButton: {
    fontFamily: fonts.RubikRegular,
    color: colors.constantWhite,
    fontSize: 15,
  },
  optionsContainer: {
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
})