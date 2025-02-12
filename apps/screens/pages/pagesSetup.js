//context providers
import { useControls } from '../../providers/controls';
import { useThemes } from '../../providers/themes';
import { useGlobalStyles } from '../../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native components
import React, { useState, useRef, useEffect, act } from 'react'
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native'

const personalInformation = ({ credentials, setCredentials, errorMessage }) => {

    //context providers varables ===============================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    //refenernces ==============================================================
    const inputRef = useRef([]);

    //functions ================================================================
    const textBoxBackgroundHandler = () => {
        let bgFirstName = colors.form;
        let bgLastName = colors.form;
        let bgUsername = colors.form;

        if (errorMessage) {
            const loweredErrorMessage = errorMessage.toLowerCase();
            if (loweredErrorMessage.includes('first')) { bgFirstName = colors.errorRedText; }
            if (loweredErrorMessage.includes('last')) { bgLastName = colors.errorRedText; }
            if (loweredErrorMessage.includes('username')) { bgUsername = colors.errorRedText; }
        }

        return [bgFirstName, bgLastName, bgUsername];
    }

    //return ==============================================================
    return (
        <View style={globalStyles.formContainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>PERSONAL INFORMATION</Text>
            </View>
            <View style={styles.horizontalContainer}>
                <View style={[
                    globalStyles.textBox,
                    { backgroundColor: textBoxBackgroundHandler()[0] },
                    { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                ]}>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="First Name*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.firstname}
                        onChangeText={(text) => setCredentials({ ...credentials, firstname: text })}
                        ref={(input) => { inputRef.current[0] = input; }}
                        onSubmitEditing={() => { inputRef.current[1].focus(); }}
                        returnKeyType='next'
                        blurOnSubmit={false}
                    />
                </View>
                <View style={[
                    globalStyles.textBox,
                    { backgroundColor: textBoxBackgroundHandler()[1] },
                    { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                ]}>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Last Name*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.lastname}
                        onChangeText={(text) => setCredentials({ ...credentials, lastname: text })}
                        ref={(input) => { inputRef.current[1] = input; }}
                        onSubmitEditing={() => { inputRef.current[2].focus(); }}
                        returnKeyType='next'
                        blurOnSubmit={false}
                    />
                </View>
            </View>
            <View style={[
                globalStyles.textBox,
                { backgroundColor: textBoxBackgroundHandler()[2] },
                { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
            ]}>
                <TextInput
                    style={globalStyles.input}
                    placeholder="Username*"
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.username}
                    onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                    ref={(input) => { inputRef.current[2] = input; }}
                    onSubmitEditing={() => { inputRef.current[2].blur(); }}
                    returnKeyType='done'
                    blurOnSubmit
                />
            </View>
        </View>
    )
}

const contactInformation = ({ credentials, setCredentials, errorMessage, setActionState, sendSMS, localControls,setLocalControls }) => { 
    //context providers varables ===============================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    //refenernces ==============================================================
    const inputRef = useRef([]);

    //functions ================================================================
    const formatDate = (dob) => {
        const { date, month, year } = dob;
        if (!date || !month || !year) { 
            return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return new Date(year, month - 1, date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const compareDate = () => {
        const currentDate = new Date();
        const { date, month, year } = credentials.dob;
        if (date === currentDate.getDate() && month === currentDate.getMonth() + 1 && year === currentDate.getFullYear()) { return .5; } 
        else { return 1; }
    }

    const textBoxBackgroundHandler = () => {
        let bgContactNumber = colors.form;
        let bgDateOfBirth = colors.form;
        let bgWeight = colors.form;

        if (errorMessage) {
            const loweredErrorMessage = errorMessage.toLowerCase();
            if (loweredErrorMessage.includes('contact') || loweredErrorMessage.includes('number')) { bgContactNumber = colors.errorRedText; }
            if (loweredErrorMessage.includes('date')) { bgDateOfBirth = colors.errorRedText; }
            if (loweredErrorMessage.includes('weight')) { bgWeight = colors.errorRedText; }
        }

        return [bgContactNumber, bgDateOfBirth, bgWeight];
    }

    //return ==============================================================
    return (
        <View style={globalStyles.formContainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>CONTACT INFORMATION</Text>
            </View>
            <View style={[
                globalStyles.textBox,
                { backgroundColor: textBoxBackgroundHandler()[0] },
                { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
            ]}>
                <View style={[styles.horizontalContainer, { gap: 0 }]}>
                    <Text style={[globalStyles.input, { flex: .25, color: rgba(colors.text, .5), textAlignVertical: 'center' }]}>+63</Text>
                    <TextInput style={[ globalStyles.input, { flex: 1 } ]}
                        placeholder="99X-XXX-XXX*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.contactNumber}
                        onChangeText={(text) => setCredentials({ ...credentials, contactNumber: text })}
                        ref={(input) => { inputRef.current[0] = input; }}
                        onSubmitEditing={() => { }}
                        returnKeyType='next'
                        blurOnSubmit={false}
                        keyboardType='phone-pad'
                        maxLength={10}
                    />
                </View>
                <TouchableOpacity onPress={() => setActionState((prev) => ({ ...prev, otpModal: true }))}>
                    <Text style={styles.verify}>VERIFY</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.horizontalContainer}>
                <TouchableOpacity 
                    style={[ globalStyles.textBox, { flex: 1, backgroundColor: textBoxBackgroundHandler()[1] }, ]}
                    onPress={() => setActionState((prev) => ({ ...prev, datePickerVisible: true }))}
                >
                    <Text style={[
                        globalStyles.input, 
                        { textAlign: 'center' },
                        { opacity: compareDate()}
                    ]}>
                        {formatDate(credentials.dob)}
                    </Text>
                </TouchableOpacity>

                <View style={[
                    globalStyles.textBox, 
                    { backgroundColor: textBoxBackgroundHandler()[2] },
                    { width: 135 , flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
                ]}>
                    <TextInput
                        style={[globalStyles.input, { flex: 1 }]}
                        placeholder="Weight*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.weight}
                        onChangeText={(text) => setCredentials({ ...credentials, weight: text })}
                        ref={(input) => { inputRef.current[1] = input; }}
                        onSubmitEditing={() => { }}
                        returnKeyType='next'
                        keyboardType='phone-pad'
                        blurOnSubmit={false}
                    />
                    <Text style={[globalStyles.input, { flex: .50, color: rgba(colors.text, .5), textAlignVertical: 'center', textAlign: 'right' }]}>KG</Text>
                </View>
            </View>
        </View>
    )
}

const OtpInput = ({ credentials, setCredentials, actionState, errorMessage, sendSMS, verifyOtp, localControls, setLocalControls, setLoading, generatedOtp }) => {
    
    //context providers varables ===============================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    //refenernces ==============================================================
    const [cdTime, setCdTime] = useState(0);

    //functions ================================================================
    const submitHandler = () => {
        setLoading(true);
        if (generatedOtp?.length < 1) { sendSMS(); }
        else { verifyOtp(); }
    }

    const textBoxBackgroundHandler = () => {
        let bgOtp = colors.form;
        if (errorMessage) {
            const loweredErrorMessage = errorMessage.toLowerCase();
            if (loweredErrorMessage.includes('phone')) {
                bgOtp = colors.errorRedText;
            }
        }
        return [bgOtp];
    }

    //useEffect ================================================================
    useEffect(() => {
        if (!localControls.cdTimestamp) return;

        const calculateRemainingTime = () => {
            const currentTime = new Date().getTime();
            const cdTimeStart = localControls.cdTimestamp * 1000;
            const cdDuration = 1.5 * 60 * 1000;
            const remainingTime = cdTimeStart + cdDuration

            if (remainingTime < currentTime || actionState.contactNumberVerified) {
                setCdTime(0);
                setLocalControls(prev => ({ ...prev, cdTimestamp: null }));
            } else { setCdTime(Math.ceil((remainingTime - currentTime) / 1000)); }
        };

        calculateRemainingTime();
        const interval = setInterval(calculateRemainingTime, 1000);
        return () => clearInterval(interval);
    }, [localControls.cdTimestamp]);

    //return ===================================================================
    return (
        <View style={globalStyles.formContainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.primary} size={25} />
                <Text style={[globalStyles.headerText, { color: colors.primary }]}>PLEASE ENTER YOUR OTP</Text>
            </View>
            <View style={[globalStyles.textBox, { backgroundColor: textBoxBackgroundHandler()[0] }]}>
                <TextInput
                    style={globalStyles.input}
                    placeholder="OTP number on your message*"
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.otp}
                    onChangeText={(text) => setCredentials({ ...credentials, otp: text })}
                    onSubmitEditing={() => { }}
                    returnKeyType='next'
                    blurOnSubmit={false}
                    keyboardType='phone-pad'
                    maxLength={6}
                />
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={globalStyles.primaryButton} onPress={() => submitHandler()}>
                    <Text style={globalStyles.primaryButtonText}>{generatedOtp?.length <= 0 ? 'SEND OTP SMS CODE' : 'VERIFY'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ opacity: cdTime > 0 || actionState.contactNumberVerified ? .5 : 1 }} onPress={() => sendSMS()} disabled={cdTime > 0 || actionState.contactNumberVerified}>
                    <Text style={styles.resendOtp}>{generatedOtp?.length <= 0 ? ' ' : cdTime > 0 ? `Didn't receive OTP? Resend in: ${cdTime}s` : 'Resend SMS OTP code'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const createStyles = (fonts, colors) => StyleSheet.create({
    horizontalContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10
    },
    buttonContainer: {
        gap: 10,
    },
    verify: {
        fontFamily: fonts.RubikSemiBold,
        color: colors.primary,
        fontSize: 15,
        alignSelf: 'center',
    },
    resendOtp: {
        fontFamily: fonts.RubikRegular,
        color: colors.text,
        fontSize: 15,
        alignSelf: 'center',
    }
})

export { personalInformation, contactInformation, OtpInput };