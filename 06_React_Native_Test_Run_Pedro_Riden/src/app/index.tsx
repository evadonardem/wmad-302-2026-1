import { StyleSheet, Text, View } from "react-native";

export default function Index() {

  const name = "Pedro Riden";
  
  return (
    <View style={styles.container}>
      <Text>Welcome {name} to the React Native!</Text>
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
