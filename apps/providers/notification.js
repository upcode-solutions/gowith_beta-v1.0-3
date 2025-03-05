//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
//libraries
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
//react native components
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, SafeAreaView, Vibration } from 'react-native';

const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {

  //context providers ======================================================================================
  const { localControls, setLocalControls } = useControls();
  const { colors, fonts } = useThemes();
  const styles = createStyles (fonts, colors);
  //local variables ========================================================================================
  const [notification, setNotification] = useState(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  //functions ===============================================================================================
  const getNotificationContent = (type) => {
    switch (type) {
      case 'success': return { lottie: require('../assets/lottie/checkmark.json'), }
      case 'error': return { lottie: require('../assets/lottie/error.json'), }
      case 'notify': default: return { lottie: require('../assets/lottie/notify.json'), } 
    }
  };

  const showNotification = (message, type = 'nofication', duration = 5000) => {

    setNotification({ message, type });
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true, }).start();

    setTimeout(() => { 
      Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true, })
      .start(() => setNotification(null)); 
    }, duration);
  };

  //useEffect ==============================================================================================

  useEffect(() => { //play notification sound and vibrate
    const physicaFeatureHandler = async () => {
      const errorPattern = [100, 250, 100, 250];
      const notificationPattern = [100, 500];
      
      try {
        if (notification) {
          let sound;
          switch(notification.type) {
            case 'success':
              sound = new Audio.Sound();
              await sound.loadAsync(require('../assets/sounds/notification.mp3'));
              await sound.playAsync();
              break;
            case 'notification':
              sound = new Audio.Sound();
              await sound.loadAsync(require('../assets/sounds/notification.mp3'));
              Vibration.vibrate(notificationPattern);
              await sound.playAsync();
              break;
            case 'error':
              sound = new Audio.Sound();
              await sound.loadAsync(require('../assets/sounds/error.mp3'));
              Vibration.vibrate(errorPattern);
              await sound.playAsync();
              break;
            default:
              break;
          }

          // Cleanup function for sound
          return () => { if (sound) { sound.unloadAsync(); } };
        }
      } catch (error) { console.log('Error playing sound:', error); }
    };

    physicaFeatureHandler();
  }, [notification]);

  useEffect(() => {
    if (localControls.endSession) {
      showNotification('Your account has been logged in from another device.', 'notification', 5000);
      Vibration.vibrate([1000, 100, 1000]);
      setTimeout(() => { setLocalControls((prev) => ({ ...prev, endSession: false })); }, 10000);
    } 
  }, [localControls.endSession]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <SafeAreaView style={styles.container} pointerEvents="box-none">
          <Animated.View style={[ 
            styles.notification,
              { transform: [{ translateY: slideAnim }] },
              { backgroundColor: colors.form },
            ]}
          >
            <LottieView
              source={getNotificationContent(notification.type).lottie}
              autoPlay
              loop={false}
              style={{ width: 45, height: 45 }}
            />
            <Text style={styles.text}>
              {notification.message}
            </Text>
          </Animated.View>
        </SafeAreaView>
      )}
    </NotificationContext.Provider>
  );
};

const createStyles = (fonts, colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
    paddingHorizontal: 25,
  },
  notification: {
    flexDirection: 'row',
    position: 'absolute',
    top: 25,
    minHeight: 50,
    height: 'fit-content',
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 12,
    elevation: 5,
    shadowColor: colors.shadowColor,
    elevation: 5,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 15,
    gap: 12,
    overflow: 'hidden',
  },
  text: {
    flex: 1,
    fontFamily: fonts.RubikRegular,
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});

export const useNotification = () => useContext(NotificationContext);
export default NotificationProvider;
