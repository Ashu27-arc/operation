import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { tasksAPI } from '../../services/api';
import { Task, TaskFormData } from '../../types';
import Loading from '../../components/Loading';
import TaskForm from '../../components/TaskForm';

const EditTaskScreen = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      const data = await tasksAPI.getTaskById(taskId);
      setTask(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch task');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleSubmit = async (data: TaskFormData) => {
    setSubmitting(true);
    try {
      console.log('Submitting task update with data:', data);
      const updatedTask = await tasksAPI.updateTask(taskId, data);
      console.log('Task updated successfully:', updatedTask);
      
      // Update local state with the returned task
      setTask(updatedTask);
      
      Alert.alert('Success', 'Task updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Submit error:', error);
      let errorMessage = 'Failed to update task';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = 'Backend server is not running. Please start the server.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading message="Loading task..." />;
  }

  const initialData: TaskFormData = task
    ? {
        title: task.title,
        description: task.description || undefined,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
      }
    : {
        title: '',
        description: undefined,
        status: 'pending',
        priority: 'medium',
        dueDate: null,
      };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TaskForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitButtonText="Update Task"
        loading={submitting}
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

export default EditTaskScreen;
