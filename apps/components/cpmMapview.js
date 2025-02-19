import MapView, { Marker, Polyline} from "react-native-maps";
//react native hooks
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function Mapview({ points, route, mapRef }) {
    return (
        <MapView
        style={{ ...StyleSheet.absoluteFillObject }}
        initialRegion={{ //manila
            latitude: 14.5995,
            longitude: 120.9842,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        }}
        >
            
        </MapView>
    );
}