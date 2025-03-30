import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Group } from '../../types';
import type { AppThunk } from '../store';

// Import caching utilities.
import { setItem, getItem } from './storageUtil';

const USER_GROUPS_KEY = 'userGroups';

export type UserGroupsType = [Group] | [];
type UserGroupsState = { userGroups: UserGroupsType };
const initialState: UserGroupsState = {
    userGroups: [],
};

export const userGroupsSlice = createSlice({
    name: 'userGroups',
    initialState,
    reducers: {
        setUserGroups: (state, action: PayloadAction<UserGroupsType>) => {
            // eslint-disable-next-line no-param-reassign
            state.userGroups = action.payload;
        },
    },
});

export const { setUserGroups } = userGroupsSlice.actions;

export const retrieveUserGroups =
    (userGroups: UserGroupsType): AppThunk =>
    async (dispatch) => {
        try {
            // Cache user groups in local storage.
            await setItem(USER_GROUPS_KEY, JSON.stringify(userGroups));
            dispatch(setUserGroups(userGroups));
        } catch (error) {
            console.error('Error storing the user groups', error);
        }
    };

// New thunk to load user groups from local storage.
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
