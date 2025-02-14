// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Group } from '../../types';
import type { AppThunk } from '../store';

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
            state.userGroups = action.payload;
        },
    },
});

export const { setUserGroups } = userGroupsSlice.actions;

export const retrieveUserGroups =
    (userGroups: UserGroupsType): AppThunk =>
    async (dispatch) => {
        try {
            dispatch(setUserGroups(userGroups));
        } catch (error) {
            console.error('Error storing the user groups', error);
        }
    };

export const userGroupsReducer = userGroupsSlice.reducer;
