import { StyleSheet, Dimensions } from 'react-native';

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

    formCotainer: {
        gap: gapadmar.sm
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
});