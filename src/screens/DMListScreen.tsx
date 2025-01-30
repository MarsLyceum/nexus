import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const users = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'David' },
    { id: '5', name: 'Eve' },
];

export const DMListScreen = ({ navigation }) => {
    return (
        <View style={styles.sidebar}>
            <Text style={styles.title}>Direct Messages</Text>
            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.userItem}
                        onPress={() =>
                            navigation.navigate('Chat', { user: item })
                        }
                    >
                        <Icon
                            name="user-circle"
                            size={24}
                            color="white"
                            style={styles.icon}
                        />
                        <Text style={styles.userName}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        flex: 1,
        backgroundColor: '#2C2F33',
        paddingTop: 50,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    userName: {
        fontSize: 16,
        color: 'white',
        marginLeft: 10,
    },
    icon: {
        marginRight: 10,
    },
});
