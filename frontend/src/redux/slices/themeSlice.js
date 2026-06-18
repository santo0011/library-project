import { createSlice } from '@reduxjs/toolkit';

const initialMode = localStorage.getItem('themeMode') || 'light';
document.documentElement.setAttribute('data-bs-theme', initialMode);

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: initialMode },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-bs-theme', state.mode);
      localStorage.setItem('themeMode', state.mode);
    }
  }
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
