import { StyleSheet, Dimensions } from 'react-native';
import FloatingView from '../components/modalFloatingView';

const { width, height } = Dimensions.get('window');
const textBox = { height: 45, width: '100%' };
const fontSize = { xs: 10, sm: 12, md: 15, lg: 18, xl: 20 };
const borderRadius = { xs: 8, sm: 12, md: 16, lg: 18, xl: 20, full: '100%', half: '50%' };
const gapadmar = { xs: 5, sm: 10, md: 15, lg: 20, xl: 25 };

export const useGlobalStyles = (fonts, colors, rgba) => StyleSheet.create({
    container: {
        flex: 1,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: height,
    },
    logo: {
        position: 'absolute',
        top: height * .1,
        width: width * .5,
        height: height * .15,
        resizeMode: 'contain',
        alignSelf: 'center',
        zIndex: 1
    },

    formContainer: {
        gap: gapadmar.sm,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gapadmar.sm
    },
    headerText: {
        fontFamily: fonts.RubikSemiBold,
        color: colors.constantWhite,
    },
    textBox: {
        height: textBox.height,
        width: '100%',
        borderRadius: borderRadius.sm,
        backgroundColor: colors.form,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: gapadmar.lg,
        //borderWidth: 1,
        //borderColor: colors.primary,
        elevation: 2,
        shadowColor: colors.shadowColor,
    },
    input: {
        flex: 1,
        minHeight: textBox.height,
        height: textBox.height,
        fontFamily: fonts.RubikRegular,
        fontSize: fontSize.md,
        color: colors.text,
        alignSelf: 'center',
        textAlignVertical: 'center',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        gap: gapadmar.sm,
    },
    primaryButton: {
        width: '100%',
        height: textBox.height,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: colors.shadowColor,
    },
    primaryButtonText: {
        fontFamily: fonts.RubikSemiBold,
        fontSize: fontSize.md,
        color: colors.constantWhite,
        alignSelf: 'center',
    },
    primaryHollowButton: {
        width: '100%',
        height: textBox.height / 2 ,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.primary,  
    },
    primaryHollowButtonText: {
        fontFamily: fonts.RubikRegular,
        fontSize: fontSize.md,
        color: colors.primary,
        alignSelf: 'center',
    },
    secondaryButton: {
        width: '100%',
        height: textBox.height,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: colors.shadowColor,
    },
    secondaryButtonText: {
        fontFamily: fonts.RubikSemiBold,
        fontSize: fontSize.md,
        color: colors.constantWhite,
        alignSelf: 'center',
    },
    bottomContainer:{
        //backgroundColor: colors.background,
        borderRadius: borderRadius.sm,
        position: 'absolute',
        bottom: 0,
        height: 'fit-content',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: '5%',
        zIndex: 99,
        gap: 10,
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: gapadmar.xs,
    },
    dividerLine: {
        alignSelf: 'center',
        width: '100%',
        height: 1.5,
        maxHeight: 1.5,
        backgroundColor: colors.primary,
    },

    bookingInformationButton: {
        flexDirection: 'row',
        width: 'fit-content',
        height: 45,
        position: 'absolute',
        top: 100,
        right: 0,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        zIndex: 99,
    },
    bookingInformationButtonIcon: {
        color: colors.constantWhite,
        fontSize: fontSize.lg,
        alignSelf: 'center',
    },

    floatiingView: {
        backgroundColor: colors.background,
        padding: 15,
        height: 'fit-content',
        gap: gapadmar.sm
    },
    floatingViewDataContainer: {
        backgroundColor: colors.form,
        padding: 15,
        borderRadius: borderRadius.sm,
        gap: gapadmar.xs
    },
    floatingViewProfileContainer : {
        flexDirection: 'row',
        backgroundColor: rgba(colors.primary, .5),
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: borderRadius.sm,
        gap: gapadmar.xs
    },
    floatingViewImage: {
        width: 75,
        height: 75,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: colors.primary,
        resizeMode: 'contain',
    },
    //bottom controls
    bottomControls: {
        width: '100%',
        backgroundColor: colors.background,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        gap: 10
    },
    priceContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: colors.form,
        borderRadius: 12,
    },
    priceDataContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    priceContainerIcon: {
        color: colors.primary,
        fontSize: 20,
    },
    priceContainerText: {
        fontFamily: fonts.Righteous,
        fontSize: 15,
        color: colors.text
    },
});