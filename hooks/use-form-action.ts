"use client"

import { startTransition, useActionState, useEffect, useRef } from "react"

import type { ActionState } from "@/app/config/actions"

const initialState: ActionState = { status: "idle", message: "" }

// Envuelve un server action de formulario sin el reset automático de React 19
// (que borraría lo escrito si la validación falla). Solo limpia al guardar bien.
export function useFormAction(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
) {
  const [state, run, pending] = useActionState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset()
  }, [state])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => run(formData))
  }

  return { state, pending, formRef, onSubmit }
}
