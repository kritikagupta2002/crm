import React, { createContext, useContext } from 'react';

/* The CRM has one light design; the HRMS follows it (its dark mode was dropped in the merge). */
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { }, isDark: false });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => children;
