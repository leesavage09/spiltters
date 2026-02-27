import { createNavigationContainerRef } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  SplitDetail: { splitId: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigate = (name: keyof RootStackParamList, params?: object) => {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (...args: unknown[]) => void)(name, params);
  }
};
