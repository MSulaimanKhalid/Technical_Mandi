// ============================================================================
// AuthContext.jsx — Global authentication state for Technical Mandi.
//
// PURPOSE
//
// Authentication information is needed throughout the application:
//
//   - Navbar needs the logged-in user's name and logout function.
//   - ProtectedRoute needs to know whether the user is authenticated.
//   - LoginPage and SignupPage need login/signup functions.
//   - CartContext must wait until authentication has been restored.
//   - CheckoutPage and ProfilePage need the current user object.
//
// React Context allows all these components to access the same authentication
// state without passing props through every component between them.
//
// TOKEN FLOW
//
// The backend returns:
//
//   access token
//     - Included in the Authorization header.
//     - Usually expires after approximately 15 minutes.
//
//   refresh token
//     - Used by api.js to obtain another access token.
//     - Usually remains valid longer than the access token.
//
// api.js is responsible for:
//
//   1. Attaching the access token to requests.
//   2. Detecting an expired access token.
//   3. Calling the refresh endpoint.
//   4. Repeating the original request.
//   5. Dispatching `technical-mandi:unauthorized` only when the session can
//      no longer be refreshed.
//
// AuthContext is responsible for:
//
//   1. Restoring the user's profile when the application starts.
//   2. Saving access and refresh tokens after login.
//   3. Exposing signup, login and logout functions.
//   4. Clearing React authentication state after terminal session expiry.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import api, {
  ENDPOINTS,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  readAccessToken,
  readRefreshToken,
  setAuthTokens,
} from '../services/api';

// The default value is null so useAuth() can detect when it has accidentally
// been used outside <AuthProvider>.
const AuthContext = createContext(null);

// Some backend responses return the user directly:
//
// {
//   "id": 1,
//   "username": "Ali",
//   "email": "ali@example.com"
// }
//
// Other responses wrap it:
//
// {
//   "user": {
//     "id": 1,
//     "username": "Ali"
//   }
// }
//
// This helper supports both formats.
function extractUser(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload.user || payload;
}

