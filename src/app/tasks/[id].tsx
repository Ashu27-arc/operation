import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { tasksAPI } from '../../services/api';
import { Task } from '../../types';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';
import CustomButton from '../../components/CustomButton';

const TaskDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setError(null);
      const data = await tasksAPI.getTaskById(taskId);
      setTask(data);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch task';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Backend server is not running. Please start the server.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await tasksAPI.deleteTask(taskId);
            router.back();
          } catch (err: any) {
            let errorMessage = 'Failed to delete task';
            
            if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
              errorMessage = 'Backend server is not running. Please start the server.';
            } else if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            } else if (err.message) {
              errorMessage = err.message;
            }
            
            setError(errorMessage);
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push({ pathname: '/tasks/edit', params: { id: id as string } });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in-progress':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <Loading message="Loading task..." />;
  }

  if (error || !task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        {!task && !error && <ErrorMessage message="Task not found" />}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{task.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>

        <View style={styles.metaContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{task.status}</Text>
          </View>
          <Text style={styles.dueDate}>{formatDate(task.dueDate)}</Text>
        </View>

        {task.description && task.description.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created</Text>
          <Text style={styles.metaText}>
            {new Date(task.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Updated</Text>
          <Text style={styles.metaText}>
            {new Date(task.updatedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.actions}>
          <CustomButton
            title="Edit Task"
            onPress={handleEdit}
            buttonStyle={styles.editButton}
          />
          <CustomButton
            title="Delete Task"
            onPress={handleDelete}
            loading={deleting}
            variant="danger"
            buttonStyle={styles.deleteButton}
          />
        </View>
      </ScrollView>
    </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  dueDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  metaText: {
    fontSize: 16,
    color: '#1F2937',
  },
  actions: {
    padding: 20,
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    marginBottom: 8,
  },
  deleteButton: {
    marginTop: 8,
  },
});

export default TaskDetailScreen;
