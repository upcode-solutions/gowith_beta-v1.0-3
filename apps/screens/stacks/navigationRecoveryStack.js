//libraries
import { createNativeStackNavigator } from "@react-navigation/native-stack";
//screens
import RecoveryCredentials from "../scrRecoveryCredentials";
import RecoveryAction from "../scrRecoveryAction";
//react native components
import React from "react";
import { StyleSheet, Text, View } from "react-native";

//initialize stack
const Stack = createNativeStackNavigator(); //initiate stack

export default function RecoveryStack() {
    return (
        <Stack.Navigator initialRouteName="RecoveryCredentials" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RecoveryCredentials" component={RecoveryCredentials} />
            <Stack.Screen name="RecoveryAction" component={RecoveryAction} />
        </Stack.Navigator>
    );
}