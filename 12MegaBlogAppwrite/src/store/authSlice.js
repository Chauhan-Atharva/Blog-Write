import {createSlice} from "@reduxjs/toolkit"

const initialState = {
    status: false,
    userData: null
}

const authSlice = createSlice({
    name: "auth", // used in action type - auth/login, auth/logout
    initialState,
    // action = object created automatically by Redux
    // dispatch(login({ userData: user }))

        // action becomes:
        // {
        //   type: "auth/login",
        //   payload: { userData: user }
        // }
    reducers: { 
        login: (state,action) => {
            console.trace("login called");
            console.log("Login Reducer hit");
            state.status = true; 
            state.userData = action.payload.userData; 
        },
        logout: (state) => {
            console.log("Logout reducer hit ");
            
            state.status = false; 
            state.userData = null; 
        } 
    }
})
// authSlice.actions = { login, logout } - automatically created 
// Extracts the auto-generated action creators (login, logout)
// from authSlice.actions and exports them for use in other files.
// Used like: dispatch(login()) or dispatch(logout())

export const {login,logout} = authSlice.actions; 

export default authSlice.reducer; 