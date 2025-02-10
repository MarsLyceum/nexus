// PostScreen.tsx
import React, { useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { PostItem, CommentThread, CommentNode } from '../sections'; // Adjust the path as needed
import { COLORS } from '../constants';
import { CreateContentButton } from '../buttons';

type Post = {
    user: string;
    time: string;
    title: string;
    flair: string;
    upvotes: number;
    commentsCount: number;
    content: string;
};

type RootStackParamList = {
    PostScreen: { post: Post };
};

type PostScreenProps = {
    navigation: NavigationProp<RootStackParamList, 'PostScreen'>;
    route: RouteProp<RootStackParamList, 'PostScreen'>;
};

type PostData = {
    user: string;
    time: string;
    title: string;
    flair: string;
    upvotes: number;
    commentsCount: number;
    content: string;
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
    mainContainer: { flex: 1 },
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
});

export const PostScreen: React.FC<PostScreenProps> = ({
    route,
    navigation,
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { post: feedPost } = route.params;
    const postData: PostData = {
        user: feedPost.user,
        time: feedPost.time,
        title: feedPost.title,
        flair: '',
        upvotes: feedPost.upvotes,
        commentsCount: feedPost.commentsCount,
        content: feedPost.content,
    };

    // Initial comments data.
    const [comments, setComments] = useState<CommentNode[]>([
        {
            id: 'comment-1',
            user: 'myersthekid',
            time: '6h',
            upvotes: 107,
            content:
                "I hear people all the time say they've done a 360 in their life instead of a 180. Haha",
            children: [
                {
                    id: 'comment-2',
                    user: 'FrostySand8997',
                    time: '5h',
                    upvotes: 30,
                    content:
                        'This trashy girl once told me and my wife that she did a 380. We still laugh about her dumb ass 20 years later... so u spun around all the way plus a little bit?',
                    children: [
                        {
                            id: 'comment-3',
                            user: 'myersthekid',
                            time: '5h',
                            upvotes: 12,
                            content:
                                'Okay, but a 380 is actually super impressive hahaha',
                            children: [],
                        },
                    ],
                },
            ],
        },
    ]);

    // State for new comment creation
    const [modalVisible, setModalVisible] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');

    const handleCreateComment = () => {
        if (newCommentContent.trim() !== '') {
            const newComment: CommentNode = {
                id: `comment-new-${Date.now()}`,
                user: 'currentUser',
                time: 'Just now',
                upvotes: 0,
                content: newCommentContent,
                children: [],
            };
            setComments((prevComments) => [newComment, ...prevComments]);
            setNewCommentContent('');
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
                        <PostItem
                            user={postData.user}
                            time={postData.time}
                            title={postData.title}
                            content={postData.content}
                            upvotes={postData.upvotes}
                            commentsCount={postData.commentsCount}
                            flair={postData.flair}
                            onBackPress={() => navigation.goBack()}
                        />
                        {comments.map((c) => (
                            <CommentThread key={c.id} comment={c} level={0} />
                        ))}
                    </ScrollView>
                    <CreateContentButton
                        modalVisible={modalVisible}
                        setModalVisible={setModalVisible}
                        contentText={newCommentContent}
                        setContentText={setNewCommentContent}
                        handleCreate={handleCreateComment}
                        buttonText="Write a comment..."
                    />
                </View>
            </ContainerComponent>
        </SafeAreaView>
    );
};
