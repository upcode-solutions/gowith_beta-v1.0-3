//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
import { useNotification } from '../providers/notification';
//components
import Loading from '../components/cmpLoading';
import FloatingView from '../components/modalFloatingView';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
//firebase
import { auth, firestore } from '../providers/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, signInWithEmailAndPassword } from "firebase/auth";
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, TextInput, View, Image, ImageBackground, TouchableWithoutFeedback, TouchableOpacity, Keyboard, Dimensions, Animated, Easing } from 'react-native'

export default function RecoveryAction({ route, navigation }) {

  //context provider variables ===============================================================================
  const { localControls, setLocalControls } = useControls()
  const { fonts, colors, rgba } = useThemes()
  const globalStyles = useGlobalStyles(fonts, colors, rgba)
  const styles = createStyles(fonts, colors, rgba)
  const { showNotification } = useNotification();
  //local variables =========================================================================================
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [credentials, setCredentials] = useState({ password: '', confirmPassword: '' }); 
  const [actionState, setActionState] = useState({ keyboardVisible: false, passwordVisible: false, confirmPasswordVisible: false, loadingModal: false });
  const [errorMessage, setErrorMessage] = useState('');
  //references ==============================================================================================
  const inputRef = useRef([]);
  const logoOpacityRef = useRef(new Animated.Value(1)).current;
  
  //functions ===============================================================================================
  const errorHandler = (message) => { //handle error and show notification
    console.log(message);
    setErrorMessage(message); // set error message
    showNotification(message, 'error', 5000);
    setActionState({ ...actionState, loadingModal: false });
  }

  const backgroundColorHandler = () => { //handle background color of input containe4r
    let bgPassword = colors.form;
    let bgConfirmPassword = colors.form;
    if (errorMessage) {
      const loweredErrorMessage = errorMessage.toLowerCase();
      if (loweredErrorMessage.includes('password')) { bgPassword = colors.errorRedText; }
      if (loweredErrorMessage.includes('match') || loweredErrorMessage.includes('used')) { bgConfirmPassword = colors.errorRedText; }
    }
    return [bgPassword, bgConfirmPassword];
  }
  const handleRecovery = async () => {
    setErrorMessage('');
    setActionState((prev) => ({ ...prev, loadingModal: true }));
    
    switch (true) {
      case credentials.password === '': errorHandler('Password is required. Please enter your password and try again.'); return;
      case credentials.password.length < 8 && credentials.password.length > 15: errorHandler('Password must be at least 8 characters long. Please try again.'); return;
      case /\s/.test(credentials.password) || /\s/.test(credentials.confirmPassword): errorHandler('Password cannot contain spaces. Please try again.'); return;
      case !credentials.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/): errorHandler('Password must have at least one lowercase, uppercase, number, and special character.'); return;
      case credentials.confirmPassword === '': errorHandler('Confirm Password is required. Please enter your password and try again.'); return;
      case credentials.confirmPassword !== credentials.password: errorHandler('Passwords do not match. Please try again.'); return;
    }

    
    try {
      const { accountUid, userType } = userData.accountDetails;
      const { email, password, oldPassword } = userData.personalInformation;
      console.log(accountUid, userType, email, password, oldPassword);

      for (const passwords of oldPassword) {
        console.log(passwords);
        let loweredPassword = passwords.toLowerCase();
        let loweredCredentialsPassword = credentials.password.toLowerCase();

        if (loweredCredentialsPassword.includes(loweredPassword) || loweredCredentialsPassword === loweredPassword) { throw new Error('Password has already been used. Please try again.'); }
      }
      
      let user = auth.currentUser;
      if (!user) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(userCredential.user);
        user = userCredential.user;
      }

      if(!user) { throw new Error('User does not exist. Please try again.'); }
      
      const userAuthCredentials = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, userAuthCredentials);

      await updatePassword(user, credentials.password);

      await updateDoc(doc(firestore, userType, accountUid), { 
        'accountDetails.passwordChangedDate': serverTimestamp(),
        'personalInformation.password': credentials.password,
        'personalInformation.oldPassword': [ ...oldPassword, password ]
      });

      showNotification('Password has been changed successfully.', 'success', 5000);

      setActionState((prev) => ({ ...prev, loadingModal: false }));
      setLocalControls((prev) => ({ ...prev, cdTimestamp: null }));
      navigation.navigate('AuthScreen');
    } catch (error) {
      setActionState((prev) => ({ ...prev, loadingModal: false }));
      console.warn("recoveryAction - handleRecovery: ", error.message);
      errorHandler(error.message);
    }
  }

  //useEffect ===============================================================================================
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(logoOpacityRef, { toValue: 0, duration: 300, easing: Easing.linear, useNativeDriver: true, }).start();
      setActionState({ ...actionState, keyboardVisible: true });
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(logoOpacityRef, { toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: true, }).start();
      setActionState({ ...actionState, keyboardVisible: false });
    });

    return () => { keyboardDidShowListener.remove(); keyboardDidHideListener.remove(); };
  })

  useEffect(() => {
    if(route.params) {
      const { firestoreUserData } = route.params;
      !firestoreUserData ? 
      navigation.navigate('RecoveryCredentials') : 
      setUserData(firestoreUserData);
      setLoading(false);
    }
  })

  //render ==================================================================================================
  if (loading) { 
    return (
      <Loading 
        loadingBackgroundColor={colors.primary}
        loadingMessage='Loading...'
        ActivityIndicatorColor={colors.constantWhite}
        textColor={colors.constantWhite}
      />
    )
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={globalStyles.container}>
        <ImageBackground
          style={[globalStyles.imageBackground]}
          imageStyle={styles.imageBackground}
          source={require('../assets/images/scenery.png')}
        >

          <LinearGradient
            colors={[rgba(colors.primary, .75), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.secondary, .75)]}
            style={globalStyles.overlay}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0.75, y: 1.10 }}
            pointerEvents='none'
          />

          <FloatingView
            isVisible={actionState.loadingModal}
            onClose={() => setActionState(prev => ({ ...prev, loadingModal: false }))}
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

          <Animated.Image 
            style={[globalStyles.logo, { opacity: logoOpacityRef }]}
            source={localControls.darkMode ? require('../assets/images/logoDark.png') : require('../assets/images/logoLight.png')}
          />
          
          <View style={[globalStyles.formContainer, styles.formContainer]}>
            <View style={globalStyles.headerContainer}>
              <Ionicons name="key" color={colors.constantWhite} size={25} />
              <Text style={globalStyles.headerText}>ENTER YOUR NEW PASSWORD</Text>
            </View>
            <View style={styles.inputContainer}>
              <View 
                style={[
                  globalStyles.textBox, styles.horizontalContainer,
                  { backgroundColor: backgroundColorHandler()[0] }
                ]}
              >
                <TextInput 
                  style={[globalStyles.input, { flex: 1 }]}
                  placeholder='New Password*'
                  placeholderTextColor={rgba(colors.text, .5)}
                  value={credentials.password}
                  onChangeText={(text) => setCredentials((prev) => ({ ...prev, password: text }))}
                  ref={(ref) => inputRef.current[0] = ref}
                  returnKeyType='next'
                  onSubmitEditing={() => inputRef.current[1].focus()}
                  secureTextEntry={!actionState.passwordVisible}
                  blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setActionState({ ...actionState, passwordVisible: !actionState.passwordVisible })}>
                  <Ionicons name={!actionState.passwordVisible ? "eye-off" : "eye"} color={colors.primary} size={20} />
                </TouchableOpacity>
              </View>
              <View 
                style={[
                  globalStyles.textBox, styles.horizontalContainer,
                  { backgroundColor: backgroundColorHandler()[1] }
                ]}
              >
                <TextInput 
                  style={[globalStyles.input, { flex: 1 }]}
                  placeholder='Confirm New Password*'
                  placeholderTextColor={rgba(colors.text, .5)}
                  secureTextEntry={!actionState.confirmPasswordVisible}
                  value={credentials.confirmPassword}
                  onChangeText={(text) => setCredentials((prev) => ({ ...prev, confirmPassword: text }))}
                  ref={(ref) => inputRef.current[1] = ref}
                  returnKeyType='done'
                  onSubmitEditing={() => inputRef.current[1].blur()}
                  blurOnSubmit
                />
                <TouchableOpacity onPress={() => setActionState({ ...actionState, confirmPasswordVisible: !actionState.confirmPasswordVisible })}>
                  <Ionicons name={!actionState.confirmPasswordVisible ? "eye-off" : "eye"} color={colors.primary} size={20} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>
              <TouchableOpacity style={globalStyles.primaryButton} onPress={() => handleRecovery()}>
                <Text style={globalStyles.primaryButtonText}>UPDATE PASSWORD</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  imageBackground: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  formContainer: {
    position: 'absolute',
    bottom: '2.5%',
    width: '100%',
    gap: 15,
    paddingHorizontal: 25
  },
  inputContainer: {
    gap: 10
  },
  buttonContainer: {
    gap: 10,
    width: '100%',
  },
})