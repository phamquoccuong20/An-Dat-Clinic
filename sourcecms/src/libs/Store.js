"use strict";

/* Package System */
import { configureStore } from '@reduxjs/toolkit';

/* Application */
import statusReducer from '@features/Status';
import accountReducer from '@features/Account';
import kolDescReducer from '@features/KolDesc';

const store = configureStore({
	reducer: {
		status: statusReducer,
		account: accountReducer,
		kolDesc: kolDescReducer,
	},
});

export default store;