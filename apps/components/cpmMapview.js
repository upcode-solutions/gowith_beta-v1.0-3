//context providers
import { useControls } from '../providers/controls';
import { useThemes } from '../providers/themes';
//libraries
import MapView, { Marker, Polyline} from "react-native-maps";
import { Ionicons } from '@expo/vector-icons';
//react native hooks
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function Mapview({ bookingStatus, points, mapRef, bookingDetails, setBookingDetails, heading }) {

    //context providers
    const { firestoreTransactionFee, localData } = useControls();
    const { colors } = useThemes();
    //local state
    const [route, setRoute] = useState([]);
    
    //functions =================================================================
    const isNearby = (coord1, coord2, threshold = 0.0001) => {
        if (!coord1 || !coord2) return false;
        const latDiff = Math.abs(coord1.latitude - coord2.latitude);
        const lngDiff = Math.abs(coord1.longitude - coord2.longitude);
        return latDiff < threshold && lngDiff < threshold;
    };

    const fetchRoute = async (from, to) => {
        console.log('fetching route');
        try {
            const { routes } = await (await fetch(`https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`)).json();
            if (!routes?.length) return;
            const routeCoordinates = routes[0].geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
            setRoute(routeCoordinates);

            if(localData?.userType === 'riders') {
                const steps = routes[0].legs[0].steps.map((step) => ({
                    distanceKm: (step.distance / 1000).toFixed(2),
                    instruction: step.maneuver.instruction || `${step.maneuver.type} ${step.maneuver.modifier || ''}`.trim(),
                    street: step.name || "an unnamed road",
                })).filter((step) => !step.instruction.includes('depart'));

                const { instruction, street } = bookingDetails?.steps || {};
                if (instruction !== steps[0].instruction || street !== steps[0].street) {
                    setBookingDetails((prev) => ({ ...prev, steps: steps[0] }));
                }   
            }

            if (isNearby(from, to)) {
                setBookingDetails((prev) => ({ ...prev, distance: 0, price: 0, duration: 0 }));
                return;
            }
            
            if (localData?.userType === 'clients' && bookingStatus === 'inactive') {
                const distance = parseFloat((routes[0].distance / 1000).toFixed(2));
                const duration = parseFloat((routes[0].duration / 60).toFixed(2));
                const price = distance <= 2 
                    ? firestoreTransactionFee.minimumDistance 
                    : Math.floor(((distance - 2) * firestoreTransactionFee.maximumDistance) + (firestoreTransactionFee.minimumDistance * 2));
    
                setBookingDetails({ distance, price, duration });
            }
        }catch(e) { console.warn("Error fetching route:", e); }
    }

    //useEffects ================================================================
    useEffect(() => {
        
        const { clientOnBoard } = bookingDetails.bookingDetails || {};
        const { userType } = localData;
        //console.log(`userType: ${userType}, clientOnBoard: ${clientOnBoard}`);
        
        if(userType === 'riders' && bookingStatus === 'inactive' || bookingStatus === 'onQueue') { 
            setRoute([]); 
            setBookingDetails((prev) => ({ ...prev, steps: {} }));
        }

        
        if (!points[0].latitude || !points[0].longitude || !points[2].latitude || !points[2].longitude) {
            setRoute([]);
        }
        
        if (userType === 'clients') { fetchRoute(points[0], points[1]); }
        else if (bookingStatus === 'active' && !clientOnBoard) { fetchRoute(points[2], points[0]); }
        else if (bookingStatus === 'active' && clientOnBoard) { fetchRoute(points[2], points[1]); }
        
    }, [bookingDetails.bookingDetails?.clientOnBoard, points, bookingStatus]);

    useEffect(() => {
        if (mapRef.current && points[2].latitude && points[2].longitude) {
            mapRef.current.animateCamera({
                center: { latitude: points[2].latitude, longitude: points[2].longitude },
                pitch: 50, // Tilt angle
                heading: heading, // Heading direction
                //zoom: 60, // Set your desired zoom level here
            }, { duration: 500 });
        }
    }, [heading, points[2].latitude, points[2].longitude]);

    /* useEffect(() => {
        if ( points[0].latitude && points[0].longitude && points[2].latitude && points[2].longitude ) { mapRef.current.fitToCoordinates([points[0], points[2]], { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, }); } 
        else { mapRef.current.fitToCoordinates([points[0], points[1]], { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, }); }
    }, [points[0], points[2]]); */
    
    //render ====================================================================
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
            //minZoomLevel={12}
            maxZoomLevel={20}
            showsBuildings={false}
        >
            { points && points.map((point, index) => (
                point.latitude && point.longitude ? (
                    index > 1 ? (
                        <Marker
                            key={index}
                            title={point.geoName}
                            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                            flat={true}
                            image={
                                point.type === 'clients' 
                                ? require('../assets/images/vectorClient.png')
                                : require('../assets/images/vectorRider.png')
                            }
                            anchor={{ x: 0.5, y: 0.5 }}
                            rotation={heading}
                        />
                    ) : (
                        isNearby(
                            { latitude: point.latitude, longitude: point.longitude },
                            { latitude: points[3]?.latitude, longitude: points[3]?.longitude }
                        ) ? null : (
                            <Marker
                                key={index}
                                title={point.geoName}
                                coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                            >
                                <Ionicons 
                                    name='location-sharp' //{index === 0 ? "location-sharp" : "flag"} 
                                    size={35} 
                                    color={index === 0 
                                        ? colors.primary 
                                        : colors.secondary
                                    } 
                                    />
                            </Marker>
                        )
                    )
                ) : null
            ))}


            { route.length > 0 && (
                <Polyline
                    coordinates={route}
                    strokeWidth={7.5}
                    strokeColor={colors.tertiary}
                    zIndex={1}
                    lineCap="round"
                    lineJoin="round"
                />
            )}
        </MapView>
    );
}