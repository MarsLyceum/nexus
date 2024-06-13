import axios from 'axios';

const requestQuota = 100;
let requestCount = 0;

/** This will prevent spamming GCP with requests which will help keep our
 * budget down. It will also help protect against DoS attacks.
 */
export const setupAxiosQuotas = () => {
    axios.interceptors.request.use(
        (config) => {
            if (requestCount < requestQuota) {
                requestCount += 1;
                return config;
            }
            console.error('Request quota exceeded');
            return Promise.reject(new Error('Request quota exceeded'));
        },
        (error) => Promise.reject(error)
    );
};
