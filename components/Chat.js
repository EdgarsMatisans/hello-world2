import React from "react";
import { View, StyleSheet } from "react-native";
import { GiftedChat, Bubble, InputToolbar } from "react-native-gifted-chat";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import CustomActions from "./CustomActions";
import MapView from "react-native-maps";
// import * as Permissions from "expo-permissions";
// import * as ImagePicker from "expo-image-picker";
// import * as Location from "expo-location";

const firebase = require("firebase");
require("firebase/firestore");

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: "",
        name: "",
        avatar: "",
      },
      isConnected: false,
      image: null,
      location: null,
    };

    // SDK from Firestore
    const firebaseConfig = {
      apiKey: "AIzaSyDYRpIb5SujtQJl1hnRdZTqQXVtGI8Klf8",
      authDomain: "test-4608a.firebaseapp.com",
      projectId: "test-4608a",
      storageBucket: "test-4608a.appspot.com",
      messagingSenderId: "244804992228",
      appId: "1:244804992228:web:25af678d3945abc83100f1",
      measurementId: "G-M8E7Z4H1CQ",
    };

    // initializes the Firestore app
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // references the collection to query its documents
    this.referenceChatMessages = firebase.firestore().collection("messages");

    this.refMsgsUser = null;
  }

  async saveMessages() {
    try {
      await AsyncStorage.setItem(
        "messages",
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async getMessages() {
    let messages = "";
    try {
      messages = (await AsyncStorage.getItem("messages")) || [];
      this.setState({
        messages: JSON.parse(messages),
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem("messages");
      this.setState({
        messages: [],
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  componentDidMount() {
    //set name to name selected on start page
    let { name } = this.props.route.params;
    // Adds the name to top of screen
    this.props.navigation.setOptions({ title: name });

    //Check if the user is off- or online
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });
        console.log("online");
        // listens for updates in the collection
        this.unsubscribe = this.referenceChatMessages
          .orderBy("createdAt", "desc")
          .onSnapshot(this.onCollectionUpdate);

        //listen to authentication events, sign in anonymously
        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async (user) => {
            if (!user) {
              return await firebase.auth().signInAnonymously();
            }

            //update user state with currently active user data
            this.setState({
              uid: user.uid,
              messages: [],
              user: {
                _id: user.uid,
                name: name,
                avatar: "https://placeimg.com/140/140/any",
              },
            });

            //referencing messages of current user
            this.refMsgsUser = firebase
              .firestore()
              .collection("messages")
              .where("uid", "==", this.state.uid);
          });
        //save messages when online
        this.saveMessages();
      } else {
        // the user is offline
        this.setState({ isConnected: false });
        console.log("offline");
        //retrieve chat from asyncstorage
        this.getMessages();
      }
    });
  }

  // add a new message to the collection
  addMessages() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: this.state.user,
      image: message.image || "",
      location: message.location || null,
    });
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
        image: data.image || null,
        location: data.location || null,
      });
    });
    this.setState({
      messages: messages,
    });
    this.saveMessages();
  };

  // stop listening to authentication and collection changes
  componentWillUnmount() {
    if (this.state.isConnected) {
      // stop listening to authentication
      this.authUnsubscribe();
      // stop listening for changes
      this.unsubscribe();
    }
  }

  // Make sure messages are sent
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessages();
        this.saveMessages();
      }
    );
  }

  // handles the background color of the chat bubbles
  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "blue",
          },
          left: {
            backgroundColor: "gray",
          },
        }}
      />
    );
  }

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return <InputToolbar {...props} />;
    }
  }

  renderCustomActions(props) {
    return <CustomActions {...props} />;
  }

  //custom map view
  renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      );
    }
    return null;
  }

  // customizes system messages
  renderSystemMessage(props) {
    return (
      <SystemMessage
        {...props}
        textStyle={{
          color: "#2f574e",
        }}
      />
    );
  }

  render() {
    //Set bgcolor to color selected on start page
    let bgColor = this.props.route.params.bgColor;
    return (
      <View style={styles.container}>
        <View
          style={{
            backgroundColor: bgColor,
            width: "100%",
            height: "100%",
          }}
        >
          <View style={styles.giftedChat}>
            <GiftedChat
              messages={this.state.messages}
              onSend={(messages) => this.onSend(messages)}
              renderBubble={this.renderBubble.bind(this)}
              renderSystemMessage={this.renderSystemMessage}
              renderDay={this.renderDay}
              renderActions={this.renderCustomActions}
              renderInputToolbar={this.renderInputToolbar.bind(this)}
              renderCustomView={this.renderCustomView}
              user={{
                _id: this.state.user._id,
                name: this.state.name,
                avatar: this.state.user.avatar,
              }}
            />

            {Platform.OS === "android" ? (
              <KeyboardAvoidingView behavior="height" />
            ) : null}
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  giftedChat: {
    flex: 1,
    width: "100%",
    paddingBottom: 10,
    justifyContent: "center",
    borderRadius: 5,
  },
});
