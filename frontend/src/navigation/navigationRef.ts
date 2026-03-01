import { createNavigationContainerRef } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  SplitDetail: { splitId: string };
  ExpenseDetail: { splitId: string; expenseId: string };
  Notifications: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigate = (name: keyof RootStackParamList, params?: object) => {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (...args: unknown[]) => void)(name, params);
  }
};
