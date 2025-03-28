import React, { useEffect } from 'react';
import { useAppDispatch, loadUser } from '@shared-ui/redux';

export const Login: React.FC<{ children: React.ReactNode }> = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    return <>{children}</>;
};
