//context providers
import { useThemes } from '../../providers/themes';
import { useGlobalStyles } from '../../providers/styles';
//libraries
import { Ionicons } from '@expo/vector-icons';
//react native components
import React, { useState, useRef } from 'react'
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native'

const personalInformation = ({ credentials, setCredentials, errorMessage }) => {

    //context providers varables ===============================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    //refenernces ==============================================================
    const inputRef = useRef([]);

    return (
        <View style={globalStyles.formCotainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>PERSONAL INFORMATION</Text>
            </View>
            <View style={styles.horizontalContainer}>
                <View style={[
                    globalStyles.textBox,
                    { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                ]}>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="First Name*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.firstName}
                        onChangeText={(text) => setCredentials({ ...credentials, firstName: text })}
                        ref={(input) => { inputRef.current[0] = input; }}
                        onSubmitEditing={() => { inputRef.current[1].focus(); }}
                        returnKeyType='next'
                        blurOnSubmit={false}
                    />
                </View>
                <View style={[
                    globalStyles.textBox,
                    { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                ]}>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Last Name*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.lastName}
                        onChangeText={(text) => setCredentials({ ...credentials, lastName: text })}
                        ref={(input) => { inputRef.current[1] = input; }}
                        onSubmitEditing={() => { inputRef.current[2].focus(); }}
                        returnKeyType='next'
                        blurOnSubmit={false}
                    />
                </View>
            </View>
            <View style={[
                globalStyles.textBox,
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

const contactInformation = ({ credentials, setCredentials, errorMessage, actionState, setActionState }) => {

    //context providers varables ===============================================
    const { fonts, colors, rgba } = useThemes();
    const globalStyles = useGlobalStyles(fonts, colors, rgba);
    const styles = createStyles(fonts, colors);
    //refenernces ==============================================================
    const inputRef = useRef([]);

    return (
        <View style={globalStyles.formCotainer}>
            <View style={globalStyles.headerContainer}>
                <Ionicons name="key" color={colors.constantWhite} size={25} />
                <Text style={globalStyles.headerText}>CONTACT INFORMATION</Text>
            </View>
            <View style={[
                globalStyles.textBox,
                { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
            ]}>
                <View style={[styles.horizontalContainer, { gap: 0 }]}>
                    <Text style={[globalStyles.input, { flex: .25, color: rgba(colors.text, .5), textAlignVertical: 'center' }]}>+63</Text>
                    <TextInput style={[ globalStyles.input, { flex: 1 } ]}
                        placeholder="99X-XXX-XXX*"
                        placeholderTextColor={rgba(colors.text, .5)}
                        value={credentials.phone}
                        onChangeText={(text) => setCredentials({ ...credentials, phone: text })}
                        ref={(input) => { inputRef.current[0] = input; }}
                        onSubmitEditing={() => { }}
                        returnKeyType='next'
                        blurOnSubmit={false}
                        keyboardType='phone-pad'
                        maxLength={10}
                    />
                </View>
                <TouchableOpacity>
                    <Text style={styles.verify}>VERIFY</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.horizontalContainer}>
                <TouchableOpacity 
                    style={[
                        globalStyles.textBox,
                        { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                    ]}
                    onPress={() => setActionState((prev) => ({ ...prev, datePickerVisible: true }))}
                >
                    <Text style={globalStyles.input}>{}</Text>
                </TouchableOpacity>

                <View style={[
                    globalStyles.textBox, 
                    { flex: .75, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
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
                        keyboardType='numeric'
                        blurOnSubmit={false}
                    />
                    <Text style={[globalStyles.input, { flex: .50, color: rgba(colors.text, .5), textAlignVertical: 'center', textAlign: 'right' }]}>KG</Text>
                </View>
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
    }
})

export { personalInformation, contactInformation }