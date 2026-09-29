import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { }, isDark: false });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => children;
