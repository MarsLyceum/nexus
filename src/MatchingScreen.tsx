import { StyleSheet, Image, View } from "react-native";
const womanImg = require("./images/free-photo-of-woman-in-dress-lying-down-with-mirror-on-tree.jpeg");

export default function App() {
  return (
    <View style={styles.container}>
      <Image src={womanImg} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
