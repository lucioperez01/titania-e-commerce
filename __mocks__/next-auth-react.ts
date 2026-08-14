import { createContext, useContext } from "react"

const SessionContext = createContext<{ data: null }>({ data: null })

export function useSession() {
  return useContext(SessionContext)
}

export function signIn() {
  // no-op mock
}

export function signOut() {
  // no-op mock
}

export { SessionContext }
