import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useLayoutEffect, useState } from 'react';
import { Avatar } from 'react-native-elements';
import { deafultPicURL } from '../utils';
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import { addDoc, collection, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';



const ChatScreen = ( { navigation, route }) => {
    if(route.params.id === auth.currentUser.uid) {
        // Это экран профиля пользователя
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Avatar source={{uri: auth.currentUser.photoURL}} size="xlarge" />
                <Text style={{ marginTop: 10, fontSize: 20 }}>
                    {auth.currentUser.displayName}
                </Text>
                <Text>{auth.currentUser.email}</Text>
            </View>
        );
    }
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);


    useLayoutEffect(() => {
        if(route.params.id === auth.currentUser.uid) {
            navigation.setOptions({
                title: "My Profile"
            });
        }
    navigation.setOptions({
       title: "Chat",
       headerTitleAlign: "left",
       // Только iOS
       headerBackTitleVisible: false,
       headerTitle: () => (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Avatar rounded source={{
                uri: messages[messages.length-1]?.data.photoUrl || deafultPicURL
              }}/>
            <Text style={{ color: "white", marginLeft: 10, fontWeight: "700"}}>{route.params.chatName}</Text>
          </View>),
        headerLeft: () => (
          <TouchableOpacity style={{ marginLeft: 10 }}
            onPress={ navigation.goBack }>
            <AntDesign name="arrowleft" size={24} color="white"/>
          </TouchableOpacity>
        ),
        headerRight: () => (
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: 80, 
              marginRight: 20,
            }}>
              <TouchableOpacity>
                  <FontAwesome name="video-camera" size={24} color="white"/>
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="call" size={24} color="white"/>
              </TouchableOpacity>
            </View>
        )
    })
  }, [navigation, messages]);

  const sendMessage = () => {
    Keyboard.dismiss();
    const docRef = addDoc(
      collection(db, "chats", route.params.id, "messages"),{
      timestamp: serverTimestamp(),
      message: input,
      displayName: auth.currentUser.displayName,
      email: auth.currentUser.email,
      photoUrl: auth.currentUser.photoURL
   }).then(() => {
      setInput("");
   }).catch((error) => alert(error.message))
  };

  useLayoutEffect(() => {
        const q = query(collection(db, "chats", route.params.id, "messages"), 
        orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (querySnaphots) => {
            const messages = [];
            querySnaphots.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            setMessages(messages);
            console.log(messages);
        });
        return unsubscribe;
  }, [route]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar style='light'/>
      <KeyboardAvoidingView
        behavior={ Platform.OS === "ios" ? "padding" : "height" }
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={{paddingTop: 15}}>
            {messages.map(({id, data}) => (
                // Проверяем, принадлежит ли сообщение текущему пользователю
                data.email === auth.currentUser.email ? (
                    <View key={id} style={styles.userMessage}>
                        <TouchableOpacity onLongPress={() => deleteMessage(id)}>
                            <Avatar
                                rounded
                                source={{ uri: data.photoUrl }}
                                // ...
                            />
                            <Text style={styles.userText}>{data.message}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                <View key={id} style={styles.senderMessage}>
                  <Text style={styles.senderText}>{data.message}</Text>
                  <Text style={styles.senderName}>{data.displayName}</Text>
                  <Avatar rounded 
                  source={{uri: data.photoUrl}}
                  // WEB
                  containerStyle={{
                    position: "absolute",
                    bottom: -15,
                    left: -5,
                  }}
                  position="absolute"
                  bottom={-15}
                  left={-5}
                  size={30} />
                </View>
             )
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <TextInput value={input} onChangeText={(text) => setInput(text)} 
          placeholder='Message...' style={styles.textInput}/>
          <TouchableOpacity onPress={sendMessage} activeOpacity={0.5}>
            <Ionicons name="send" size={24} color="#017c13"/>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const deleteMessage = async (id) => {
    const messageRef = collection(db, "chats", route.params.id, "messages").doc(id);
    const messageDoc = await messageRef.get();
    if (messageDoc.exists && messageDoc.data().email === auth.currentUser.email) {
        messageRef.delete().catch(error => console.error("Error removing message: ", error));
    }
}
export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userMessage: {
    padding: 15,
    backgroundColor: '#ECECEC',
    alignSelf: "flex-end",
    borderRadius: 20,
    marginRight: 15, 
    marginBottom: 20,
    maxWidth: "80%",
    position: "relative",
  },

  senderMessage: {
    padding: 15,
    backgroundColor: "#01a81a",
    alignSelf: "flex-start",
    borderRadius: 20,
    margin: 15,
    maxWidth: "80%",
    position: "relative",
  },
  senderName: {
    left: 10, 
    paddingRight: 10,
    fontSize: 10,
    color: "white",
  },
  senderText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 10,
    marginBottom: 15,
  },
  userText: {
    color: "black",
    fontWeight: "500",
    marginLeft: 10,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 15,
  }, 
  textInput: {
    bottom: 0,
    height: 40,
    flex: 1, 
    marginRight: 15,
    borderColor: "#ECECEC",
    borderWidth: 1,
    padding: 10,
    color: "grey",
    borderRadius: 30,
  },
});