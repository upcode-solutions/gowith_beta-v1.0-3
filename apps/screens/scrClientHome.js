//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
//react native hooks
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function ClientHome() {

  //contexts providers ===================================================
  const { localControls } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables =======================================================
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('inactive');
  //references ============================================================

  //functions =============================================================

  //useEffects ============================================================
  useEffect(() => {
    setTimeout(() => { setLoading(false); }, 5000);
  }, []);

  //render ================================================================
  if (loading) { //loading screen
    return (
      <Loading 
        loadingBackgroundColor={colors.background} 
        loadingMessage={'Preparing Map...'} 
        ActivityIndicatorColor={colors.primary}
        textColor={colors.primary}
      />
    ); 
  }

  return (
    <View style={globalStyles.container}>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={globalStyles.primaryButton}>
          <Text style={globalStyles.primaryButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <Mapview />
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    height: 'fit-content',
    width: '100%',
    paddingHorizontal: 25,
    paddingVertical: 10,
    zIndex: 1,
  },
})