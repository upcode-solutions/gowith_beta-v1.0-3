//pages
import { LoginViaEmail, LoginViaSMS } from './pagesRecovery';
//react native components
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';

export const RecoverySlider = ({ credentials, setCredentials, errorMessage, actionState, setActionState, sendSMS, verifyOtp }) => {
    //local variables
    const { width } = Dimensions.get('window');
    const pages = [{ id: 1, page: LoginViaEmail }, { id: 2, page: LoginViaSMS }];
    //references
    const ref = useRef(null);

    const renderItem = ({ item }) => {
        const PageComponent = item.page;
        return (
            <View style={[styles.pageContainer, { width }]}>
                <PageComponent 
                    credentials={credentials}
                    setCredentials={setCredentials}
                    errorMessage={errorMessage}
                    actionState={actionState}
                    setActionState={setActionState}
                    sendSMS={sendSMS}
                    verifyOtp={verifyOtp}
                />
            </View>
        );
    };

    const onViewChanged = ({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const currentPage = viewableItems[0].index;
            setActionState({ recoverViaEmail: currentPage === 0 });
        }
    };

    useEffect(() => {
        if (ref.current) {
            const index = actionState.recoverViaEmail ? 0 : 1;
            ref.current.scrollToIndex({ index, animated: true, viewOffset: 0, viewPosition: 0 });
        }
    }, [actionState.recoverViaEmail]);

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
            scrollEnabled={false}
            getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
            })}
            onViewableItemsChanged={onViewChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 90 }}
            keyboardShouldPersistTaps="always"
        />
    );
};

const styles = StyleSheet.create({
    pageContainer: {
        justifyContent: 'flex-end',
        paddingHorizontal: 25,
    },
});
