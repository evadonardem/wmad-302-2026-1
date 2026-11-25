/**
 * Not Found - catches any URL that matches no route (for example a typed
 * /(app)/(tabs)/home, since group names in parentheses are not part of web URLs)
 * and sends the user to "/", which redirects to Home (or Login when signed out).
 */
import { Redirect } from 'expo-router';
import React from 'react';

export default function NotFoundScreen() {
    return <Redirect href="/" />;
}