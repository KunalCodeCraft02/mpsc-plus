export function firebaseErrorMessage(error) {
  const code = error?.code || "";
  if (code.includes("invalid-email") || code.includes("invalid-credential")) {
    return "Invalid email or password.";
  }
  if (code.includes("email-already-in-use")) {
    return "An account with this email already exists.";
  }
  if (code.includes("weak-password")) {
    return "Please choose a stronger password.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please try again later.";
  }
  if (code.includes("network-request-failed")) {
    return "Network error. Check your connection and try again.";
  }
  if (error?.message === "Firebase authentication is not configured") {
    return "Student authentication is not configured yet.";
  }
  return "Authentication failed. Please try again.";
}
