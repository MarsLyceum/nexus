import { ThunkAction, Action } from '@reduxjs/toolkit';

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;
