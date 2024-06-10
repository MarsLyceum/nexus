import combineProviders from './combineProviders';
import { UserProvider } from './providers';

export const CombinedProvider = combineProviders([UserProvider]);
