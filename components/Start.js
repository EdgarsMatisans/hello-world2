import React from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ImageBackground,
} from "react-native";
// importing images and icons
// import BackgroundImage from "../assets/background-image.png";

export default class Start extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: "" };
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TextInput
          style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
          onChangeText={(name) => this.setState({ name })}
          value={this.state.name}
          placeholder="Your name"
        />
        <Button
          title="Go to Chat"
          onPress={() =>
            this.props.navigation.navigate("Chat", { name: this.state.name })
          }
        />
      </View>
    );
  }
}
