//context providers
import { useThemes } from '../providers/themes';
//libraries
import MapView, { Marker, Polyline} from "react-native-maps";
//react native hooks
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { PointerType } from "react-native-gesture-handler";

export default function Mapview({ points, route, mapRef, heading }) {

    const { colors } = useThemes();

    return (
        <MapView
            ref={mapRef || null}
            style={{ ...StyleSheet.absoluteFillObject }}
            initialRegion={{ //manila
                latitude: 14.5995,
                longitude: 120.9842,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }}
            mapPadding={{ top: 60, right: 0, bottom: 0, left: 5 }}
        >
            { points && points.map((point, index) => (
                point.latitude && point.longitude ? (
                    <Marker
                        key={index}
                        coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                        //title={point.geoName}
                        flat={point.type === 'riders' ? true : false}
                        anchor={point.type === 'riders' ? { x: .5, y: .5 } : { x: 0, y: 0 }}
                        rotation={ point.type === 'riders' ? heading || 0 : 0 }
                        image={point.type === 'riders' ? require('../assets/images/vectorRider2.png'): undefined}
                        pinColor={point.type !== 'riders' && point.type === 'pickup' ? colors.primary : colors.secondary}
                    />
                ) : null
            ))}
        </MapView>
    );
}