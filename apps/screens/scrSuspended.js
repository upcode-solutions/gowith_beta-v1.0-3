//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//libraries
import { LinearGradient } from 'expo-linear-gradient';
//firebase
import { firestore } from '../providers/firebase'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
//react native components
import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View, Image, ImageBackground, Dimensions } from 'react-native'

export default function Suspended() {

    //context providers variables =====================================================================
    const { firestoreUserData, localData } = useControls();
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors, rgba);
    //local variables =================================================================================
    const [ loading, setLoading ] = useState(false);
    const { suspensionDate, suspensionDuration, suspensionReason, suspensionAmount } = firestoreUserData?.accountDetails;
    const { username } = firestoreUserData?.personalInformation;
    //functions =======================================================================================

    const contentHandler = () => (
        <Text>
            {`\t\t\tYour account with the username `}
            <Text style={[styles.contentText, { fontFamily: fonts.Righteous, color: colors.primary }]}>
                {username}
            </Text>{` has been suspended ${suspensionDuration ? `for ${suspensionDuration} days` : 'indefinitely'} due to `}
            <Text style={styles.highlight}>{suspensionReason}</Text>.
        </Text>
    );
    

    useEffect(() => {
        const checkSuspension = async () => {
            if (!suspensionDate || !suspensionDuration) { return; }
            const suspensionEndDate = new Date(suspensionDate);
            suspensionEndDate.setDate(suspensionEndDate.getDate() + parseInt(suspensionDuration, 10));
            const currentDate = new Date();

            if (currentDate > suspensionEndDate) { return } 
            else {
                const firestoreRef = doc(firestore, localData.userType, localData.uid);
                await updateDoc(firestoreRef, { 
                    'accountDetails.suspensionDate': '',
                    'accountDetails.suspensionDuration': '',
                    'accountDetails.suspensionReason': '',
                    'accountDetails.suspensionAmount': suspensionAmount + 1
                });
            }
        }

        const initiateSuspension = async () => {
            console.log('initiateSuspension');
        }

        checkSuspension();
        initiateSuspension();
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
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>SUSPENDED NOTICE</Text>
            </View>
            <View style={styles.imageContainer}>
                <Image style={styles.image} source={require('../assets/images/vectorSuspended.png')}/>
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.contentText, { fontFamily: fonts.Righteous}]}>{`Dear Valued Customer,`}</Text>
                <Text style={styles.contentText}>{contentHandler()}{`\n\nIf you have any questions or concerns, please don't hesitate to email us on gowith.philippines@gmail.com`}</Text>
                <Text style={[styles.contentText, { fontFamily: fonts.Righteous, color: colors.primary,}]}>{`Sincerely,\nThe GoWith Philippines Team`}</Text>
            </View>
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