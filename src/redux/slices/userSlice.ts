/* eslint-disable no-param-reassign */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { User } from '../../types';

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
    },
});

export const { setUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
