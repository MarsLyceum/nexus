import React, { useState, useMemo } from 'react';
import {
    SafeAreaView,
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Text,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';

import { useTheme, Theme } from '../theme';
import { EventCard } from '../cards';
import { CreateContentButton } from '../buttons';
import { Attachment } from '../types';
import { CommentThread, CommentNode } from '../sections';
import { useAppSelector, RootState, UserType } from '../redux';
import { CreateEventCommentModal } from '../small-components';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { NexusScrollView } from '../styles';

type EventDetails = {
    id: string;
    title: string;
    dateTime: string;
    groupName: string;
    postedByUser: {
        username: string;
    };
    attendees: number;
    location: string;
    imageUrl: string;
    description?: string;
};

type RootStackParamList = {
    'event-details': { event: EventDetails };
};

type EventDetailsScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'event-details'>;
    route: RouteProp<RootStackParamList, 'event-details'>;
};

const BOTTOM_INPUT_HEIGHT = 60;
const isWeb = Platform.OS === 'web';

function createStyles(theme: Theme) {
    return StyleSheet.create<{
        safeContainer: ViewStyle;
        container: ViewStyle;
        mainContainer: ViewStyle;
        scrollSection: ViewStyle;
        scrollView: ViewStyle;
        descriptionContainer: ViewStyle;
        descriptionText: TextStyle;
        createContentButtonContainer: ViewStyle;
    }>({
        safeContainer: {
            flex: 1,
            backgroundColor: theme.colors.SecondaryBackground,
            paddingTop: Spacing.LG,
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
            paddingHorizontal: Spacing.XL,
            paddingBottom: Spacing.XL,
        },
        descriptionContainer: {
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: BorderRadius.ExtraSmall,
            padding: Spacing.XL,
            marginVertical: Spacing.LG,
        },
        descriptionText: {
            color: theme.colors.ActiveText,
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
        },
        createContentButtonContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: BOTTOM_INPUT_HEIGHT,
        },
    });
}

export const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
    navigation,
    route,
}) => {
    const { event } = route.params;
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Comments state.
    const [comments, setComments] = useState<CommentNode[]>([]);
    const [newComment, setNewComment] = useState('');

    // State to control modal visibility.
    const [modalVisible, setModalVisible] = useState(false);
    const user: UserType = useAppSelector(
        (state: RootState) => state.user.user
    );

    // New state for attachments
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const handleCreateComment = () => {
        if (newComment.trim() !== '') {
            // @ts-expect-error broken for now
            const comment: CommentNode = {
                id: `comment-${Date.now()}`,
                user: user?.username ?? '',
                postedAt: Date.now().toString(),
                upvotes: 0,
                content: newComment,
                children: [],
            };
            setComments([comment, ...comments]);
            setNewComment('');
            setModalVisible(false);
        }
    };

    // Use a different container on web vs mobile.
    const ContainerComponent = isWeb ? View : KeyboardAvoidingView;
    const containerProps = isWeb
        ? { style: styles.container }
        : {
              style: styles.container,
              behavior:
                  Platform.OS === 'ios' ? ('padding' as const) : undefined,
          };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <ContainerComponent {...containerProps}>
                <View style={styles.mainContainer}>
                    <NexusScrollView
                        style={
                            styles.scrollSection as unknown as Record<
                                string,
                                unknown
                            >
                        }
                        contentContainerStyle={
                            styles.scrollView as unknown as Record<
                                string,
                                unknown
                            >
                        }
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
                            <CommentThread
                                key={c.id}
                                comment={c}
                                level={0}
                                opUser={event.postedByUser.username}
                                onContinueConversation={() => {}}
                            />
                        ))}
                    </NexusScrollView>
                    <View style={styles.createContentButtonContainer}>
                        <CreateContentButton
                            buttonText="Write a comment..."
                            onPress={() => setModalVisible(true)}
                        />
                    </View>
                </View>
            </ContainerComponent>
            <CreateEventCommentModal
                modalVisible={modalVisible}
                setModalVisible={setModalVisible}
                contentText={newComment}
                setContentText={setNewComment}
                handleCreate={handleCreateComment}
                buttonText="Write a comment..."
                attachments={attachments}
                setAttachments={setAttachments}
            />
        </SafeAreaView>
    );
};
