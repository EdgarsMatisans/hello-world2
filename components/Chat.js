// import * as firebase from "firebase";
// import "firebase/firestore";
import React from "react";
import { View, Text, Button, TextInput, StyleSheet } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { createStackNavigator } from "@react-navigation/stack";
import * as firebase from "firebase/compat";
import "firebase/compat/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

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

  //retrieve messsages asynchronious trough asyncstorage
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
  //function to save message in asynstorage
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
  //function to delet message in asynstorage
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
    //  takes the entered username from start.js assigned to a variable "name"
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });

    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });
        console.log("online");
        // listens for updates in the collection
        this.unsubscribe = this.referenceMessages
          .orderBy("createdAt", "desc")
          .onSnapshot(this.onCollectionUpdate);

        // user authentication
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

            //messages for current user
            this.refMsgsUser = firebase
              .firestore()
              .collection("messages")
              .where("uid", "==", this.state.uid);
          });

        // save messages locally
        this.saveMessages();
      } else {
        // if the user is offline
        this.setState({ isConnected: false });
        console.log("offline");
        this.getMessages();
      }
    });
  }
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
        image: data.image,
        location: data.locationl,
      });
    });
    this.setState({
      messages: messages,
    });

    this.saveMessages();
  };

  addMessages() {
    // add a new message + user data  to the messages collection
    const message = this.state.messages[0];
    this.referenceMessages.add({
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      user: this.state.user,
      image: message.image,
      location: message.location,
    });
  }

  //this function adds new chat messages to the state
  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.saveMessages();
      }
    );
  }

  componentWillUnmount() {
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.unsubscribe();
        this.authUnsubscribe();
      }
    });
  }
  //changes how the chat bar is rendered
  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return <InputToolbar {...props} />;
    }
  }

  render() {
    // takes the input parameters of background color defined in the start.js component

    let bgColor = this.props.route.params.bgColor;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bgColor,
        }}
      >
        <GiftedChat
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          renderActions={this.renderCustomActions}
          user={{
            _id: this.state.user._id,
            name: this.state.name,
            avatar: this.state.user.avatar,
          }}
        />

        {/* this fixes android keyboard */}
        {Platform.OS === "android" ? (
          <KeyboardAvoidingView behavior="height" />
        ) : null}
      </View>
    );
  }
}
