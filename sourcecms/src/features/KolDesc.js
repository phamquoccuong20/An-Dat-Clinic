"use strict";

/* Package System */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	descEn: {
		content: "",
	},
	descVi: {
		idParent: "",
		content: "",
	},
	descJp: {
		idParent: "",
		content: "",
	},
}

const kolDescSlice = createSlice({
	name: 'kolDesc',
	initialState,
	reducers: {
		setDescEn(state,action){
			return{
				...state,
				descEn: {content: action.payload},
			}
		},
		setDescVi(state,action){
			return{
				...state,
				descVi: {
					idParent: action.payload.idParent,
					content: action.payload.content
				},
			}
		},
		setDescJp(state,action){
			return{
				...state,
				descJp: {
					idParent: action.payload.idParent,
					content: action.payload.content
				},
			}
		}
	}
})

export const { setDescEn, setDescVi, setDescJp } = kolDescSlice.actions;
export default kolDescSlice.reducer;