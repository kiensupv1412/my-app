const initialState = {
    value: 0,
  }
  
  export default function counterReducer(state = initialState, action: any) {
    switch (action.type) {
      case 'INCREMENT':
        return { ...state, value: state.value + 1 }
      default:
        return state
    }
  }
  