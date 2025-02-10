//context providers
import { useNotification } from '../providers/notification';
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
import * as Device from 'expo-device';
//components
import Loading from '../components/cmpLoading';
import FloatingView from '../components/modalFloatingView';
//sliders
import AuthSlider from './pages/sliderAuth'
//firebase
import { auth, firestore } from '../providers/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
//react native components
import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, Image, ImageBackground, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Vibration, Dimensions, Animated, Easing } from 'react-native'

export default function Auth({ navigation }) {
 
  //context variables =======================================================================================
  const {showNotification} = useNotification();
  const {localControls, setLocalControls, setFirestoreUserData, setLocalData} = useControls();
  const {fonts, colors, rgba} = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables =========================================================================================
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState({ register: false, keyboardVisible: false, modalLoading: false });
  const [credentials, setCredentials] = useState({ usernameEmail: 'angelo722002@gmail.com', password: 'Angelo236!', confirmPassword: 'Angelo236!' });
  const [errorMessage, setErrorMessage] = useState('');
  //references ==============================================================================================
  const inputRef = useRef([]);
  const logoOpacityRef = useRef(new Animated.Value(1)).current;

  //functions ===============================================================================================
  const toggleAction = () => { //toggles between login and signup
    setErrorMessage(''); //reset error
    setActionState({ ...actionState, register: !actionState.register }) //toggle
  }

  const errorHandler = (message) => { //handle error and show notification
    setErrorMessage(message); // set error message
    showNotification(message, 'error', 5000); // show notification
  }

  const emailValidator = (email) => { //validates email
    const validDomains = [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, /^[a-zA-Z0-9._%+-]+@yahoo\.com$/, /^[a-zA-Z0-9._%+-]+@outlook\.com$/]; //trusted domains
    for (const domain of validDomains) { if (domain.test(email)) return true; } //check if email is valid
    return false;
  }

  const checkFirestore = async (userCredential) => { //checks if user exists in firestore
    //checking if user exists in firestore
    const uerType = ['clients', 'riders'];
    for (const type of uerType) { //loop through user types
      const userCollection = collection(firestore, type); //get user collection
      const userQuery = query(userCollection, where('accountDetails.accountUid', '==', userCredential.user.uid)); //query user collection
      const userSnapshot = await getDocs(userQuery); //get user snapshot
      if (userSnapshot.docs.length > 0) { //if user exists in firestore
        const user = userSnapshot.docs[0].data(); //get user data
        if (user?.personalInformation) { return { exist: true, type: type }; }
        else { return { exist: false, type: type }; }
      } 
    } 
    
    return { exist: false, type: 'clients' }; //if user does not exist
  }

  const setNecessaryData = async (uid, type, email, password) => { //sends necessary data to firestore
    try {
      const userCollection = collection(firestore, type);
      const userDoc = doc(userCollection, uid);
      const docSnapshot = await getDoc(userDoc);

      if (docSnapshot.exists()) { 
        await updateDoc(doc(firestore, type, uid), { accountDetails: { ...docSnapshot.data().accountDetails, deviceId: Device.deviceName } }); 
        setFirestoreUserData(docSnapshot.data());
        setLocalData((prev) => ({ ...prev, email: email, uid: uid, password: password, userType: type }));
        setLocalControls((prev) => ({ ...prev, loggedIn: true }));
      }

      setActionState((prev) => ({ ...prev, modalLoading: false }));
    } catch (e){ 
      setActionState((prev) => ({ ...prev, modalLoading: false }));
      console.warn("auth - setNecessaryData: ", e);
    }
  }

  const submitHandler = () => {
    setErrorMessage('');
    if (actionState.register) {
      switch (true) {
        case credentials.usernameEmail === '': errorHandler('Email is required. Please enter your email and try again.'); return;
        case credentials.password === '': errorHandler('Password is required. Please enter your password and try again.'); return;
        case credentials.confirmPassword === '': errorHandler('Confirm Password is required. Please enter your password and try again.'); return;
        case credentials.password !== credentials.confirmPassword: errorHandler('Passwords do not match. Please try again.'); return;
        case credentials.password.length < 8: errorHandler('Password must be at least 8 characters long. Please try again.'); return;
        case /\s/.test(credentials.password) || /\s/.test(credentials.confirmPassword): errorHandler('Password cannot contain spaces. Please try again.'); return;
        case !credentials.password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/): errorHandler('Password must have at least one lowercase, uppercase, number, and special character.'); return;
        case !emailValidator(credentials.usernameEmail): errorHandler('Domain is invalid. Email must be Gmail, Outlook, or Yahoo.'); return;
        default: break;
      }
    } else {
      switch (true) {
        case credentials.usernameEmail === '': errorHandler('Email is required. Please enter your email and try again.'); return;
        case credentials.password === '': errorHandler('Password is required. Please enter your password.'); return;
        case credentials.usernameEmail.includes('@') && !emailValidator(credentials.usernameEmail): errorHandler('Domain is invalid. Email must be Gmail, Outlook, or Yahoo.'); return;
        default: break;
      }
    }

    if (actionState.register) { signupHandler(); } 
    else { loginHandler(); }
  }

  const loginHandler = async () => {
    try {
      setActionState((prev) => ({ ...prev, modalLoading: true }));
      const loweredEmail = credentials.usernameEmail.toLowerCase(); // convert email to lowercase
      if (loweredEmail.includes('@')) {
        const response = await signInWithEmailAndPassword(auth, loweredEmail, credentials.password); // create auth account
        if (!response.user.emailVerified) { throw new Error('Email not verified. Please check your inbox and try again.'); }
        const {exist, type} = await checkFirestore(response); // check if user exists in firestore
        if (exist) { setNecessaryData(response.user.uid, type, loweredEmail, credentials.password); }
        else { 
          setActionState((prev) => ({ ...prev, modalLoading: false }));
          navigation.navigate('SetupScreen', { authLocalData: { email: loweredEmail, uid: response.user.uid, password: credentials.password, type: type }}); 
        }
      } else {
        let email = '';
        const userType = ['clients', 'riders'];
        for (const type of userType) { // loop through user types
          const userCollection = collection(firestore, type); // get user collection
          const userQuery = query(userCollection, where('personalInformation.username', '==', credentials.usernameEmail)); // query user collection
          const userSnapshot = await getDocs(userQuery); // get user snapshot
          if (userSnapshot.docs.length > 0) {  email = userSnapshot.docs[0].data().personalInformation.email;  break; }
        }
        if (email) {
          const response = await signInWithEmailAndPassword(auth, email, credentials.password); // create auth account
          if (!response.user.emailVerified) { throw new Error('Email not verified. Please check your inbox.'); }
          const {exist, type} = await checkFirestore(response); // check if user exists in firestore
          if (exist) { setNecessaryData(response.user.uid, type, email, credentials.password); }
        } else { throw new Error('Username does not exist. Please provide your email instead.'); }
      }
    } catch (error) {
      setActionState((prev) => ({ ...prev, modalLoading: false }));
      console.warn(`auth ${Device.deviceName} - loginHandler: `, error.message || error.code || error);
      if (error.code === 'auth/invalid-credential') { 
        errorHandler('Invalid credentials. Please ensure that your email and password are correct and try again.'); 
      } else { errorHandler(error.message || 'An error occurred during login. Please try again.'); }
    }
  }

  const signupHandler = async () => {
    try {
      setActionState((prev) => ({ ...prev, modalLoading: true }));
      const loweredEmail = credentials.usernameEmail.toLowerCase(); // convert email to lowercase
      const response = await createUserWithEmailAndPassword(auth, loweredEmail, credentials.password); // create auth account
      await sendEmailVerification(response.user); // send verification email
      setActionState((prev) => ({ ...prev, modalLoading: false, register: false }));
      showNotification('Verification email has been sent. Please check your inbox.', 'success', 3000);
    } catch (error) { 
      setActionState((prev) => ({ ...prev, modalLoading: false }));
      console.warn("auth - signupHandler: ", error.code); 
      if (error.code === 'auth/email-already-in-use') { errorHandler('Email already in use. Please provide a different email and try again.'); }
    }
  }

  //use effects
  useEffect(() => {
    setTimeout(() => { setLoading(false); }, 1000);

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(logoOpacityRef, { toValue: 0, duration: 200, useNativeDriver: true, easing: Easing.ease }).start();
      setActionState(prev => ({ ...prev, keyboardVisible: true }));
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(logoOpacityRef, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.ease }).start();
      setActionState(prev => ({ ...prev, keyboardVisible: false }));
    });

    return () => { keyboardDidShowListener.remove(); keyboardDidHideListener.remove(); };
  }, []);

  if (loading) { 
    return <Loading loadingBackgroundColor={colors.primary} loadingMessage={'Please wait...'} ActivityIndicatorColor={colors.form} textColor={colors.form} /> 
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={globalStyles.container}>
        <ImageBackground 
          source={require('../assets/images/scenery.png')}
          style={globalStyles.imageBackground}
          imageStyle={styles.imageBackground}
          resizeMode="cover"
        >

          <FloatingView
            isVisible={actionState.modalLoading}
            onClose={() => setActionState(prev => ({ ...prev, modalLoading: false }))}
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
            source={localControls.darkMode ? require('../assets/images/logoDark.png') : require('../assets/images/logoLight.png')}
            style={[globalStyles.logo, { opacity: logoOpacityRef }]}
            resizeMode="contain"
          />

          <LinearGradient
            colors={[rgba(colors.primary, .75), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.secondary, .75)]}
            style={globalStyles.overlay}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0.75, y: 1.10 }}
            pointerEvents='none'
          />

          <View style={styles.formCotainer}>

            <AuthSlider 
              actionState={actionState} 
              setActionState={setActionState} 
              credentials={credentials} 
              setCredentials={setCredentials} 
              errorMessage={errorMessage}
            />
            
            <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>
              <TouchableOpacity style={globalStyles.primaryButton} onPress={() => submitHandler()}>
                <Text style={globalStyles.primaryButtonText}>{actionState.register ? 'CREATE ACCOUNT' : 'LOGIN'}</Text>
              </TouchableOpacity>
              <View style={styles.optionsContainer}>
                <TouchableOpacity onPress={() => toggleAction()}>
                  <Text style={styles.toggleButton}>{actionState.register ? 'Already have an account? Sign-in' : 'Don\'t have an account? Join'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('RecoveryScreen')} disabled={actionState.register}>
                    <Text style={styles.toggleButton}>{!actionState.register ? 'Forgot Password?' : ' '}</Text>
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
  formCotainer: {
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