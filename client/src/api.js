import axios from 'axios';

// Detect the API URL based on the environment
const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://yess-disposal-api.onrender.com'
  : 'http://localhost:5001';

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Variables to handle simultaneous requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// -------------------------------------------------------------
// REQUEST INTERCEPTOR (Attach Access Token)
// -------------------------------------------------------------
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Supports Axios v1.x+ headers.set() and legacy objects
      if (config.headers?.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------------------------------
// RESPONSE INTERCEPTOR (Catch 401/403 & Trigger Refresh)
// -------------------------------------------------------------
// instance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // 🔍 STEP-BY-STEP DIAGNOSTIC LOGS
//     // console.log('--- INTERCEPTOR DEBUG ---');
//     // console.log('1. Failed Request URL:', originalRequest?.url);
//     // console.log('2. HTTP Status Code:', error.response?.status);
//     // console.log('3. Refresh Token in LocalStorage:', localStorage.getItem('refreshToken'));

//     if (!originalRequest) {
//       return Promise.reject(error);
//     }

//     const requestUrl = originalRequest.url || '';
//     const isAuthEndpoint =
//       requestUrl.includes('/auth/login') ||
//       requestUrl.includes('/auth/register') ||
//       requestUrl.includes('/auth/refresh');

//     if (isAuthEndpoint) {
//     //  console.log('-> Skipped: Request is an auth endpoint');
//       return Promise.reject(error);
//     }

//     const status = error.response?.status;
//     if ((status === 401 || status === 403) && !originalRequest._retry) {
//     //  console.log('-> Status matched 401/403. Preparing refresh...');
//       originalRequest._retry = true;

//       if (isRefreshing) {
//       //  console.log('-> Refresh already in progress. Queueing request...');
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             if (originalRequest.headers?.set) {
//               originalRequest.headers.set('Authorization', `Bearer ${token}`);
//             } else {
//               originalRequest.headers.Authorization = `Bearer ${token}`;
//             }
//             return instance(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       isRefreshing = true;

//       const refreshToken = localStorage.getItem('refreshToken');

//       if (!refreshToken) {
//        // console.error('-> STOPPED: No refreshToken key found in localStorage!');
//         localStorage.clear();
//         window.location.href = '/login';
//         return Promise.reject(error);
//       }

//       //console.log('-> CALLING /refresh ENDPOINT NOW...');

//       try {
//         const { data } = await axios.post(
//           `${API_BASE_URL}/api/auth/refresh`,
//           { refreshToken },
//           { withCredentials: true }
//         );

//        // console.log('-> REFRESH SUCCESSFUL!', data);
//         const newAccessToken = data.accessToken;
//         const newRefreshToken = data.refreshToken;

//         if (newAccessToken) localStorage.setItem('token', newAccessToken);
//         if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

//         if (instance.defaults.headers.common) {
//           instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
//         }

//         if (originalRequest.headers?.set) {
//           originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
//         } else {
//           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         }

//         processQueue(null, newAccessToken);

//         return instance(originalRequest);
//       } catch (refreshError) {
//        // console.error('-> REFRESH FAILED:', refreshError);
//         processQueue(refreshError, null);
//         localStorage.clear();
//         window.location.href = '/login?session=expired';
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//   //  console.log('-> Skipped: Status was not 401 or 403 (or request was already retried)');
//     return Promise.reject(error);
//   }
// );
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Check if the request URL is a public auth route
    const requestUrl = config.url || '';
    const isPublicAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    // Only attach the Bearer token if it exists AND it's not a public auth route
    if (token && !isPublicAuthEndpoint) {
      if (config.headers?.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;