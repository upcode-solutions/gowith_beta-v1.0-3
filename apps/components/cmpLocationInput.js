//context providers
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
//react native components
import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Dimensions, Text, TextInput, TouchableOpacity, Keyboard, View } from 'react-native'

export default function LocationInput({ setBookingPoints, bookingPoint, homeActions, setHomeActions, onFocus }) {

    //context variables
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    //local variables
    const count = onFocus === 'pickup' ? 0 : 1;
    const [location, setLocation] = useState([]);
    const [actions, setActions] = useState({ KeyboardVisible: false });
    //references
    const inputRef = useRef(null);
    
    //functions =============================================================================================
    const switchCurrentLocation = () => {
        const { latitude, longitude, geoName } = bookingPoint[3];
        
        setBookingPoints((prev) => {
            const newPoint = [...prev];
            newPoint[count] = { ...prev[count], latitude, longitude, geoName, };
            return newPoint;
        });
    }

    const fetchLocation = async () => {
        try {
            setHomeActions((prev) => ({ ...prev, fetchingLocation: true }));
            const coordinates = await Location.geocodeAsync(location.geoName)
            const { latitude, longitude } = coordinates[0];
            const city = await Location.reverseGeocodeAsync({ latitude, longitude }).then((res) => res[0].city);
            
            setBookingPoints((prev) => {
                const newPoint = [...prev];
                newPoint[count] = { ...newPoint[count], latitude, longitude, geoName: location.geoName, city: city };
                return newPoint;
            })

            setHomeActions((prev) => ({ ...prev, fetchingLocation: false }));
        } catch (e) { 
            console.log(e); 
            setHomeActions((prev) => ({ ...prev, fetchingLocation: false }));
        }
    }

    const confirmLocationInput = async () => {
        try {
            await fetchLocation(); // Ensure fetchLocation completes before proceeding
    
            setBookingPoints((prev) => {
                const newPoint = [...prev];
                newPoint[count] = { ...prev[count], geoName: location.geoName };
                return newPoint;
            });

            Keyboard.dismiss();
    
            setHomeActions((prev) => ({ ...prev, locationInputVisible: false }));
        } catch (e) {
            console.log(e);
        }
    }

    //useEffect =============================================================================================
    useEffect(() => {
        if (onFocus === 'pickup') { setLocation(bookingPoint[0]); } 
        else { setLocation(bookingPoint[1]); }
    }, [bookingPoint]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100); // Delay to ensure component is ready
    
        return () => clearTimeout(timeout); // Cleanup on unmount
    }, []);

    useEffect(() => {

        const timeout = setTimeout(() => { inputRef.current.focus(); }, 100);

        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => { setActions({ ...actions, KeyboardVisible: true }); })
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { setActions({ ...actions, KeyboardVisible: false }); })
        return () => { keyboardDidShowListener.remove(); keyboardDidHideListener.remove(); clearTimeout(timeout); };
    },[]);

    useEffect(() => {
        if (!actions.KeyboardVisible && location.geoName) { fetchLocation(); }
    }, [actions.KeyboardVisible, location.geoName]);

  return (
    <View style={styles.container}>
        <View style={globalStyles.textBox}>
            <TextInput
                ref={inputRef}
                style={[globalStyles.input, { flex: 1 }]}
                placeholder={`Enter your ${onFocus} point`}
                placeholderTextColor={rgba(colors.text, .5)}
                value={location.geoName}
                onChange={(e) => setLocation({ ...location, geoName: e.nativeEvent.text })}
                returnKeyType='done'
            />
            <TouchableOpacity onPress={() => setLocation((prev) => ({ ...prev, geoName: '' }))}>
                <Ionicons name="close" color={colors.primary} size={25} />
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.currentLocationContainer} onPress={() => switchCurrentLocation()}>
            <Ionicons name="location-outline" color={colors.primary} size={25} />
            <Text style={[globalStyles.input, { fontFamily: fonts.Righteous, color: colors.primary }]} numberOfLines={1}>{`Use Current Location: ${bookingPoint[3].geoName}`}</Text>
        </TouchableOpacity>
        <View style={styles.suggestionContainer} onPress={() => Keyboard.dismiss()}>

        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={globalStyles.primaryButton} 
                onPress={() => confirmLocationInput()}
                disabled={homeActions.fetchingLocation}
            >
                <Text style={globalStyles.primaryButtonText}>SELECT LOCATION</Text>
            </TouchableOpacity>
        </View>
    </View>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    container: {
        height: '100%',
        paddingBottom: 15,
        gap: 10
    },
    currentLocationContainer: {
        height: 45,
        width: '100%',
        backgroundColor: rgba(colors.secondary, .35),
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        gap: 10
    },
    suggestionContainer: {
        flex: 1,
        backgroundColor: colors.form,
        borderRadius: 12,
        width: '100%',
        paddingHorizontal: 25,
    },
    buttonContainer: {
        height: 45,
        width: '100%',
    }
})