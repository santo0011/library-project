import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '../../services/authService.js';
import { authStorage } from '../../utils/authStorage.js';

const saved = authStorage.get();

const getErrorMessage = (error) => error.response?.data?.message || error.message || 'Request failed';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  try {
    const savedSession = authStorage.get();
    if (savedSession?.accessToken) return savedSession;
    return await authService.refresh();
  } catch (error) {
    authStorage.clear();
    return rejectWithValue(getErrorMessage(error));
  }
});

export const loadProfile = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    return await authService.me();
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: saved?.user || null,
    accessToken: saved?.accessToken || null,
    status: 'idle',
    sessionChecked: Boolean(saved?.accessToken),
    error: null
  },
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      authStorage.set({ user: state.user, accessToken: state.accessToken });
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.sessionChecked = true;
      authStorage.clear();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        authStorage.set(action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sessionChecked = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        authStorage.set(action.payload);
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'idle';
        state.sessionChecked = true;
        state.user = null;
        state.accessToken = null;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        authStorage.set({ user: state.user, accessToken: state.accessToken });
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.sessionChecked = true;
        authStorage.clear();
      });
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
