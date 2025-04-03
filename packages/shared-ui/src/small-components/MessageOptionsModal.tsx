import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MiniModal } from './MiniModal';
import { COLORS } from '../constants';
import Svg, { Path } from 'react-native-svg';
import { Tooltip } from './Tooltip';

export type MessageOptionsModalProps = {
    visible: boolean;
    onClose: () => void;
    anchorPosition?: { x: number; y: number; width: number; height: number };
    onEdit: () => void;
    onMore: () => void;
    onMouseEnterModal?: () => void;
    onMouseLeaveModal?: () => void;
};

export const MessageOptionsModal: React.FC<MessageOptionsModalProps> = ({
    visible,
    onClose,
    anchorPosition,
    onEdit,
    onMore,
    onMouseEnterModal,
    onMouseLeaveModal,
}) => (
    <MiniModal
        visible={visible}
        onClose={onClose}
        anchorPosition={anchorPosition}
        containerStyle={styles.modalContainer}
        closeOnOutsideClick={false}
    >
        <View
            style={styles.outerContainer}
            onMouseEnter={onMouseEnterModal}
            onMouseLeave={onMouseLeaveModal}
        >
            <View style={styles.iconsRow}>
                <Tooltip tooltipText="Like">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onEdit}
                    >
                        <Text style={styles.emoji}>👍</Text>
                    </TouchableOpacity>
                </Tooltip>

                <Tooltip tooltipText="100">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onEdit}
                    >
                        <Text style={styles.emoji}>💯</Text>
                    </TouchableOpacity>
                </Tooltip>

                <Tooltip tooltipText="Laugh">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onEdit}
                    >
                        <Text style={styles.emoji}>😆</Text>
                    </TouchableOpacity>
                </Tooltip>

                <Tooltip tooltipText="Neutral">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onEdit}
                    >
                        <Text style={styles.emoji}>😐</Text>
                    </TouchableOpacity>
                </Tooltip>

                <Tooltip tooltipText="Edit">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onEdit}
                    >
                        <PencilIcon />
                    </TouchableOpacity>
                </Tooltip>

                <Tooltip tooltipText="Share">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onMore}
                    >
                        <ArrowIcon />
                    </TouchableOpacity>
                </Tooltip>

                <Tooltip tooltipText="More">
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        pointerEvents="auto"
                        onPress={onMore}
                    >
                        <EllipsisIcon />
                    </TouchableOpacity>
                </Tooltip>
            </View>
        </View>
    </MiniModal>
);

const PencilIcon: React.FC = () => {
    return (
        <Svg width={20} height={20} viewBox="0 0 512 512" fill="none">
            <Path
                d="M290.74 93.24l128 128L166.44 473.54 38.51 345.61 290.74 93.24m-45.25-45.25l-247 247a24 24 0 0 0-7 17v99a24 24 0 0 0 24 24h99a24 24 0 0 0 17-7l247-247z"
                fill="#fff"
            />
        </Svg>
    );
};

const ArrowIcon: React.FC = () => {
    return (
        <Svg width={20} height={20} viewBox="0 0 512 512" fill="none">
            <Path
                d="M256 64l-96 96h64v96h64v-96h64l-96-96zM96 256v128c0 17.7 14.3 32 32 32h256c17.7 0 32-14.3 32-32V256h-64v128H160V256H96z"
                fill="#fff"
            />
        </Svg>
    );
};

const EllipsisIcon: React.FC = () => {
    return (
        <Svg width={20} height={20} viewBox="0 0 100 25" fill="none">
            <Path
                d="M12.5 12.5C12.5 15.538 9.538 18.5 6.5 18.5S.5 15.538.5 12.5 3.462 6.5 6.5 6.5s6 2.962 6 6zM36.5 12.5c0 3.038-2.962 6-6 6s-6-2.962-6-6 2.962-6 6-6 6 2.962 6 6zm24 0c0 3.038-2.962 6-6 6s-6-2.962-6-6 2.962-6 6-6 6 2.962 6 6z"
                fill="#fff"
            />
        </Svg>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        width: 260,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    outerContainer: {
        // Letting mouse events bubble to capture modal hover events
    },
    iconsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconWrapper: {
        padding: 4,
    },
    emoji: {
        fontSize: 18,
        color: '#fff',
    },
});
