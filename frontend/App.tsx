import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import theme from "./src/theme/theme";
import { SnackbarProvider } from "./src/components/ui/snackbar/snackbar";
import { DatabaseProvider } from "./src/db/DatabaseProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider>
        <PaperProvider theme={theme}>
          <SnackbarProvider>
            <SafeAreaProvider>
              <NavigationContainer ref={navigationRef}>
                <StatusBar style="light" />
                <AppNavigator />
              </NavigationContainer>
            </SafeAreaProvider>
          </SnackbarProvider>
        </PaperProvider>
      </DatabaseProvider>
    </QueryClientProvider>
  );
};

export default App;
