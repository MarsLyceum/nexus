// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { User } from '../../types';
import type { AppThunk } from '../store';

import { setItem, getItem, deleteItem } from './storageUtil';

const USER_KEY = 'user';

export type UserType = User | undefined;
type UserState = { user: UserType };
const initialState: UserState = {
    user: undefined,
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserType>) => {
            state.user = action.payload;
        },
        removeUser: (state) => {
            state.user = undefined;
        },
    },
});

export const { setUser, removeUser } = userSlice.actions;

export const loginUser =
    (user: User): AppThunk =>
    async (dispatch) => {
        try {
            await setItem(USER_KEY, JSON.stringify(user));
            dispatch(setUser(user));
        } catch (error) {
            console.error('Error storing the token', error);
        }
    };

// eslint-disable-next-line unicorn/consistent-function-scoping
export const loadUser = (): AppThunk => async (dispatch) => {
    try {
        const userData = await getItem(USER_KEY);
        if (userData) {
            const user = JSON.parse(userData) as User;
            dispatch(setUser(user));
        }
    } catch (error) {
        console.error('Error fetching the user', error);
    }
};

// eslint-disable-next-line unicorn/consistent-function-scoping
export const logoutUser = (): AppThunk => async (dispatch) => {
    try {
        await deleteItem(USER_KEY);
        dispatch(removeUser());
    } catch (error) {
        console.error('Error removing the token', error);
    }
};

export const userReducer = userSlice.reducer;
