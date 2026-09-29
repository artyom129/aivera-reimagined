export const PENDING_CONFIRMATION_EMAIL_KEY = "aivera_pending_confirmation_email"

type AuthErrorLike = {
  code?: string
  message?: string
}

export function getAuthRedirectUrl() {
  if (typeof window === "undefined") return "/auth/callback?next=/chat"

  // Use the address that the user actually opened. This is important in local
  // development where localhost and the phone-accessible LAN address differ.
  return `${window.location.origin}/auth/callback?next=/chat`
}

export function getFriendlyAuthError(error: AuthErrorLike | null | undefined) {
  const code = error?.code?.toLowerCase()
  const message = error?.message?.toLowerCase() || ""

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Почта ещё не подтверждена. Проверьте письмо или отправьте его повторно."
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Неверный email или пароль."
  }
  if (code === "user_already_exists" || message.includes("user already registered")) {
    return "Пользователь с таким email уже зарегистрирован."
  }
  if (code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "Слишком много писем подряд. Подождите минуту и попробуйте снова."
  }
  if (message.includes("password should be")) {
    return "Пароль не соответствует требованиям безопасности."
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Не удалось подключиться к Supabase. Проверьте интернет и повторите попытку."
  }

  return error?.message || "Произошла ошибка авторизации."
}

export function isEmailNotConfirmed(error: AuthErrorLike | null | undefined) {
  return (
    error?.code?.toLowerCase() === "email_not_confirmed" ||
    error?.message?.toLowerCase().includes("email not confirmed") === true
  )
}

export function getSafeNextPath(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/chat"
}
