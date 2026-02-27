import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/navigationRef";
import { useCurrentUser, useRegister } from "../hooks/useAuth";
import { colors } from "../theme/theme";

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: user, isLoading: isCheckingAuth } = useCurrentUser();
  const register = useRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");

  React.useEffect(() => {
    if (user && !isCheckingAuth) navigation.replace("Home");
  }, [user, isCheckingAuth, navigation]);

  const handleRegister = () => {
    setClientError("");

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setClientError("Passwords do not match");
      return;
    }

    register.mutate({ email, password });
  };

  const serverError = register.error?.response?.data?.message;
  const errorMessage = clientError || serverError;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Splitters
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Create your account
        </Text>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          style={styles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
        />

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          style={styles.input}
          mode="outlined"
          outlineColor={colors.slate700}
          activeOutlineColor={colors.blue500}
          textColor={colors.white}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={register.isPending}
          disabled={register.isPending || !email || !password || !confirmPassword}
          style={styles.button}
          buttonColor={colors.blue600}
          textColor={colors.white}
        >
          Create Account
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Login")}
          textColor={colors.blue500}
          style={styles.linkButton}
        >
          Already have an account? Sign in
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate950,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    color: colors.white,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.slate400,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.slate900,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  linkButton: {
    marginTop: 16,
  },
  errorBox: {
    backgroundColor: "#7f1d1d",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
  },
});

export default RegisterScreen;
