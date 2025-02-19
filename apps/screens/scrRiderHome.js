//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import Loading from '../components/cmpLoading';
import Mapview from '../components/cpmMapview';
//react-native hooks
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function RiderHome() {

  //contexts providers ===================================================
  const { localControls } = useControls();
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables ======================================================
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('inactive');
  const [bookingPoints, setBookingPoints] = useState([
    { longitude: '', latitude: '', geoName: '', type: '' },
    { longitude: '', latitude: '', geoName: '', type: '' },
  ]);
  const [route, setRoute] = useState([]);
  const [header, setHeader] = useState(0);
  const [tilt, setTilt] = useState(0);

  const [bookings, setBookings] = useState([]);
  const [client, setClient] = useState({});
  //references ===========================================================
  const mapRef = useRef(null);

  //functions ============================================================


  //useEffects ============================================================
  useEffect(() => {
    setTimeout(() => { setLoading(false); }, 5000);
  }, []);
  
  //render ================================================================
  if (loading) {
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
    <View style={{flex:1}}>
      
      <View style={styles.bottomControls}>
        <Text>Bottom Controls</Text>
      </View>

      <Mapview  
        
      />
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({

})