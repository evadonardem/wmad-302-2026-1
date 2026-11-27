export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  agreedToTerms: boolean;
}

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateLoginForm(
  username: string,
  password: string,
): FieldErrors<'username' | 'password'> {
  return {
    username: username.trim() ? undefined : 'Username is required.',
    password: password ? undefined : 'Password is required.',
  };
}

export function validateRegisterForm(
  values: RegisterFormValues,
): FieldErrors<keyof RegisterFormValues> {
  const errors: FieldErrors<keyof RegisterFormValues> = {};
  if (!values.firstName.trim()) errors.firstName = 'First name is required.';
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!values.username.trim()) errors.username = 'Username is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (values.password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match.';
  if (values.age.trim() && (!Number.isInteger(Number(values.age)) || Number(values.age) < 1)) {
    errors.age = 'Enter a valid age.';
  }
  if (!values.agreedToTerms) errors.agreedToTerms = 'You must agree before creating an account.';
  return errors;
}
