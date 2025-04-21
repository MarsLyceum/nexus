import React, { useRef, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme, Theme } from '../theme';
import { Edit, MoreHorizontal } from '../icons';

import { Tooltip } from './Tooltip';
import { MiniModal } from './MiniModal';

export type MessageOptionsModalProps = {
    visible: boolean;
    onClose: () => void;
    anchorPosition?: { x: number; y: number; width: number; height: number };
    onEdit: () => void;
    onMore: (anchor: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => void;
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
}) => {
    const moreButtonRef = useRef<View>(null);
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleMorePress = () => {
        if (moreButtonRef.current) {
            if (moreButtonRef.current.measureInWindow) {
                moreButtonRef.current.measureInWindow((x, y, width, height) => {
                    onMore({ x, y, width, height });
                });
            } else if (
                (moreButtonRef.current as unknown as Element)
                    .getBoundingClientRect
            ) {
                const rect = (
                    moreButtonRef.current as unknown as Element
                ).getBoundingClientRect();
                onMore({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                });
            }
        } else {
            onMore({ x: 0, y: 0, width: 0, height: 0 });
        }
    };

    return (
        <MiniModal
            visible={visible}
            onClose={onClose}
            anchorPosition={anchorPosition}
            containerStyle={styles.modalContainer}
            closeOnOutsideClick={false}
            useRightAnchorAlignment
            onMouseEnter={onMouseEnterModal}
            onMouseLeave={onMouseLeaveModal}
        >
            <View style={styles.outerContainer}>
                <View style={styles.iconsRow}>
                    <Tooltip text="Like">
                        <TouchableOpacity style={styles.iconWrapper}>
                            <Text style={styles.emoji}>👍</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="100">
                        <TouchableOpacity style={styles.iconWrapper}>
                            <Text style={styles.emoji}>💯</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Laugh">
                        <TouchableOpacity style={styles.iconWrapper}>
                            <Text style={styles.emoji}>😆</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Neutral">
                        <TouchableOpacity style={styles.iconWrapper}>
                            <Text style={styles.emoji}>😐</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Edit">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            onPress={onEdit}
                        >
                            <Edit />
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Share">
                        <TouchableOpacity style={styles.iconWrapper}>
                            <ArrowIcon theme={theme} />
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="More">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            onPress={handleMorePress}
                            ref={moreButtonRef}
                        >
                            <MoreHorizontal />
                        </TouchableOpacity>
                    </Tooltip>
                </View>
            </View>
        </MiniModal>
    );
};

const ArrowIcon = ({ theme }: { theme: Theme }) => (
    <Svg width={20} height={20} viewBox="0 0 512 512" fill="none">
        <Path
            d="M256 64l-96 96h64v96h64v-96h64l-96-96zM96 256v128c0 17.7 14.3 32 32 32h256c17.7 0 32-14.3 32-32V256h-64v128H160V256H96z"
            fill={theme.colors.ActiveText} // Updated to use palette
        />
    </Svg>
);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        modalContainer: {
            width: 260,
            backgroundColor: theme.colors.PrimaryBackground,
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 8,
            shadowColor: theme.colors.InactiveText,
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
            color: theme.colors.ActiveText,
        },
    });
}
