import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomInput from './CustomInput';
import CustomButton from './CustomButton';
import { TaskFormData, TaskStatus, TaskPriority } from '../types';

interface TaskFormProps {
  initialData?: TaskFormData;
  onSubmit: (data: TaskFormData) => void;
  submitButtonText: string;
  loading?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText,
  loading = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialData?.status || 'pending');
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | null>(
    initialData?.dueDate ? new Date(initialData.dueDate) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    const formData: TaskFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : null,
    };

    console.log('Submitting form data:', formData);
    onSubmit(formData);
  };

  const statusOptions: TaskStatus[] = ['pending', 'in-progress', 'completed'];
  const priorityOptions: TaskPriority[] = ['low', 'medium', 'high'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <CustomInput
          label="Title *"
          placeholder="Enter task title"
          value={title}
          onChangeText={setTitle}
        />

        <CustomInput
          label="Description"
          placeholder="Enter task description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.optionsContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.option, status === option && styles.selectedOption]}
                onPress={() => setStatus(option)}
              >
                <Text
                  style={[styles.optionText, status === option && styles.selectedOptionText]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.optionsContainer}>
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.option, priority === option && styles.selectedOption]}
                onPress={() => setPriority(option)}
              >
                <Text
                  style={[styles.optionText, priority === option && styles.selectedOptionText]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {dueDate
                ? dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Select due date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              onChange={handleDateChange}
            />
          )}
        </View>

        <CustomButton
          title={submitButtonText}
          onPress={handleSubmit}
          loading={loading}
          buttonStyle={styles.submitButton}
        />
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
    padding: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
  optionText: {
    fontSize: 14,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default TaskForm;
