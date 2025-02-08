//pages
import { login, register } from './pagesAuth';
import { useEffect } from 'react';
//react native components
import React, { useRef } from 'react'
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native'

export default function AuthSlider({ actionState, setActionState, credentials, setCredentials, errorMessage }) {
    
    //local variables
    const { width } = Dimensions.get('window');
    const pages = [{ id: 1, page: login }, { id: 2, page: register }];
    //references
    const ref = useRef(null);

    const renderItem = ({ item, credentials, setCredentials }) => {
        const PageComponent = item.page;
        return (
            <View style={[styles.pageContainer, { width }]}>
                <PageComponent credentials={credentials} setCredentials={setCredentials} actionState={actionState} errorMessage={errorMessage} />
            </View>
        )
    }

    const onViewChanged = ({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const currentPage = viewableItems[0].index;
            setActionState({ register: currentPage === 1 });
        }
    };

    useEffect(() => {
        if (ref.current) {
            const index = actionState.register ? 1 : 0;
            ref.current.scrollToIndex({ index, animated: true, viewOffset: 0, viewPosition: 0 });

        }
    }, [actionState.register]);

    return (
        <FlatList
            ref={ref}
            data={pages}
            renderItem={({ item }) => renderItem({ item, actionState, setActionState, credentials, setCredentials })}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
            })}
            onViewableItemsChanged={onViewChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 90 }}
            keyboardShouldPersistTaps="always"
        />
    )
}

const styles = StyleSheet.create({
    pageContainer: {
        justifyContent: 'flex-end',
        paddingHorizontal: 25,
    },
});