//PROVIDERS
import { useControls } from "./controls";
import { dark, light, neutral } from "../assets/colors/colors";
//PACKAGES
import { useFonts } from "expo-font";
import React, { createContext, useContext } from "react";

const ThemesContext = createContext();

const ThemesProvider = ({ children }) => {
    
    //providers variables
    const {localControls} = useControls();
    const [fontsLoaded] = useFonts({
        "Pacifico-Regular": require("../assets/fonts/Pacifico-Regular.ttf"),
        "Righteous-Regular": require("../assets/fonts/Righteous-Regular.ttf"),
        "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
        "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    });

    if (!fontsLoaded) { return null; }

    const rgba = (rgb, alpha) => `rgba(${rgb.match(/\d+/g).map(Number).join(', ')}, ${alpha})`;

    const themes = {
        fonts: {
            'Pacifico': 'Pacifico-Regular',
            'Righteous': 'Righteous-Regular',
            'RubikRegular': 'Rubik-Regular',
            'RubikSemiBold': 'Rubik-SemiBold',
        },
        colors: {
            ...neutral,
            ...localControls.darkMode ? dark : light,
        },
        
        rgba, // Add rgba function to the context
    };

    return (
        <ThemesContext.Provider value={themes}>
            {children}
        </ThemesContext.Provider>
    );
};

export const useThemes = () => useContext(ThemesContext);
export default ThemesProvider;
