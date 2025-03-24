//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import Loading from '../components/cmpLoading';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
//firebase
import { firestore } from '../providers/firebase'
import { doc, updateDoc } from 'firebase/firestore'
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View, Image, ImageBackground, Dimensions } from 'react-native'

export default function Suspended() {

    //context providers variables =====================================================================
    const { firestoreUserData, localData } = useControls();
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    const { suspensionDuration, suspensionReason, suspensionAmount } = firestoreUserData?.accountDetails;
    const { username } = firestoreUserData?.personalInformation;
    //local variables =================================================================================
    const [ loading, setLoading ] = useState(false);
    const [ daysLeft, setDaysLeft ] = useState(null);
    //functions =======================================================================================

    const contentHandler = () => (
        <Text>
            {`\t\t\tYour account with the username `}
            <Text style={[styles.contentText, { fontFamily: fonts.Righteous, color: colors.primary }]}>
                '{username}'
            </Text>
            {` has been suspended ${suspensionDuration ? `for ${suspensionDuration} days` : 'indefinitely'} due to `}
            <Text style={styles.highlight}>{suspensionReason}</Text>.
            {`The suspension `}
            <Text style={[styles.contentText, { fontFamily: fonts.Righteous, color: colors.primary }]}>{`${daysLeft ? `will be lifted on ${daysLeft}` : 'will not be lifted'}`}</Text>.
        </Text>
    );
    

    useEffect(() => {
        const checkSuspension = async () => {
            try {
                if (Object.keys(firestoreUserData.accountDetails.suspensionDate).length > 0) {
                    const { nanoseconds, seconds } = firestoreUserData.accountDetails.suspensionDate;
                    const suspensionDate = seconds * 1000 + Math.round(nanoseconds / 1e6); // Milliseconds
                    const durationOfSuspension = parseInt(suspensionDuration, 10) * 86400000; // Milliseconds
        
                    if(!suspensionDuration) { return; }

                    const currentDate = Date.now(); // Current timestamp in milliseconds
                    const combinedSuspensionDate = suspensionDate + durationOfSuspension;
                    console.log(durationOfSuspension);
                    
        
                    if (currentDate < combinedSuspensionDate) {
                        //console.log('Suspension active');
                        const daysLeft = new Date(combinedSuspensionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }); // Correct date
                        setDaysLeft(daysLeft);
                    } else {
                        setLoading(true);
                        //console.log('Suspension lifted');
                        const userDocRef = doc(firestore, localData.userType, localData.uid);
                        await updateDoc(userDocRef, { 
                            'accountDetails.suspensionDate': '', 
                            'accountDetails.suspensionDuration': ``, 
                            'accountDetails.suspensionReason': '', 
                            'accountDetails.suspensionAmount': (suspensionAmount || 0) + 1
                        });
                    }
                }
            } catch (error) { console.error('Error updating Firestore:', error); }
        };

        checkSuspension();
    },[firestoreUserData])

  return (
    <ImageBackground
        style={styles.imageBackground}
        source={require('../assets/images/scenery.png')}
        resizeMode="cover"
    >
        <LinearGradient
            colors={[rgba(colors.primary, .75), rgba(colors.primary, .25), rgba(colors.secondary, .65), rgba(colors.secondary, .75)]}
            style={globalStyles.overlay}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0.75, y: 1.10 }}
            pointerEvents='none'
        />

        <View style={styles.container}>
            { loading 
                ? <Loading ActivityIndicatorColor={colors.primary} textColor={colors.primary} />
                : <>
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>SUSPENDED NOTICE</Text>
                    </View>
                    <View style={styles.imageContainer}>
                        <Image style={styles.image} source={require('../assets/images/vectorSuspended.png')}/>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={[styles.contentText, { fontFamily: fonts.Righteous}]}>{`Dear Valued User,`}</Text>
                        <Text style={styles.contentText}>{contentHandler()}{`\n\nIf you have any questions or concerns, please don't hesitate to email us on gowith.philippines@gmail.com`}</Text>
                        <Text style={[styles.contentText, { fontFamily: fonts.Righteous, color: colors.primary,}]}>{`Sincerely,\nThe GoWith Philippines Team`}</Text>
                    </View>
                </>
            }
        </View>
    </ImageBackground>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({
    imageBackground: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        paddingHorizontal: 25,
        paddingVertical: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        height: 'fit-content',
        width: '100%',
        backgroundColor: colors.background,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: colors.shadowColor,
        elevation: 5,
        gap: 15
    },
    headerContainer: {
        height: 'fit-content',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 25,
    },
    headerText: {
        fontFamily: fonts.Righteous,
        fontSize: 25,
        fontWeight: 500,
        color: colors.primary
    },
    imageContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25
    },
    image: {
        width: '50%',
        height: '100%',
        resizeMode: 'contain'
    },
    contentContainer: {
        height: 'fit-content',
        backgroundColor: rgba(colors.secondary, .25),
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingVertical: 30,
        gap: 25
    },
    contentText: {
        fontFamily: fonts.RubikRegular,
        fontSize: 15,
        color: colors.text,
        //textAlign: 'justify'
    },
    highlight: {
        fontFamily: fonts.Righteous,
        color: colors.primary,
        backgroundColor: rgba(colors.accent, .25),
    }
})