import React, { createContext, useCallback, useContext, useState } from "react";
import { StyleSheet } from "react-native";
import { Portal, Snackbar as PaperSnackbar } from "react-native-paper";
import { colors } from "@/theme/theme";

type SnackbarType = "error" | "success" | "info";

interface SnackbarOptions {
  message: string;
  type?: SnackbarType;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions) => void;
}

const typeColors: Record<SnackbarType, string> = {
  error: colors.red500,
  success: colors.emerald600,
  info: colors.blue600,
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined,
);

export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (!context)
    throw new Error("useSnackbar must be used within SnackbarProvider");
  return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("info");
  const [duration, setDuration] = useState(4000);
  const [actionLabel, setActionLabel] = useState<string | undefined>();
  const [onAction, setOnAction] = useState<(() => void) | undefined>();

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    setVisible(false);
    queueMicrotask(() => {
      setMessage(options.message);
      setType(options.type ?? "info");
      setDuration(options.duration ?? 4000);
      setActionLabel(options.actionLabel);
      setOnAction(options.onAction ? () => options.onAction : undefined);
      setVisible(true);
    });
  }, []);

  const handleDismiss = useCallback(() => setVisible(false), []);

  const handleAction = useCallback(() => {
    onAction?.();
    setVisible(false);
  }, [onAction]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Portal>
        <PaperSnackbar
          visible={visible}
          onDismiss={handleDismiss}
          duration={duration}
          style={[styles.snackbar, { backgroundColor: typeColors[type] }]}
          action={
            actionLabel
              ? {
                  label: actionLabel,
                  onPress: handleAction,
                  textColor: colors.white,
                }
              : undefined
          }
        >
          {message}
        </PaperSnackbar>
      </Portal>
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 8,
  },
});
