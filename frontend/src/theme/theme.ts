import { MD3DarkTheme } from "react-native-paper";

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#2563eb",
    primaryContainer: "#1e40af",
    secondary: "#059669",
    secondaryContainer: "#047857",
    background: "#020617",
    surface: "#0f172a",
    surfaceVariant: "#1e293b",
    error: "#ef4444",
    errorContainer: "#991b1b",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onBackground: "#ffffff",
    onSurface: "#ffffff",
    onSurfaceVariant: "#94a3b8",
    outline: "#1e293b",
    elevation: {
      level0: "transparent",
      level1: "#0f172a",
      level2: "#1e293b",
      level3: "#1e293b",
      level4: "#334155",
      level5: "#334155",
    },
  },
};

export const colors = {
  slate950: "#020617",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate400: "#94a3b8",
  white: "#ffffff",
  blue600: "#2563eb",
  blue500: "#3b82f6",
  emerald600: "#059669",
  red500: "#ef4444",
} as const;

export default theme;
