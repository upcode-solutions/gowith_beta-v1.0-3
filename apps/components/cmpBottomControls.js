//context providers
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native components
import React, { useRef } from 'react'
import {Animated, Easing, PanResponder, StyleSheet, Text, TouchableOpacity, Switch, View } from 'react-native'

export default function BottomControls({ actions, setActions, bookingStatus, bookingPoints, bookingHandler, mapRef }) {

    //context variables
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    //references
    const animatedY = useRef(new Animated.Value(170)).current; // Start collapsed
    const animatedYClamped = animatedY.interpolate({ inputRange: [55, 160], outputRange: [160, 55], extrapolate: 'clamp', });

    
    //functions
    const panResponder = useRef(
      PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5, // Detect small drags
      onPanResponderGrant: () => { // On drag start
          animatedY.setOffset(animatedY.__getValue());
          animatedY.setValue(0);
      },

      onPanResponderMove: (_, gesture) => { animatedY.setValue(gesture.dy); },

      onPanResponderRelease: (_, gesture) => { // On drag end
          animatedY.flattenOffset();
          const shouldExpand = gesture.dy < -50 || gesture.vy < -0.5; 
          const finalValue = shouldExpand ? 160 : 55;
  
          Animated.timing(animatedY, { toValue: finalValue, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true, }).start();
      },
      })
    ).current;

  return (
    <View style={styles.bottomContainer}>
        
        <View style={styles.floatingContainerWrapper}>
          <Animated.View 
            style={[styles.floatingContainer, { transform: [{ translateY: animatedYClamped }] }]} 
            {...panResponder.panHandlers}
            >
            <View style={styles.directionContainer}>
              <Text style={globalStyles.priceContainerText}>Drag to expand</Text>
            </View>

            <TouchableOpacity 
              style={[styles.toggleButton, { opacity: bookingPoints[2].city === '' ? 0 : 1 }]}
              onPress={() => { mapRef.current?.animateToRegion({ longitude: bookingPoints[2].longitude, latitude: bookingPoints[2].latitude, latitudeDelta: 0.0001, longitudeDelta: 0.0001 }); }}
              disabled={bookingPoints[2].city === ''}
            >
              <Ionicons name="locate" size={22} color={colors.constantWhite} />
            </TouchableOpacity>
          </Animated.View>

        </View>

        <View style={globalStyles.bottomControls}>
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
            <TouchableOpacity 
                style={[globalStyles.primaryButton, { opacity: bookingStatus === 'pending' ? 0.5 : 1 }]} 
                onPress={() => bookingHandler()}
                disabled={bookingStatus === 'pending'}
            >
            <Text style={globalStyles.primaryButtonText}>{bookingStatus === 'active' || bookingStatus === 'onQueue' ? 'Cancel Ride' : 'Ride Now'}</Text>
            </TouchableOpacity>
        </View>
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  floatingContainerWrapper: {
    height: 185,
    position: 'absolute',
    top: -180,
    width: '100%',
    overflow: 'hidden', 
    alignSelf: 'center',
    zIndex: -1, 
    paddingHorizontal: 15,
  },
  floatingContainer: {
    flexDirection: 'row',
    height: 115,
    width: '100%',
    backgroundColor: colors.form,
    alignSelf: 'center',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: 'black',
    elevation: 10, 
    marginBottom: 10
  },
  directionContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'left',
    gap: 1.5
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