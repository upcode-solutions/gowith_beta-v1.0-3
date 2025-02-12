//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
import { textBeeConfig } from '../providers/keys';
//slider
import { RecoverySlider } from './pages/sliderRecovery';
//pages
import { OtpInput } from './pages/pagesSetup';
//libraries
import axios from 'axios';
//components
import BottomSheet from '../components/modalBottomSheet';
import FloatingView from '../components/modalFloatingView';
import Loading from '../components/cmpLoading';
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Text, TextInput, Image, ImageBackground, TouchableWithoutFeedback, TouchableOpacity, Keyboard, Dimensions, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';

export default function RecoveryCredentials() {

  //context providers
  const {showNotification} = useNotification();
  const {localControls, setLocalControls, setFirestoreUserData, setLocalData} = useControls();
  const {fonts, colors, rgba} = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local Variables =========================================
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', contactNumber: '', contactNumber: '', otp: '' });
  const [actionState, setActionState] = useState({ keyboardVisible: false, recoverViaEmail: true, contactNumberVerified: false, otpModal: false });
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  //references ==============================================
  const logoOpacityRef = useRef(new Animated.Value(1)).current;

  const errorHandler = (error) => { //handle error
    if (error) {
      showNotification(error, 'error', 5000);
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
        switch (true) {
            case credentials.contactNumber === '': throw new Error('Contact Number is required. Please try again.');
            case credentials.contactNumber.length < 10 || credentials.contactNumber.length > 11: throw new Error('Contact Number must be at least 10 digits long. Please try again.');
            case credentials.contactNumber[0] === '0': throw new Error('Contact Number cannot start with 0. Please try again.');
        }

        setLoading(true);

        let otp;
        do { otp = Math.floor(100000 + Math.random() * 900000).toString(); } 
        while (otp === credentials.otp);
        setGeneratedOtp(otp);
        setCredentials(prev => ({ ...prev, otp: '' }));

        const recepients = `+63${credentials.contactNumber}`;
        const { apiKey, deviceId } = textBeeConfig;
        const response = await axios.post(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
            recipients: [ recepients ],
            message: `Greeetings ${credentials.firstname},\n\nYour GOWITH verification code is ${otp}, please do not share with anyone.`,
        }, { headers: { 'x-api-key': apiKey,}, });
        console.log(response);
        if(response.data.data.successCount === 1) {
            setLoading(false);
            setActionState(prev => ({ ...prev, otpModal: true }));
            setLocalControls(prev => ({
                ...prev,
                cdTimestamp: new Date().getTime() / 1000
            }));
        }
        
    } catch (error) {
      errorHandler(error.message);
    }
  }

  const verifyOtp = () => { //verify otp
    if (credentials.otp === generatedOtp && generatedOtp.length > 0) { 
      setActionState(prev => ({ ...prev, otpModal: false, contactNumberVerified: true })); 
      showNotification('Contact number has been successfully verified.', 'success', 3000);
      setErrorMessage('');
      setLoading(false);
      //redirect
    }
    else {
      setLoading(false);
      errorHandler('Invalid OTP entered. Please check your SMS and try again.'); 
    }
  }

  const submitHandler = () => {
    console.log(credentials);
  }

  //useEffect =================================================
    
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(logoOpacityRef, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.ease }).start();
      setActionState((prev) => ({ ...prev, keyboardVisible: true }));
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(logoOpacityRef, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.ease }).start();
      setActionState((prev) => ({ ...prev, keyboardVisible: false }));
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [actionState.KeyboardVisible]);

  //render ====================================================
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={globalStyles.container}>
        <ImageBackground 
          source={require('../assets/images/scenery.png')}
          style={globalStyles.imageBackground}
          imageStyle={styles.imageBackground}
          resizeMode="cover"
        >

        <LinearGradient
          colors={[rgba(colors.primary, .75), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.secondary, .75)]}
          style={globalStyles.overlay}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0.75, y: 1.10 }}
          pointerEvents='none'
        />

        <Animated.Image source={require('../assets/images/logoLight.png')} style={[globalStyles.logo, { opacity: logoOpacityRef }]}/>

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
          onClose={() => setActionState((prev) => ({ ...prev, otpModal: false }))}
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

        <View style={styles.formContainer}>

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

            <TouchableOpacity style={globalStyles.primaryButton} onPress={() => submitHandler()}>
              <Text style={globalStyles.primaryButtonText}>{actionState.recoverViaEmail ? 'RECOVER VIA EMAIL' : 'RECOVER VIA SMS'}</Text>
            </TouchableOpacity>

            <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>
              <TouchableOpacity onPress={() => toggleAction()}>
                <Text style={styles.toggleButton}>{actionState.register ? 'Already have an account? Sign-in' : 'Don\'t have an account? Join'}</Text>
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