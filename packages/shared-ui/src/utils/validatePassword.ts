export function validatePassword(password: string): string {
    const symbolPattern = /[^\dA-Za-z]/;
    const numberPattern = /\d/;

    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (!symbolPattern.test(password)) {
        return 'Password must contain at least one symbol';
    }
    if (!numberPattern.test(password)) {
        return 'Password must contain at least one number';
    }
    return '';
}
