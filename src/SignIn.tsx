import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Linking,
  Pressable,
} from "react-native";

export function SignIn() {
  return (
    <View style={styles.container}>
      <Text>Email</Text>
      <View style={styles.textInputContainer}>
        <TextInput placeholder="example@gmail.com" />
      </View>
      <Text>Password</Text>
      <View style={styles.textInputContainer}>
        <TextInput secureTextEntry={true} placeholder="At least 8 characters" />
      </View>

      <Pressable onPress={() => Linking.openURL("https://example.com")}>
        {({ pressed }) => (
          <Text
            style={{
              textDecorationLine: "underline",
              color: pressed ? "red" : "blue",
            }}
          >
            Forgot password?
          </Text>
        )}
      </Pressable>

      <View style={styles.fullWidth}>
        <Button title="Sign in" />
      </View>
      <Text>OR</Text>
      <View style={styles.fullWidth}>
        <Button title="Sign in with Google" />
        <Button title="Sign in with Facebook" />
      </View>
      <Text>Don't have an account?</Text>
      <Pressable onPress={() => Linking.openURL("https://example.com")}>
        {({ pressed }) => (
          <Text
            style={{
              textDecorationLine: "underline",
              color: pressed ? "red" : "blue",
            }}
          >
            Sign up
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // backgroundColor: "#fff",
    // alignItems: "flex-start",
    // justifyContent: "center",
    width: "50%",
  },
  textInputContainer: {
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderRadius: 4,
    padding: 4,
    backgroundColor: "#f7fbff",
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
});
