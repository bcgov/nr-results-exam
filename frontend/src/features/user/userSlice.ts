import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { FamLoginUser } from '../../services/AuthService'

interface UserState {
  user: FamLoginUser | null
  loading: boolean
  error: string | null
}

const FAM_LOGIN_USER = 'famLoginUser'

const userInfoFromStorage = (() => {
  const item = localStorage.getItem(FAM_LOGIN_USER)
  if (item === null) return null
  try {
    return JSON.parse(item) as FamLoginUser | null
  } catch {
    return null
  }
})()

const initialState: UserState = {
  user: userInfoFromStorage,
  loading: false,
  error: null
}

// Async thunk for fetching user details
export const getUserDetails = createAsyncThunk(
  'user/getUserDetails',
  async () => {
    const userJSON = localStorage.getItem(FAM_LOGIN_USER)
    if (userJSON === null || userJSON === '') {
      return null
    }
    return JSON.parse(userJSON) as FamLoginUser
  }
)

const userSlice = createSlice({
  name: 'userDetails',
  initialState,
  reducers: {
    setUserDetails: (state, action) => {
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    resetUserDetails: (state) => {
      state.user = null
      state.loading = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'An error occurred'
      })
  }
})

export const { setUserDetails, resetUserDetails } = userSlice.actions
export default userSlice.reducer
