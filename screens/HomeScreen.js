import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar } from 'react-native-elements';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import ChatListItem from '../components/ChatListItem';
import { Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { auth, db } from '../firebase';
import { collection, onSnapshot, where, query } from 'firebase/firestore';


const [search, setSearch] = useState('');
const [filteredChats, setFilteredChats] = useState(chats);
const HomeScreen = ({navigation}) => {
    // Отслеживаем и обрабатываем изменения списка чатов
    const [chats, setChats] = useState([]);

    // При выходе из учетки возвращаемся на экран Login
    const signOut = () => {
        auth.signOut().then(()=> {
            navigation.replace("Login");
        });
    };


    useEffect(() => {
        if (search === '') {
            setFilteredChats(chats);
        } else {
            setFilteredChats(chats.filter(chat => chat.data.chatName.toLowerCase().includes(search.toLowerCase())));
        }
        const q = query(collection(db, "chats"), where("chatName", '!=', ""));
        const unsubscribe = onSnapshot(q, (querySnaphots) => {
            const chats = [];
            querySnaphots.forEach((doc) => {
                chats.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            console.log(chats);
            setChats(chats);
        });
        return unsubscribe;
    }, [search, chats]);

    // Перед отрисовкой UI настраиваем содержимое верхней плашки
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "PolyChat",
            headerStyle : { backgroundColor: "#fff" },
            headerTitleStyle: {color: "black"},
            // Задаем разметку частей слева и справа от заголовка
            headerLeft: () => (
                <View style={{ marginLeft: 20 }}>
                    <TouchableOpacity activeOpacity={0.5} onPress={() => navigation.navigate("Chat", {
                        id: auth?.currentUser?.uid,
                        chatName: "My Profile"
                    })}>
                        <Avatar rounded source={{ uri: auth?.currentUser?.photoURL }}/>
                    </TouchableOpacity>
                </View>
            ),
            headerRight: () => (
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: 120,
                    marginRight: 20,
                }}>
                    <TouchableOpacity onPress={() => navigation.navigate("AddChat")} activeOpacity={0.5}>
                        <SimpleLineIcons name='pencil' size={24} color="black"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate("Home", { mode: 'search' })} activeOpacity={0.5}>
                        <Ionicons name='search' size={24} color="black"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={signOut} activeOpacity={0.5}>
                        <Ionicons name='exit' size={24} color="black"/>
                    </TouchableOpacity>
                </View>
            )
        })
    }, [navigation])

    if(navigation.getState().routes[navigation.getState().index].params?.mode === 'search') {
        // Это режим поиска в HomeScreen
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    <Input
                        placeholder="Search chats..."
                        value={search}
                        onChangeText={text => setSearch(text)}
                    />
                    <ScrollView>
                        {filteredChats.map( ({id, data: { chatName }}) => (
                            <ChatListItem key={id} id={id} chatName={chatName} enterChat={enterChat}/>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }

    // Переходим на экран чата; при этом передаем id и name выбранного чата,
    // чтобы на экране чата отобразить нужное содержимое
    const enterChat = (id, chatName) => {
        navigation.navigate("Chat", {id, chatName,})
    }
    return (

        <SafeAreaView>
            <ScrollView style={styles.container}>
                {/* Отображение списка чатов */}
                {chats.map(({ id, data: { chatName } }) => (
                    <ChatListItem key={id} id={id} chatName={chatName} enterChat={enterChat} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};


export default HomeScreen

const styles = StyleSheet.create({
    container: {
        height: "100%"
    }
})