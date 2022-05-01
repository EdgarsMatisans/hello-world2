// import * as firebase from "firebase";
// import "firebase/firestore";
import React from "react";
import { View, Text, Button, TextInput, StyleSheet } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { createStackNavigator } from "@react-navigation/stack";
import * as firebase from "firebase/compat";
import "firebase/compat/firestore";

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

  // creates the initial welcome message and the system message when component did mount
  componentDidMount() {
    let { name } = this.props.route.params;
    this.props.navigation.setOptions({ title: name });

    this.referenceChatMessages = firebase.firestore().collection("messages");

    // listens for updates in the collection
    this.unsubscribe = this.referenceChatMessages
      .orderBy("createdAt", "desc")
      .onSnapshot(this.onCollectionUpdate);

    // listens to authentication
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        return await firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        messages: [],
        user: {
          _id: user.uid,
          name: name,
          avatar: "https://placeimg.com/140/140/any",
        },
      });
      // referencing messages of current user
      this.refMsgsUser = firebase
        .firestore()
        .collection("messages")
        .where("uid", "==", this.state.uid);
    });
  }

  componentWillUnmount() {
    // stop listening for changes
    this.unsubscribe();
  }

  /* retrieves the current data in "messages" collection and 
  stores it in state "messages" to render it in view */
  onCollectionUpdate = (QuerySnapshot) => {
    const messages = [];
    // go through each document
    QuerySnapshot.forEach((doc) => {
      // gets the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
      });
    });
    this.setState({
      messages,
    });
  };

  addMessages() {
    const message = this.state.messages[0];
    // adds new message to the collection
    this.referenceChatMessages.add({
      uid: this.state.uid,
      _id: message._id,
      text: message.text || "",
      createdAt: message.createdAt,
      user: this.state.user,
    });
  }

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

  render() {
    return (
      <View style={{ flex: 1 }}>
        <GiftedChat
          renderSystemMessage={this.renderSystemMessage}
          renderDay={this.renderDay}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
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
    );
  }
}
