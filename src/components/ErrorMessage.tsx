import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onDismiss && (
        <Text style={styles.dismiss} onPress={onDismiss}>
          Dismiss
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  dismiss: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ErrorMessage;
