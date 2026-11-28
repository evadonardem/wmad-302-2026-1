import React, { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';

interface FormFieldProps extends Omit<TextInputProps, 'error'> {
  error?: string;
  secureToggle?: boolean;
}

export function FormField({ error, secureToggle = false, secureTextEntry, ...props }: FormFieldProps) {
  const [secureVisible, setSecureVisible] = useState(false);
  const isSecure = secureTextEntry ?? (secureToggle && !secureVisible);

  return (
    <TextInput
      {...props}
      mode="outlined"
      error={Boolean(error)}
      secureTextEntry={isSecure}
      right={
        secureToggle
          ? <TextInput.Icon icon={secureVisible ? 'eye-off' : 'eye'} onPress={() => setSecureVisible((visible) => !visible)} />
          : props.right
      }
    />
  );
}
