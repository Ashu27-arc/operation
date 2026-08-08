import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { tasksAPI } from '../../services/api';
import { TaskFormData } from '../../types';
import TaskForm from '../../components/TaskForm';

const CreateTaskScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      await tasksAPI.createTask(data);
      Alert.alert('Success', 'Task created successfully', [
        { text: 'OK', onPress: () => router.replace('/tasks') },
      ]);
    } catch (error: any) {
      let errorMessage = 'Failed to create task';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Backend server is not running. Please start the server.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TaskForm
        onSubmit={handleSubmit}
        submitButtonText="Create Task"
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default CreateTaskScreen;
