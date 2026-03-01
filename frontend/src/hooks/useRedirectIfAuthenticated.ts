import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/navigationRef";
import { useCurrentUser } from "./useAuth";

export const useRedirectIfAuthenticated = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: user, isLoading: isCheckingAuth } = useCurrentUser();

  useEffect(() => {
    if (user && !isCheckingAuth) navigation.replace("Home");
  }, [user, isCheckingAuth, navigation]);

  return { isCheckingAuth };
};
