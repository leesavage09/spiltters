import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useCurrentUser } from "../hooks/useAuth";
import { colors } from "../theme/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/navigationRef";
import { useNavigation } from "@react-navigation/native";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { data: user, isLoading, isError } = useCurrentUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  React.useEffect(() => {
    if (!isLoading && (isError || !user)) navigation.replace("Login");
  }, [isLoading, isError, user, navigation]);

  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.blue500} />
      </View>
    );

  if (!user) return null;

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.slate950,
  },
});

export default ProtectedRoute;
