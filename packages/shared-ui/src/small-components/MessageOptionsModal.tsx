import React, { useRef, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme, Theme } from '../theme';
import { Edit, MoreHorizontal } from '../icons';

import { Tooltip } from './Tooltip';
import { MiniModal } from './MiniModal';
import { getShadowStyle } from '../utils';
import { registerStableHoverMember } from '../utils/stableHoverGroup';
import { Spacing, BorderRadius, Typography } from '../constants/designSystem';

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
    onMouseLeaveModal?: (event: React.MouseEvent<HTMLDivElement>) => void;
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
            blockOutsideClicks={false}
            closeOnOutsideClick={false}
            useRightAnchorAlignment
            onMouseEnter={onMouseEnterModal}
            onMouseLeave={onMouseLeaveModal}
        >
            <View
                style={styles.outerContainer}
                ref={(element) => {
                    if (element instanceof Element) {
                        registerStableHoverMember(element);
                    }
                }}
            >
                <View style={styles.iconsRow}>
                    <Tooltip text="Like">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                }
                            }}
                        >
                            <Text style={styles.emoji}>👍</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="100">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                }
                            }}
                        >
                            <Text style={styles.emoji}>💯</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Laugh">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                }
                            }}
                        >
                            <Text style={styles.emoji}>😆</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Neutral">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                }
                            }}
                        >
                            <Text style={styles.emoji}>😐</Text>
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Edit">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                }
                            }}
                            onPress={onEdit}
                        >
                            <Edit />
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="Share">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                }
                            }}
                        >
                            <ArrowIcon theme={theme} />
                        </TouchableOpacity>
                    </Tooltip>

                    <Tooltip text="More">
                        <TouchableOpacity
                            style={styles.iconWrapper}
                            ref={(element) => {
                                if (element instanceof Element) {
                                    registerStableHoverMember(element);
                                    moreButtonRef.current = element;
                                } else if (element === null) {
                                    moreButtonRef.current = null;
                                }
                            }}
                            onPress={handleMorePress}
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
            borderRadius: BorderRadius.ExtraSmall,
            paddingVertical: Spacing.SM,
            paddingHorizontal: Spacing.MD,
            ...getShadowStyle('medium'),
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
            padding: Spacing.XS,
        },
        emoji: {
            ...Typography.SectionHeading,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.ActiveText,
        },
    });
}
