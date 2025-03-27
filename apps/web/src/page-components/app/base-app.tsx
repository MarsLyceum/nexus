// apps/web/pages/app/base-app.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS, SIDEBAR_WIDTH } from '@shared-ui/constants';
import { SidebarScreen } from '@shared-ui/src/screens/SidebarScreen';

export interface BaseAppScreenProps {
    isDesktop: boolean;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    simulatedNavigation: {
        navigate: (screenName: string) => void;
        toggleDrawer: () => void;
    };
    ActiveComponent: React.ComponentType<any> | null;
}

export const BaseAppScreen: React.FC<BaseAppScreenProps> = ({
    isDesktop,
    sidebarOpen,
    toggleSidebar,
    simulatedNavigation,
    ActiveComponent,
}) => {
    return (
        <View style={styles.container}>
            {/* Sidebar area */}
            <View
                style={[
                    styles.sidebar,
                    !isDesktop && { display: sidebarOpen ? 'flex' : 'none' },
                ]}
            >
                <SidebarScreen navigation={simulatedNavigation} />
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContent}>
                {/* Mobile header with hamburger button */}
                {!isDesktop && (
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={toggleSidebar}
                            style={styles.hamburger}
                        >
                            <FontAwesome name="bars" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.screenContainer}>
                    {ActiveComponent ? (
                        <ActiveComponent />
                    ) : (
                        <Text style={{ color: COLORS.White }}>
                            No screen found
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: '100vh', // Fills the viewport height on web
        flexDirection: 'row',
        backgroundColor: COLORS.AppBackground,
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        backgroundColor: COLORS.AppBackground,
        paddingTop: 20,
        paddingHorizontal: 10,
    },
    mainContent: {
        flex: 1,
        backgroundColor: COLORS.PrimaryBackground,
    },
    header: {
        height: 60,
        backgroundColor: COLORS.AppBackground,
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    hamburger: {
        width: 30,
        height: 30,
    },
    screenContainer: {
        flex: 1,
    },
});
