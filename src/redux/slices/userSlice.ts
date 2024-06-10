/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { User } from '../../types';
import type { AppThunk } from '../store'; // Import the AppThunk type for dispatch

const TOKEN_KEY = 'userToken';

type UserType = User | undefined;
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
            await SecureStore.setItemAsync(TOKEN_KEY, user.token);
            dispatch(setUser(user));
        } catch (error) {
            console.error('Error storing the token', error);
        }
    };

// eslint-disable-next-line unicorn/consistent-function-scoping
export const logoutUser = (): AppThunk => async (dispatch) => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        dispatch(removeUser());
    } catch (error) {
        console.error('Error removing the token', error);
    }
};

export const userReducer = userSlice.reducer;
