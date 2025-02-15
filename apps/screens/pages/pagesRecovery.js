//contextProviders
import { useThemes } from '../../providers/themes';
import { useGlobalStyles } from '../../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native components
import React, { useRef } from 'react'
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native'

const LoginViaEmail = ({ credentials, setCredentials, errorMessage }) => {
    //context providers variables ==========================================
    const { colors, fonts, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    const inputRef = useRef([]);

    const backgroundColorHandler = () => {
        let bgEmail = colors.form;
        let bgUsername = colors.form;
        if (errorMessage) {
            const loweredErrorMessage = errorMessage.toLowerCase();
            if (loweredErrorMessage.includes('email')) { bgEmail = colors.errorRedText; }
            if (loweredErrorMessage.includes('username')) { bgUsername = colors.errorRedText; }
        }
        return [bgEmail, bgUsername];
    }

    return (
        <View style={globalStyles.formContainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>ENTER YOUR EMAIL AND USERNAME</Text>
            </View>
            <View style={[globalStyles.textBox, styles.horizontalContainer, { backgroundColor: backgroundColorHandler()[0] }]}>
                <TextInput
                    style={[globalStyles.input, { flex: 1 }]}
                    placeholder="Email Address"
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.email}
                    onChangeText={(text) => setCredentials({ ...credentials, email: text })}
                    ref={(ref) => inputRef.current[0] = ref}
                    onSubmitEditing={() => inputRef.current[1].focus()}
                    returnKeyType='next'
                    blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setCredentials({ ...credentials, email: '' })}>
                    <Ionicons name="close" color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
            <View style={[globalStyles.textBox, styles.horizontalContainer, { backgroundColor: backgroundColorHandler()[1] }]}>
                <TextInput
                    style={[globalStyles.input, { flex: 1 }]}
                    placeholder="Username"
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.username}
                    onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                    ref={(ref) => inputRef.current[1] = ref}
                    returnKeyType='done'
                    onSubmitEditing={() => inputRef.current[1].blur()}
                    blurOnSubmit
                />
                <TouchableOpacity onPress={() => setCredentials({ ...credentials, username: '' })}>
                    <Ionicons name="close" color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const LoginViaSMS = ({ credentials, setCredentials, errorMessage, actionState, setActionState }) => {
    //context providers variables ==========================================
    const { colors, fonts, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    const inputRef = useRef([]);

    return (
        <View style={globalStyles.formContainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>ENTER YOUR PHONE NUMBER</Text>
            </View>
            <View style={[globalStyles.textBox, styles.horizontalContainer]}>
                <Text style={[globalStyles.input, { flex: .25, color: rgba(colors.text, .5), textAlignVertical: 'center' }]}>+63</Text>
                <TextInput
                    style={[globalStyles.input, { flex: 1 }]}
                    placeholder="Contact Number"
                    placeholderTextColor={rgba(colors.text, .5)}
                    keyboardType='phone-pad'
                    value={credentials.contactNumber}
                    onChangeText={(text) => setCredentials({ ...credentials, contactNumber: text })}
                    ref={(ref) => inputRef.current[0] = ref}
                    returnKeyType='done'
                    onSubmitEditing={() => inputRef.current[0].blur()}
                    blurOnSubmit
                    maxLength={10}
                />
                <TouchableOpacity onPress={() => setActionState({ ...actionState, otpModal: true })} disabled={credentials.contactNumber.length < 10}>
                    <Text style={styles.verify}>VERIFY</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const createStyles = (fonts, colors) => StyleSheet.create({
    horizontalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    verify: {
        fontFamily: fonts.RubikSemiBold,
        color: colors.primary,
        fontSize: 15,
        alignSelf: 'center',
    },
})

export { LoginViaEmail, LoginViaSMS }