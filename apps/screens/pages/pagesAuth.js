//contextProviders
import { useThemes } from '../../providers/themes';
import { useGlobalStyles } from '../../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native components
import React, { useState, useRef } from 'react'
import { Text, TextInput, View, TouchableOpacity } from 'react-native'

const login = ({ credentials, setCredentials, actionState, errorMessage }) => {

    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const [hide, setHide] = useState(true);
    const inputRef = useRef([]);

    const textBoxBacgroundHandler = () => {
        let bgEmailUsername = colors.form;
        let bgPassword = colors.form;

        if (!actionState.register && errorMessage) {
            const loweredErrorMessage = errorMessage.toLowerCase();
            if (loweredErrorMessage.includes('doesn\'t') || loweredErrorMessage.includes('credentials')) { bgEmailUsername = colors.errorRedText; bgPassword = colors.errorRedText; }
            if (loweredErrorMessage.includes('username') || loweredErrorMessage.includes('email')) { bgEmailUsername = colors.errorRedText; }
            if (loweredErrorMessage.includes('password')) { bgPassword = colors.errorRedText; }
        }

        return [bgEmailUsername, bgPassword];
    }

    return (
        <View style={globalStyles.formCotainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>LOGIN TO YOUR ACCOUNT</Text>
            </View>
            <View style={[
                globalStyles.textBox, 
                { backgroundColor: textBoxBacgroundHandler()[0] },
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
            ]}>
                <TextInput
                    style={[globalStyles.input, { flex: 1 }]}
                    placeholder='email or username*'
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.usernameEmail}
                    onChangeText={(text) => setCredentials({ ...credentials, usernameEmail: text })}
                    ref={(ref) => inputRef.current[0] = ref}
                    onSubmitEditing={() => inputRef.current[1].focus()}
                    returnKeyType='next'
                    blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setCredentials({ ...credentials, usernameEmail: '' })}>
                    <Ionicons name="close" color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
            <View style={[
                globalStyles.textBox, 
                { backgroundColor: textBoxBacgroundHandler()[1] },
                {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}
            ]}>
                <TextInput
                    style={globalStyles.input}
                    placeholder='password*'
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.password}
                    onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                    ref={(ref) => inputRef.current[1] = ref}
                    returnKeyType='done'
                    onSubmitEditing={() => inputRef.current[1].blur()}
                    blurOnSubmit
                    secureTextEntry={hide}
                />
                <TouchableOpacity onPress={() => setHide(!hide)}>
                    <Ionicons name={hide ? "eye-off" : "eye"} color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const register = ({ credentials, setCredentials, actionState, errorMessage }) => {

    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const [hide, setHide] = useState({ password: true, confirmPassword: true });
    const inputRef = useRef([]);

    const textBoxBacgroundHandler = () => {
        let bgEmailUsername = colors.form;
        let bgPassword = colors.form;
        let bgConfirmPassword = colors.form;

        if (actionState.register && errorMessage) {
            const loweredErrorMessage = errorMessage.toLowerCase();
            if (loweredErrorMessage.includes('email')) { bgEmailUsername = colors.errorRedText; }
            if (loweredErrorMessage.includes('password')) { bgPassword = colors.errorRedText; }
            if (loweredErrorMessage.includes('match') || loweredErrorMessage.includes('weak')) { bgConfirmPassword = colors.errorRedText; }
        }

        return [bgEmailUsername, bgPassword, bgConfirmPassword];
    }

    return (
        <View style={globalStyles.formCotainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>CREATE AN ACCOUNT</Text>
            </View>
            <View style={[
                globalStyles.textBox, 
                { backgroundColor: textBoxBacgroundHandler()[0] },
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
            ]}>
                <TextInput
                    style={globalStyles.input}
                    placeholder='email*'
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.usernameEmail}
                    onChangeText={(text) => setCredentials({ ...credentials, usernameEmail: text })}
                    ref={(ref) => inputRef.current[0] = ref}
                    onSubmitEditing={() => inputRef.current[1].focus()}
                    returnKeyType='next'
                    blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => setCredentials({ ...credentials, usernameEmail: '' })}>
                    <Ionicons name="close" color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
            <View style={[
                globalStyles.textBox,
                { backgroundColor: textBoxBacgroundHandler()[1] },
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
            ]}>
                <TextInput
                    style={globalStyles.input}
                    placeholder='password*'
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.password}
                    onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                    ref={(ref) => inputRef.current[1] = ref}
                    returnKeyType='next'
                    onSubmitEditing={() => inputRef.current[2].focus()}
                    blurOnSubmit={false}
                    secureTextEntry={hide.password}
                />
                <TouchableOpacity onPress={() => setHide({ ...hide, password: !hide.password })}>
                    <Ionicons name={hide.password ? "eye-off" : "eye"} color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
            <View style={[
                globalStyles.textBox, 
                { backgroundColor: textBoxBacgroundHandler()[2] },
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
            ]}>
                <TextInput
                    style={globalStyles.input}
                    placeholder='confirm password*'
                    placeholderTextColor={rgba(colors.text, .5)}
                    value={credentials.confirmPassword}
                    onChangeText={(text) => setCredentials({ ...credentials, confirmPassword: text })}
                    ref={(ref) => inputRef.current[2] = ref}
                    returnKeyType='done'
                    onSubmitEditing={() => inputRef.current[2].blur()}
                    blurOnSubmit
                    secureTextEntry={hide.confirmPassword}
                />
                <TouchableOpacity onPress={() => setHide({ ...hide, confirmPassword: !hide.confirmPassword })}>
                    <Ionicons name={hide.confirmPassword ? "eye-off" : "eye"} color={rgba(colors.primary, 1)} size={20} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export { login, register }