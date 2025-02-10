//react native packages
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
//react native components
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

export default function BottomSheet({ isVisible, onClose, backgroundColor, children }) {

  const toggleBottomSheet = () => { onClose(); }; //toggle the bottom sheet to open or close

  return (
    <SafeAreaView>
      <Modal
        isVisible={isVisible}
        onBackButtonPress={toggleBottomSheet}
        onBackdropPress={toggleBottomSheet}
        backdropOpacity={.5}
        swipeDirection="down"
        onSwipeComplete={toggleBottomSheet}
        style={{ justifyContent: 'flex-end', margin: 0, padding: 0 }}
        animationIn={'slideInUp'}
        animationOut={'slideOutDown'}
        backdropTransitionOutTiming={5}
        backdropTransitionInTiming={5}
      >
        <View style={[styles.container, { backgroundColor: backgroundColor }]}>
          <View style={styles.headerContainer}>
            {/* <TouchableOpacity onPress={toggleBottomSheet} style={styles.header}>
              <Ionicons name="chevron-down" size={24} color="grey" />
            </TouchableOpacity> */}
          </View>
          <View style={styles.children}>
            {children}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
     borderTopLeftRadius: 15, 
     borderTopRightRadius: 15, 
     paddingHorizontal: 25,
     overflow: 'hidden'
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
    width: '100%',
  },
  header: {
    alignContent: 'center',
    justifyContent: 'center',
  },
  children: {
    paddingVertical: 15
  }
});