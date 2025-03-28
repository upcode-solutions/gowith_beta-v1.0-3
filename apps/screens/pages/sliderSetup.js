//pages
import { personalInformation, contactInformation } from './pagesSetup';
//react native components
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';

export default function SliderSetup({ credentials, setCredentials, errorMessage, currentPage, setCurrentPage, actionState, setActionState, sendSMS, verifyOtp, localControls, setLocalControls, timer }) {

    //local variables
    const { width } = Dimensions.get('window');
    const pages = [{ id: 1, page: personalInformation }, { id: 2, page: contactInformation }];
    const flatListRef = useRef(null);

    const renderItem = ({ item }) => {
        const PageComponent = item.page;
        return (
            <View style={[styles.pageContainer, { width }]}>
                <PageComponent 
                    {...{ credentials, setCredentials, errorMessage, actionState, setActionState, sendSMS, verifyOtp, localControls, setLocalControls, timer }}
                />
            </View>
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) { setCurrentPage(viewableItems[0].index); }
    }).current;

    useEffect(() => {
        if (flatListRef.current) { flatListRef.current.scrollToIndex({ index: currentPage, animated: true }); }
    }, [currentPage]);

    return( 
        <FlatList
            ref={flatListRef}
            data={pages}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            pagingEnabled 
            scrollEnabled={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            keyboardShouldPersistTaps="always"
            onViewableItemsChanged={onViewableItemsChanged}
            
        />
    );
}

const styles = StyleSheet.create({
    pageContainer: {
        justifyContent: 'flex-end',
        paddingHorizontal: 25,
    },
})