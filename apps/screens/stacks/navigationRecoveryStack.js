//navigation
import { useNavigation } from "@react-navigation/native";
//libraries
import { createNativeStackNavigator } from "@react-navigation/native-stack";
//screens
import RecoveryCredentials from "../scrRecoveryCredentials";
import RecoveryAction from "../scrRecoveryAction";
//components
import GoBack from "../../components/cmpGoBack";
//react native components
import React from "react";

//initialize stack
const Stack = createNativeStackNavigator(); //initiate stack

export default function RecoveryStack() {

    const navigation = useNavigation();
    
    return (
        <Stack.Navigator initialRouteName="RecoveryCredentials">
            <Stack.Screen 
                name="RecoveryCredentials" 
                component={RecoveryCredentials} 
                options={({ navigation }) => ({ 
                    header: () => <GoBack direction={() => navigation.navigate('AuthScreen')} />
                })} 
            />
            <Stack.Screen 
                name="RecoveryAction" 
                component={RecoveryAction} 
                options={({ navigation }) => ({ 
                    header: () => <GoBack direction={() => navigation.navigate('AuthScreen')} />
                })} 
            />
        </Stack.Navigator>
    );
}