import { StyleSheet, Text, View } from "react-native";
const name = "Karyll Vonn L. Kila-an ";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Welcome Karyll Vonn L. Kila-an To React Native Using Expo !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
