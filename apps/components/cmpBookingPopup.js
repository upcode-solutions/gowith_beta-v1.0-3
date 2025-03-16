//context providers
import { useThemes } from '../providers/themes';
import { useGlobalStyles } from '../providers/styles';
//components
import FloatingView from './modalFloatingView';
//react native components
import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function cmpBookingPopup({ bookingCollection }) {

  //context variables
  const { fonts, colors, rgba } = useThemes();
  const globalStyles = useGlobalStyles(fonts, colors, rgba);
  const styles = createStyles(fonts, colors, rgba);
  //local variables
  const [isVisible, setIsVisible] = useState(false);

  //useEffect

  useEffect(() => {
    console.log(bookingCollection);
  }, [])

  return (
    <FloatingView>
      
    </FloatingView>
  )
}

const createStyles = (fonts, colors, rgba) => StyleSheet.create({})