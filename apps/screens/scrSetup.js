//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
//components
import Loading from '../components/cmpLoading';
import FloatingView from '../components/modalFloatingView';
//sliders
import SetupSlider from './pages/sliderSetup'
//react native components
import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, Image, ImageBackground, View, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Dimensions, Animated, Easing } from 'react-native'

export default function Setup({ route }) {

    //temporary data ==========================================================================================================
    //context providers varables ==============================================================================================
    const { localControls } = useControls();
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    //local variables
    const [loading, setLoading] = useState(true);
    const [credentials, setCredentials] = useState({ firstname: '', lastname: '', username: '', dob: { date: '', month: '', year: '' }, weight: '', contactNumber: '', eulaAccepted: false });
    const [actionState, setActionState] = useState({ keyboardVisible: false, datePickerVisible: false, eulaVisible: false });
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const pagesCount = 2; 
    const [date, setDate] = useState(new Date());

    const hideDatePicker = () => {
        setActionState(prev => ({ ...prev, datePickerVisible: false }));
    };

    const handleConfirm = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setDate(currentDate);
        hideDatePicker();
    };

    const submitHandler = () => {
        if (currentPage < pagesCount - 1) {
            setCurrentPage(currentPage + 1);
        } else {
            console.log('clicked');
            //logic here
        }
    };

    //refenerences ============================================================================================================
    const logoOpacityRef = useRef(new Animated.Value(1)).current;

    //useEffects ==============================================================================================================
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setActionState(prev => ({ ...prev, keyboardVisible: true }));
        Animated.timing(logoOpacityRef, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease }).start();
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setActionState(prev => ({ ...prev, keyboardVisible: false }));
        Animated.timing(logoOpacityRef, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.ease }).start();
      })
      
      return () => { keyboardDidHideListener.remove(); keyboardDidShowListener.remove(); }
    },[])

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
            />

            <View style={[globalStyles.buttonContainer, styles.buttonContainer]}>

              <View style={styles.pageIndicator}>
                {Array.from({ length: pagesCount }).map((_, index) => (
                  <Ionicons
                    key={index}
                    name={index === currentPage ? 'ellipse' : 'ellipse-outline'}
                    size={12}
                    color={colors.constantWhite}
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
              value={date}
              mode='datetime'
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