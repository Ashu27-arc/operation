import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials } from '../types';
import { otpAPI, authAPI } from '../services/api';

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { login, setAuthData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({});
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; otp?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (loginMethod === 'password') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else {
      if (!otp) {
        newErrors.otp = 'OTP is required';
      } else if (!/^\d{6}$/.test(otp)) {
        newErrors.otp = 'OTP must be 6 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Email is invalid' });
      return;
    }

    setSendingOtp(true);
    try {
      await otpAPI.sendOTP(email, 'login');
      setOtpSent(true);
      Alert.alert('OTP Sent', 'A 6-digit code has been sent to your email. Please check your inbox and enter the code below.');
    } catch (error: any) {
      let errorMessage = 'Failed to send OTP';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (loginMethod === 'password') {
        const credentials: LoginCredentials = { email, password };
        await login(credentials);
      } else {
        // Login with OTP
        const response = await authAPI.loginWithOTP(email, otp);
        // Use setAuthData to store token and user
        await setAuthData(response.token, response);
      }
      router.replace('/tasks');
    } catch (error: any) {
      let errorMessage = 'Something went wrong';
      
      if (error.isAuthError) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Backend server is not running. Please start the server.';
      } else if (error.response?.status === 404) {
        // No account found with this email
        errorMessage = error.response?.data?.message || 'No account found with this email. Please register first.';
        setOtpSent(false); // Reset so user can try different email
        setOtp('');
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid or expired OTP. Please request a new one.';
        setOtp('');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchLoginMethod = (method: 'password' | 'otp') => {
    setLoginMethod(method);
    setErrors({});
    setPassword('');
    setOtp('');
    setOtpSent(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Login Method Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === 'password' && styles.toggleButtonActive,
            ]}
            onPress={() => switchLoginMethod('password')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                loginMethod === 'password' && styles.toggleButtonTextActive,
              ]}
            >
              Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === 'otp' && styles.toggleButtonActive,
            ]}
            onPress={() => switchLoginMethod('otp')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                loginMethod === 'otp' && styles.toggleButtonTextActive,
              ]}
            >
              OTP
            </Text>
          </TouchableOpacity>
        </View>

        <CustomInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />

        {loginMethod === 'password' && (
          <CustomInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />
        )}

        {loginMethod === 'otp' && (
          <View>
            <CustomInput
              label="OTP Code"
              placeholder="Enter 6-digit code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.otp}
            />
            <TouchableOpacity
              style={styles.resendOtpButton}
              onPress={handleSendOTP}
              disabled={sendingOtp}
            >
              <Text style={styles.resendOtpText}>
                {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <CustomButton
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          buttonStyle={styles.button}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Text style={styles.link} onPress={() => router.push('/register')}>
            Sign Up
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#1F2937',
  },
  button: {
    marginTop: 16,
  },
  resendOtpButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 8,
  },
  resendOtpText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  link: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;