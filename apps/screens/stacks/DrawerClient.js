//context providers
import { useThemes } from "../../providers/themes";
//screens & components
import DrawerHeader from "../../components/cmpDrawerHeader";
import Logout from "../../components/cpmLogout"; 
import ClientHome from '../scrClientHome';
import Options from '../scrOptions';
import Transactions from "../scrTransactions";
//libraries
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer';
//react native hooks
import React from 'react';
import { View } from 'react-native';

//initiate drawer
const Drawer = createDrawerNavigator();

export default function DrawerClient() {

    //context providers
    const { fonts, colors, rgba } = useThemes();
    //local variables
    const styles = { font: fonts.Righteous, fontColor: colors.text, fontSize: 15, letterSpacing: 1, iconMarginLeft: 10, iconSize: 22.5, iconColor: colors.primary, border: 12 };

    const DrawerContent = (props) => ( //drawer content
        <DrawerContentScrollView contentContainerStyle={{flex: 1}} {...props}>
            <View style={{flex: 1, marginTop: 5, gap: 10 }}>
                {/* <ProfileView navigation={props.navigation}/> */}
                <DrawerItemList {...props} />
            </View>
            <View style={{height: 'fit-content' }}>
                <Logout styleControls={styles}/>
            </View>
        </DrawerContentScrollView>
    );

    return (
        <Drawer.Navigator
            screenOptions={{
                header: () => <DrawerHeader />,
                drawerStyle: { backgroundColor: colors.form, width: '75%', },
                drawerContentStyle: { borderRadius: 20 },
                drawerActiveBackgroundColor: rgba(colors.secondary, 0.25),
                drawerActiveTintColor: styles.iconColor,
                drawerInactiveTintColor: colors.text,
                drawerLabelStyle: { fontSize: styles.fontSize, fontFamily: styles.font, marginHorizontal: 10, },
                drawerItemStyle: { borderRadius: styles.border },
            }}
            drawerContent={(props) => <DrawerContent {...props} />}
        >

            <Drawer.Screen name="Home" component={ClientHome} 
                options={{
                    title: 'BOOK NOW',
                    drawerIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "navigate" : "navigate-outline"} 
                            size={styles.iconSize} 
                            color={focused ? styles.iconColor : colors.text} 
                            style={{ marginLeft: styles.iconMarginLeft }}
                        />
                    )
                }}
            />

            <Drawer.Screen name="Options" component={Options}
                options={{
                    title: 'OPTIONS',
                    drawerIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "cog" : "cog-outline"} 
                            size={styles.iconSize} 
                            color={focused ? styles.iconColor : colors.text} 
                            style={{ marginLeft: styles.iconMarginLeft }}
                        />
                    )
                }}
            />

            <Drawer.Screen name="Transactions" component={Transactions}
                options={{
                    title: 'TRANSACTIONS',
                    drawerIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "cash" : "cash-outline"} 
                            size={styles.iconSize} 
                            color={focused ? styles.iconColor : colors.text} 
                            style={{ marginLeft: styles.iconMarginLeft }}
                        />
                    )
                }}
            />

        </Drawer.Navigator>
    )
}