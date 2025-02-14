import { combineReducers } from "redux";
import {
  START_TEST,
  START_BLOCK,
  SET_COMPATIBLE_MILLISECONDS,
  SET_INCOMPATIBLE_MILLISECONDS,
  FINISH_BLOCK,
  FINISH_TEST,
  RESET_TEST,
  STORE_TEST_RESULT,
  UPDATE_DEMOGRAPHIC_FORM,
} from "../actions";

const initialState = {
  blockStarted: false,
  finished: false,
  currentBlockIndex: 0,
  test: null,
  compatibleMilliseconds: null,
  incompatibleMilliseconds: null,
  results: [],
};

const initialDemographicState = {
  whatsappNumber: "",
  gender: "",
  age: "",
  education: "",
  city: "",
  ethnicity: "",
  politicalAffiliation: "",
  income: "",
  consentProject: false,
  consentResearch: false,
};

// function currentTest(state = initialState, action) {
//   switch (action.type) {

//     default:
//       return state;
//   }
// }

function demographicFormReducer(state = initialDemographicState, action) {
  switch (action.type) {
    case UPDATE_DEMOGRAPHIC_FORM:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}

function currentTest(state = initialState, action) {
  switch (action.type) {
    case STORE_TEST_RESULT:
      return {
        ...state,
        results: [...state.results, ...action.payload], // Store results as an array
      };
    case START_TEST:
      return Object.assign({}, state, {
        test: action.test,
        currentBlockIndex: 0,
      });
    case START_BLOCK:
      return Object.assign({}, state, { blockStarted: true });
    case FINISH_BLOCK:
      return Object.assign({}, state, {
        currentBlockIndex: state.currentBlockIndex + 1,
        blockStarted: false,
      });
    case SET_COMPATIBLE_MILLISECONDS:
      return Object.assign({}, state, {
        compatibleMilliseconds: action.compatibleMilliseconds,
      });
    case SET_INCOMPATIBLE_MILLISECONDS:
      return Object.assign({}, state, {
        incompatibleMilliseconds: action.incompatibleMilliseconds,
      });
    case FINISH_TEST:
      return Object.assign({}, state, { finished: true, blockStarted: false });
    case RESET_TEST:
      return initialState;
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  demographicForm: demographicFormReducer,
  currentTest,
});

export default rootReducer;
