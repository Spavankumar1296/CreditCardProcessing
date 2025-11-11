import axios from "axios";
import { atom, selector } from "recoil";

export const SignupUserDataAtom = atom({
    key:"SignupUserDataAtom",
    default:""
})
export const SigninUserDataAtom = atom({
    key:"SigninUserDataAtom",
    default:""
})

export const idAtom = atom({
    key:"idAtom",
    default:""
})
export const usernameAtom = atom({
    key:"usernameAtom",
    default:""
})
export const InputAtom = atom({
    key:"InputAtom",
    default:""
})
export const allusersAtom = atom({
    key:"allusersAtom",
    default:[]
})

export const toUserAtom = atom({
    key:"toUserAtom",
    default:""
})
