// EventDetailsScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Text,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { EventCard } from '../cards';
import { CreateContentButton } from '../buttons';
import { COLORS } from '../constants';
import { CommentThread, CommentNode } from '../sections';

type EventDetails = {
    id: string;
    title: string;
    dateTime: string;
    groupName: string;
    attendees: number;
    location: string;
    imageUrl: string;
    description?: string;
};

type RootStackParamList = {
    EventDetails: { event: EventDetails };
};

type EventDetailsScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'EventDetails'>;
    route: RouteProp<RootStackParamList, 'EventDetails'>;
};

const BOTTOM_INPUT_HEIGHT = 60;
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: COLORS.SecondaryBackground,
        paddingTop: 15,
        ...(isWeb && { height: '100vh', display: 'flex' }),
    },
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
    },
    scrollSection: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: BOTTOM_INPUT_HEIGHT,
              overflowY: 'auto',
          }
        : { flex: 1 },
    scrollView: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    descriptionContainer: {
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 15,
        marginVertical: 10,
    },
    descriptionText: {
        color: COLORS.White,
        fontSize: 14,
        lineHeight: 20,
    },
});

export const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
    navigation,
    route,
}) => {
    const { event } = route.params;

    // Comments state.
    const [comments, setComments] = useState<CommentNode[]>([]);
    const [newComment, setNewComment] = useState('');

    // State to control modal visibility.
    const [modalVisible, setModalVisible] = useState(false);

    const handleCreateComment = () => {
        if (newComment.trim() !== '') {
            const comment: CommentNode = {
                id: `comment-${Date.now()}`,
                user: 'currentUser',
                time: 'Just now',
                upvotes: 0,
                content: newComment,
                children: [],
            };
            setComments([comment, ...comments]);
            setNewComment('');
            setModalVisible(false);
        }
    };

    const ContainerComponent = isWeb ? View : KeyboardAvoidingView;
    const containerProps = isWeb
        ? { style: styles.container }
        : {
              style: styles.container,
              behavior: Platform.OS === 'ios' ? 'padding' : undefined,
          };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <ContainerComponent {...containerProps}>
                <View style={styles.mainContainer}>
                    <ScrollView
                        style={styles.scrollSection}
                        contentContainerStyle={styles.scrollView}
                        keyboardShouldPersistTaps="handled"
                    >
                        <EventCard
                            title={event.title}
                            dateTime={event.dateTime}
                            groupName={event.groupName}
                            attendees={event.attendees}
                            location={event.location}
                            imageUrl={event.imageUrl}
                            onBackPress={() => navigation.goBack()}
                        />
                        {event.description && (
                            <View style={styles.descriptionContainer}>
                                <Text style={styles.descriptionText}>
                                    {event.description}
                                </Text>
                            </View>
                        )}
                        {comments.map((c) => (
                            <CommentThread key={c.id} comment={c} level={0} />
                        ))}
                    </ScrollView>
                    <CreateContentButton
                        modalVisible={modalVisible}
                        setModalVisible={setModalVisible}
                        contentText={newComment}
                        setContentText={setNewComment}
                        handleCreate={handleCreateComment}
                        buttonText="Write a comment..."
                    />
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};
