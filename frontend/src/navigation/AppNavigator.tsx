import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./navigationRef";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import SplitDetailScreen from "../screens/SplitDetailScreen";
import ProtectedRoute from "../components/ProtectedRoute";

const Stack = createNativeStackNavigator<RootStackParamList>();

const ProtectedHome: React.FC = () => (
  <ProtectedRoute>
    <HomeScreen />
  </ProtectedRoute>
);

const ProtectedSplitDetail: React.FC = () => (
  <ProtectedRoute>
    <SplitDetailScreen />
  </ProtectedRoute>
);

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#020617" },
        navigationBarColor: "#020617",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={ProtectedHome} />
      <Stack.Screen name="SplitDetail" component={ProtectedSplitDetail} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
