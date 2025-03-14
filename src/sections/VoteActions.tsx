import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { ActionButton } from '../small-components/ActionButton';
import { COLORS } from '../constants';

type VoteActionsProps = {
    voteCount: number;
    onUpvote: () => void;
    onDownvote: () => void;
    // optional props for displayed counts
    commentCount?: number;
    shareCount?: number;
    // If 'compact' is true, we skip some fields (like commentCount).
    compact?: boolean;
};

export const VoteActions: React.FC<VoteActionsProps> = ({
    voteCount,
    onUpvote,
    onDownvote,
    commentCount,
    shareCount,
    compact = false,
}) => (
    <View style={styles.container}>
        {/* Upvote */}
        <View style={styles.buttonGroup}>
            <ActionButton
                onPress={onUpvote}
                tooltipText="Up vote"
                transparent
                style={styles.voteButton}
            >
                <Icon name="arrow-up" size={18} color={COLORS.MainText} />
            </ActionButton>
            <Text style={styles.countText}>{voteCount}</Text>
        </View>

        {/* Downvote */}
        <ActionButton
            onPress={onDownvote}
            tooltipText="Down vote"
            transparent
            style={[styles.voteButton, styles.singleButton]}
        >
            <Icon name="arrow-down" size={18} color={COLORS.MainText} />
        </ActionButton>

        {/* Comment button */}
        {!compact && commentCount !== undefined && (
            <View style={styles.buttonGroup}>
                <ActionButton
                    onPress={() => {}}
                    tooltipText="Comments"
                    transparent
                    style={styles.voteButton}
                >
                    <Icon
                        name="comment-alt"
                        size={18}
                        color={COLORS.MainText}
                    />
                </ActionButton>
                <Text style={styles.countText}>{commentCount}</Text>
            </View>
        )}

        {/* Share button */}
        {!compact && shareCount !== undefined && (
            <View style={styles.buttonGroup}>
                <ActionButton
                    onPress={() => {}}
                    tooltipText="Share"
                    transparent
                    style={styles.voteButton}
                >
                    <Icon name="share" size={18} color={COLORS.MainText} />
                </ActionButton>
                <Text style={styles.countText}>{shareCount}</Text>
            </View>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Container for pairing a button with its count text.
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    // Vote button style with 15% reduced dimensions.
    voteButton: {
        width: 45, // 48 * 0.85 ≈ 41
        height: 45,
        borderRadius: 23, // 24 * 0.85 ≈ 20
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Optional style to add spacing after single buttons if needed.
    singleButton: {
        marginRight: 8,
    },
    countText: {
        color: COLORS.MainText,
        marginLeft: 4,
        fontSize: 13,
    },
});
