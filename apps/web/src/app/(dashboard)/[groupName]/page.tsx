'use client';

import React, { useEffect, useContext } from 'react';
import { View, Text } from 'react-native';
import { GroupScreen } from 'shared-ui/screens';
import { useAppSelector, RootState } from 'shared-ui/redux';
import { ActiveGroupContext } from 'shared-ui/providers';

type GroupPageProps = {
    params: { groupName: string };
};

export const GroupPage: React.FC<GroupPageProps> = ({ params }) => {
    const { groupName } = params;
    const userGroups = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );
    const { setActiveGroup } = useContext(ActiveGroupContext);

    // Find the group matching the URL parameter (case insensitive)
    const group = userGroups.find(
        (g) => g.name.toLowerCase() === groupName.toLowerCase()
    );

    // When the group is found, set it as active in context
    useEffect(() => {
        if (group) {
            setActiveGroup(group);
        }
    }, [group, setActiveGroup]);

    // If the group isn’t found, show an error
    if (!group) {
        return (
            <View style={{ padding: 20 }}>
                <Text style={{ color: 'white' }}>Group not found</Text>
            </View>
        );
    }

    return <GroupScreen />;
};

export default GroupPage;
