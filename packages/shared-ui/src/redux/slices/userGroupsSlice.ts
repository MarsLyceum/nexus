import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group } from '../../types';
import type { AppThunk } from '../store';
import { setItem, getItem } from '../../utils';

const USER_GROUPS_KEY = 'userGroups';

// Updated type to a conventional array of Group.
export type UserGroupsType = Group[];
type UserGroupsState = { userGroups: UserGroupsType };

const initialState: UserGroupsState = {
    userGroups: [],
};

export const userGroupsSlice = createSlice({
    name: 'userGroups',
    initialState,
    reducers: {
        setUserGroups: (state, action: PayloadAction<UserGroupsType>) => {
            state.userGroups = action.payload;
        },
    },
});

export const { setUserGroups } = userGroupsSlice.actions;

export const retrieveUserGroups =
    (userGroups: UserGroupsType): AppThunk =>
    async (dispatch) => {
        try {
            await setItem(USER_GROUPS_KEY, JSON.stringify(userGroups));
            dispatch(setUserGroups(userGroups));
        } catch (error) {
            console.error('Error storing the user groups', error);
        }
    };

export const loadUserGroups = (): AppThunk => async (dispatch) => {
    try {
        const storedGroups = await getItem(USER_GROUPS_KEY);
        if (storedGroups) {
            const userGroups = JSON.parse(storedGroups) as UserGroupsType;
            dispatch(setUserGroups(userGroups));
        }
    } catch (error) {
        console.error('Error fetching the user groups', error);
    }
};

export const userGroupsReducer = userGroupsSlice.reducer;
