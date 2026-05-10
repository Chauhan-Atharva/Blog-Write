import {configureStore } from "@reduxjs/toolkit"
import authSlice from "./authSlice.js"
//store is the global storage of all your states 
const store = configureStore({
    reducer: {
        auth: authSlice

    }
});

export default store ; 