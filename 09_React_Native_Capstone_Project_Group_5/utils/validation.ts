/**
 * Form validation helpers (pure, unit-testable)
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegisterValues {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    age: string;
}

export type RegisterErrors = Partial<Record<keyof RegisterValues, string>>;

export function validateRegister(v: RegisterValues): RegisterErrors {
    const errors: RegisterErrors = {};
    if (!v.firstName.trim()) errors.firstName = 'First name is required';
    if (!v.lastName.trim()) errors.lastName = 'Last name is required';

    if (!v.username.trim()) errors.username = 'Username is required';
    else if (v.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_.]+$/.test(v.username.trim())) {
        errors.username = 'Use letters, numbers, dots or underscores only';
    }

    if (!v.email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(v.email.trim())) errors.email = 'Enter a valid email address';

    if (!v.password) errors.password = 'Password is required';
    else if (v.password.length < 6) errors.password = 'Password must be at least 6 characters';

    if (!v.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (v.confirmPassword !== v.password) errors.confirmPassword = 'Passwords do not match';

    if (v.age.trim()) {
        const age = Number(v.age);
        if (!Number.isInteger(age) || age < 13 || age > 120) errors.age = 'Age must be between 13 and 120';
    }
    return errors;
}

export interface ProfileValues {
    firstName: string;
    lastName: string;
    email: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

export function validateProfile(v: ProfileValues): ProfileErrors {
    const errors: ProfileErrors = {};
    if (!v.firstName.trim()) errors.firstName = 'First name is required';
    if (!v.lastName.trim()) errors.lastName = 'Last name is required';
    if (!v.email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(v.email.trim())) errors.email = 'Enter a valid email address';
    return errors;
}