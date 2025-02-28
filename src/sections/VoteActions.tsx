import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { NexusTooltip } from '../small-components';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    countText: {
        color: '#bbb',
        marginLeft: 5,
        fontSize: 13,
    },
});

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
        <NexusTooltip tooltipText="Up vote">
            <TouchableOpacity onPress={onUpvote} style={styles.actionButton}>
                <Icon name="arrow-up" size={14} color="#bbb" />
                <Text style={styles.countText}>{voteCount}</Text>
            </TouchableOpacity>
        </NexusTooltip>

        {/* Downvote */}
        <NexusTooltip tooltipText="Down vote">
            <TouchableOpacity onPress={onDownvote} style={styles.actionButton}>
                <Icon name="arrow-down" size={14} color="#bbb" />
            </TouchableOpacity>
        </NexusTooltip>

        {/* Show comment count if not compact */}
        {!compact && commentCount !== undefined && (
            <View style={styles.actionButton}>
                <Icon name="comment-alt" size={14} color="#bbb" />
                <Text style={styles.countText}>{commentCount}</Text>
            </View>
        )}

        {/* Show share icon if shareCount is provided (or always if you like) */}
        {!compact && shareCount !== undefined && (
            <View style={styles.actionButton}>
                <Icon name="share" size={14} color="#bbb" />
                <Text style={styles.countText}>{shareCount}</Text>
            </View>
        )}
    </View>
);
