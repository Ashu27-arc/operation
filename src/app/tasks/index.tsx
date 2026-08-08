import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { Task, TaskStatus } from '../../types';
import TaskCard from '../../components/TaskCard';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';

const TasksScreen = () => {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await tasksAPI.getTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch tasks';
      
      if (err.isAuthError) {
        // Session expired, redirect to login
        await logout();
        router.replace('/login');
        return;
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Backend server is not running. Please start the server.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  // Initial load
  useEffect(() => {
    fetchTasks();
  }, []);

  // Refresh tasks when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      fetchTasks();
    }, [fetchTasks])
  );

  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  }, [searchQuery, statusFilter, tasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleDelete = useCallback(
    async (taskId: string) => {
      try {
        await tasksAPI.deleteTask(taskId);
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        setFilteredTasks((prev) => prev.filter((task) => task._id !== taskId));
      } catch (err: any) {
        let errorMessage = 'Failed to delete task';
        
        if (err.isAuthError) {
          // Session expired, redirect to login
          await logout();
          router.replace('/login');
          return;
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
          errorMessage = 'Backend server is not running. Please start the server.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
    },
    [logout]
  );

  const handleEdit = (taskId: string) => {
    router.push({ pathname: '/tasks/edit', params: { id: taskId } });
  };

  const handleTaskPress = (taskId: string) => {
    router.push({ pathname: '/tasks/[id]', params: { id: taskId } });
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      router.replace('/login');
    }
  };

  const statusOptions: (TaskStatus | 'all')[] = ['all', 'pending', 'in-progress', 'completed'];

  if (loading) {
    return <Loading message="Loading tasks..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === item && styles.activeFilterChip]}
              onPress={() => setStatusFilter(item)}
            >
              <Text
                style={[styles.filterText, statusFilter === item && styles.activeFilterText]}
              >
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {filteredTasks.length === 0 ? (
        <EmptyState
          message={searchQuery || statusFilter !== 'all' ? 'No tasks found' : 'No tasks yet'}
          subMessage={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Tap the + button to create your first task'
          }
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleTaskPress(item._id)}
              onEdit={() => handleEdit(item._id)}
              onDelete={() => handleDelete(item._id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#208AEF" />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/tasks/create')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterList: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  filterText: {
    fontSize: 14,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#208AEF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 36,
  },
});

export default TasksScreen;
