//packages
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
//firebase
import { auth, firestore, realtime } from './firebase';
import { getDoc, doc, onSnapshot, collection, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { remove, ref, get } from 'firebase/database';
//react native packages
import * as Location from 'expo-location';
//react native components
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Image, Alert, StyleSheet, Animated, Linking, ToastAndroid } from 'react-native';

const ControlsContext = createContext();

const ControlsProvider = ({ children }) => {
    //important controls
    const [localControls, setLocalControls] = useState({ darkMode: false, endSession: false, loggedIn: false, cdTimestamp: null });
    const [listener, setListener] = useState({ firestore: false });
    const [localData, setLocalData] = useState({});
    const [firestoreUserData, setFirestoreUserData] = useState({});
    const [firestoreTransactionFee, setFirestoreTransactionFee] = useState({});
    //assuring states
    const [loading, setLoading] = useState(true);
    const [isReady, setIsReady] = useState({ fetchedData: false, fetchedTransactionFee: false });
    //references
    const progress = useRef(new Animated.Value(0)).current;

    const initiateLogoutHandler = async (endSession) => { //log out handler function
        console.log("initiateLogoutHandler");
        //setLocalControls((prev) => ({ ...prev, endSession: endSession }));
        signOut(auth);
        setFirestoreUserData({});
        setLocalData({});
        setLocalControls((prev) => ({ ...prev, loggedIn: false, endSession: endSession, cdTimestamp: null }));
        //add remove logic
    }

    useEffect(() => { //fetch control and local data from AsyncStorage on app load
        const fetchStashedData = async () => { //fetch stashed data { localControls and localData }
            try {
                const [stashedLocalControls, stashedLocalData] = await Promise.all([
                    AsyncStorage.getItem('localControls'),
                    AsyncStorage.getItem('userData')
                ])
                if (stashedLocalControls) { setLocalControls(JSON.parse(stashedLocalControls)); }
                else { AsyncStorage.setItem('localControls', JSON.stringify(localControls)); }
                if (stashedLocalData) { setLocalData(JSON.parse(stashedLocalData)); }
                else { AsyncStorage.setItem('userData', JSON.stringify(localData)); }
                setIsReady((prev) => ({ ...prev, fetchedData: true }));
            } catch (error) { console.warn("controls - fetchStashedData", error); }
        }

        const firestoreControlsRef = doc(firestore, "controls", "pricing");
        const transactionFeeListener = onSnapshot(firestoreControlsRef, (doc) => {
            setFirestoreTransactionFee(doc.data());
            setIsReady((prev) => ({ ...prev, fetchedTransactionFee: true }));
        }, (error) => { console.warn("controls - transactionFeeListener", error); });

        fetchStashedData();
        return () => { transactionFeeListener(); }
    }, []);

    useEffect(() => { //listen to user data in firestore
        if (localData?.userType && localData?.uid) { 

            const firestoreUserDataUnsubscribe = onSnapshot(doc(collection(firestore, localData?.userType), localData?.uid), (doc) => {
                if (doc.exists()) {
                    if (doc.data().accountDetails.deviceId !== Device.deviceName) { initiateLogoutHandler(true); }
                    setFirestoreUserData(doc.data());
                }               
            }, (error) => { console.warn("controls - firestoreUserDataUnsubscribe", error); });

            return () => { firestoreUserDataUnsubscribe(); }
        }
    }, [listener, localData]);

    useEffect(() => { // Save localControls and user data
        const saveDataToAsyncStorage = async (key, data) => { //all in one saveData function
            try { await AsyncStorage.setItem(key, JSON.stringify(data)); // save data
            } catch (e) { console.error(`Error saving ${key}:`, e);  } // log error
        };
        saveDataToAsyncStorage('localControls', localControls); // save localControls every time it updates
        if (Object.keys(localData).length > 0) { saveDataToAsyncStorage('userData', localData); } // save userData if it exists
    }, [localControls, localData]);

    useEffect(() => { //update firestore account details and initiate listeners
        if(isReady.fetchedData && isReady.fetchedTransactionFee) { 
            const updateFirestoreUserData = async () => {
                try {
                    if(localData?.userType && localData?.uid) {
                        
                        const docSnap = await getDoc(doc(collection(firestore, localData?.userType), localData?.uid));
                        if (docSnap.exists()) {
                            await signInWithEmailAndPassword(auth, localData.email, localData.password);
                            await updateDoc(doc(firestore, localData.userType, localData.uid), { accountDetails: { ...docSnap.data().accountDetails, deviceId: Device.deviceName } });
                            console.log("updated firestore account details");
                            setListener((prev) => ({ ...prev, firestore: true }));
                        }
                    }
                } 
                catch (error) { console.warn("controls - updateFirestoreUserData", error); } 
                finally { 
                    const requestForegroundPermissions = async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted'; //ASK FOR LOCATION PERMISSION
                    if (!await requestForegroundPermissions()) { 
                        Linking.openSettings(); //OPEN LOCATION SETTINGS
                        ToastAndroid.show('Location permission is required to use this app', ToastAndroid.LONG);
                        return;
                    }
                    setLoading(false);
                }
            }

            updateFirestoreUserData();
        }
    }, [isReady]);

    useEffect(() => {
        const currentProgress = calculateProgress();
        Animated.timing(progress, {
            toValue: currentProgress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [localControls, localData, firestoreUserData, firestoreTransactionFee, isReady]);
    
    const calculateProgress = () => {
        let progress = 0;
        if ( Object.keys(localData).length > 0 ) {
            if ( firestoreUserData ) { progress += 0.25; }
            if ( firestoreTransactionFee ) { progress += 0.25; }
            if ( Object.keys(localControls).length > 0 ) { progress += 0.25; }
            if ( Object.keys(localData).length > 0 ) { progress += 0.25; }
        } else {
            if ( firestoreTransactionFee ) { progress += 0.5; }
            if ( Object.keys(localControls).length > 0 ) { progress += 0.5; }
        }
        return progress;
    };
    
    if (loading) {
        return (
            <View style={styles.container}>
                <Image style={styles.logo} source={require('../assets/images/logoLight.png')} />
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, { 
                        width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) 
                    }]} />
                </View>
            </View>
        );
    }

    return (
        <ControlsContext.Provider 
            value={{ 
                localControls, setLocalControls, 
                listener, setListener, 
                localData, setLocalData, 
                firestoreUserData, setFirestoreUserData, 
                firestoreTransactionFee, setFirestoreTransactionFee, 
                initiateLogoutHandler,  }} 
        >
            {children}
        </ControlsContext.Provider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(49, 23, 135)',
        gap: 15
    },
    logo: {
        width: '50%',
        height: 50,
        resizeMode: 'contain',
    },
    progressBarContainer: {
        width: '25%',
        height: '.5%',
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3b5998',
    },
});

export const useControls = () => useContext(ControlsContext);
export default ControlsProvider;