export function AuthProvider({ children }) {
  // The currently authenticated user.
  //
  // null means no authenticated user has been restored or the user has logged
  // out.
  const [user, setUser] = useState(null);

  // While this is true, ProtectedRoute displays a loading indicator instead
  // of immediately redirecting to /login.
  //
  // This prevents a logged-in user from briefly seeing the login page while
  // the application verifies their saved session.
  const [initializing, setInitializing] = useState(true);

  // Optional global authentication message.
  //
  // LoginPage may show its own validation errors, while this value is useful
  // for session-expiry information.
  const [authError, setAuthError] = useState(null);

  // --------------------------------------------------------------------------
  // Restore the saved authentication session when the application starts.
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    // api.js dispatches this event only when:
    //
    //   - the access token has expired, and
    //   - the refresh token is missing, invalid or expired, or
    //   - the refresh endpoint rejects the request.
    //
    // A normal access-token expiry that is successfully refreshed does not
    // trigger this event.
    function handleUnauthorized() {
      if (cancelled) {
        return;
      }

      setUser(null);
      setInitializing(false);
      setAuthError(
        'Your session has expired. Please log in again.',
      );
    }

    window.addEventListener(
      'technical-mandi:unauthorized',
      handleUnauthorized,
    );

    async function restoreSession() {
      const storedAccessToken = getAccessToken();
      const storedRefreshToken = getRefreshToken();

      // No saved credentials means this is a genuinely logged-out visitor.
      if (!storedAccessToken && !storedRefreshToken) {
        if (!cancelled) {
          setUser(null);
          setInitializing(false);
        }

        return;
      }

      try {
        setAuthError(null);

        // Normally the access token remains in localStorage even after it has
        // expired. Calling /profile/ with that expired token causes api.js to:
        //
        //   1. receive 401,
        //   2. refresh the access token,
        //   3. repeat the profile request,
        //   4. return the successful profile response here.
        //
        // The following branch handles the less common case where only a
        // refresh token is stored and the access token is missing.
        if (!storedAccessToken && storedRefreshToken) {
          const refreshResponse = await api.post(
            ENDPOINTS.refresh,
            {
              refresh: storedRefreshToken,
            },
          );

          const replacementAccessToken = readAccessToken(
            refreshResponse.data,
          );

          if (!replacementAccessToken) {
            throw new Error(
              'The refresh response did not include an access token.',
            );
          }

          // Some SimpleJWT configurations rotate refresh tokens. When no new
          // refresh token is returned, preserve the existing one.
          const replacementRefreshToken =
            readRefreshToken(refreshResponse.data)
            || storedRefreshToken;

          setAuthTokens({
            access: replacementAccessToken,
            refresh: replacementRefreshToken,
          });
        }

        // This request verifies that the stored/refreshed token belongs to a
        // valid user. api.js automatically refreshes and retries it when the
        // access token has expired.
        const profileResponse = await api.get(
          ENDPOINTS.profile,
        );

        const restoredUser = extractUser(
          profileResponse.data,
        );

        if (!restoredUser) {
          throw new Error(
            'The profile response did not contain user information.',
          );
        }

        if (!cancelled) {
          setUser(restoredUser);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const status = error?.response?.status;

        // Clear credentials only for authentication-related failures.
        //
        // Temporary network or server errors should not unnecessarily destroy
        // saved tokens. The user can reload the page after connectivity is
        // restored.
        const authenticationFailure =
          status === 400
          || status === 401
          || status === 403
          || status === 404
          || status === 415;

        if (authenticationFailure) {
          clearAuthTokens();
        }

        setUser(null);

        if (authenticationFailure) {
          setAuthError(
            'Your saved session is no longer valid. Please log in again.',
          );
        } else {
          setAuthError(
            'Technical Mandi could not verify your session. Please check your connection and try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;

      window.removeEventListener(
        'technical-mandi:unauthorized',
        handleUnauthorized,
      );
    };
  }, []);

  // --------------------------------------------------------------------------
  // Create a new account.
  // --------------------------------------------------------------------------
  const signup = useCallback(
    async ({
      username,
      email,
      password,
      password2,
    }) => {
      setAuthError(null);

      // SignupPage performs login immediately after this request succeeds.
      //
      // Keeping account creation and login separate matches the current Django
      // API, where signup creates the user but does not necessarily return JWT
      // tokens.
      const response = await api.post(
        ENDPOINTS.signup,
        {
          username,
          email,
          password,
          password2,
        },
      );

      return response.data;
    },
    [],
  );

  // --------------------------------------------------------------------------
  // Log in and establish a complete JWT session.
  // --------------------------------------------------------------------------
  const login = useCallback(
    async ({ email, password }) => {
      setAuthError(null);

      try {
        const response = await api.post(
          ENDPOINTS.login,
          {
            email,
            password,
          },
        );

        const data = response.data;

        // Support common login response property names:
        //
        // {
        //   "access": "...",
        //   "refresh": "...",
        //   "user": {...}
        // }
        //
        // api.js also accepts access_token, refresh_token and token.
        const access = readAccessToken(data);
        const refresh = readRefreshToken(data);

        if (!access) {
          throw new Error(
            'The login response did not include an access token.',
          );
        }

        // Save both tokens before requesting the profile. This ensures the
        // profile request includes the Authorization header.
        //
        // When the backend stores the refresh token only in an HttpOnly cookie,
        // refresh may be null. api.js still sends cookies because
        // withCredentials is enabled.
        setAuthTokens({
          access,
          refresh,
        });

        // Some login endpoints include the user object directly.
        let authenticatedUser = data?.user || null;

        // When login returns only tokens, request the profile separately.
        if (!authenticatedUser) {
          const profileResponse = await api.get(
            ENDPOINTS.profile,
          );

          authenticatedUser = extractUser(
            profileResponse.data,
          );
        }

        if (!authenticatedUser) {
          throw new Error(
            'Technical Mandi could not load the user profile.',
          );
        }

        setUser(authenticatedUser);
        setAuthError(null);

        return authenticatedUser;
      } catch (error) {
        // Never retain a partially created session after login fails.
        clearAuthTokens();
        setUser(null);

        throw error;
      }
    },
    [],
  );

  // --------------------------------------------------------------------------
  // Log out locally and notify the backend.
  // --------------------------------------------------------------------------
  const logout = useCallback(async () => {
    const storedRefreshToken = getRefreshToken();

    try {
      // Some logout endpoints require the refresh token in the request body so
      // they can blacklist it.
      //
      // Backends using an HttpOnly refresh cookie can ignore this body and read
      // the cookie instead.
      await api.post(
        ENDPOINTS.logout,
        storedRefreshToken
          ? { refresh: storedRefreshToken }
          : {},
      );
    } catch {
      // Local logout must still succeed when:
      //
      //   - the access token is already expired,
      //   - the refresh token is already invalid,
      //   - the server is temporarily unavailable.
      //
      // The finally block removes all local authentication state.
    } finally {
      clearAuthTokens();
      setUser(null);
      setAuthError(null);
      setInitializing(false);
    }
  }, []);

  // Allows components to manually reload the current user after a profile
  // update without repeating authentication code.
  const refreshUser = useCallback(async () => {
    const response = await api.get(
      ENDPOINTS.profile,
    );

    const refreshedUser = extractUser(
      response.data,
    );

    if (!refreshedUser) {
      throw new Error(
        'The profile response did not contain user information.',
      );
    }

    setUser(refreshedUser);

    return refreshedUser;
  }, []);

  // Memoising the context value prevents consumers from re-rendering merely
  // because AuthProvider itself rendered for an unrelated reason.
  const value = useMemo(
    () => ({
      user,

      // A user object is created only after a token-backed profile has been
      // successfully resolved.
      isAuthenticated: Boolean(user),

      initializing,
      authError,
      setAuthError,

      signup,
      login,
      logout,
      refreshUser,
    }),
    [
      user,
      initializing,
      authError,
      signup,
      login,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook used by Navbar, ProtectedRoute, LoginPage, SignupPage,
// CheckoutPage, ProfilePage and CartContext.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an <AuthProvider>.',
    );
  }

  return context;
}