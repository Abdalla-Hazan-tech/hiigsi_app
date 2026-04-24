import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Plus, CheckCircle, Circle, Calendar as CalendarIcon, X, Trash2 } from 'lucide-react-native';
import Logo from '../../../components/Logo';

import client from '../../../src/api/client';
import { Activity, Category } from '../../../src/types';
import { format } from 'date-fns';

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    daily_occurrences: 1,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actRes, catRes] = await Promise.all([
        client.get(`activities/?date=${selectedDate}`),
        client.get('categories/')
      ]);
      setActivities(actRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching activities', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        category: formData.category ? parseInt(formData.category) : null
      };
      await client.post('activities/', payload);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        daily_occurrences: 1,
      });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Could not create activity');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (id: number, increment: boolean = true) => {
    try {
      // Optimistic update
      setActivities(prev => prev.map(a => {
        if (a.id !== id) return a;
        const newCount = increment
          ? Math.min((a.occurrence_count || 0) + 1, a.daily_occurrences)
          : Math.max((a.occurrence_count || 0) - 1, 0);
        return {
          ...a,
          occurrence_count: newCount,
          is_completed: newCount === a.daily_occurrences
        };
      }));

      const res = await client.post(`activities/${id}/toggle_complete/`, {
        date: selectedDate,
        increment
      });
      
      setActivities(prev => prev.map(a => a.id === id ? res.data : a));
    } catch (err) {
      Alert.alert('Error', 'Could not toggle activity');
      fetchData();
    }
  };

  const deleteActivity = (id: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure? This will remove the task permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await client.delete(`activities/${id}/`);
              setActivities(prev => prev.filter(a => a.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Could not delete task');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Activity }) => {
    // Backend might return category as an ID or an object depending on depth/context
    // We normalize it here
    const catValue = item.category as any;
    const categoryDetail = typeof catValue === 'number' 
      ? categories.find(c => c.id === catValue)
      : item.category as Category | null;

    return (
      <View style={styles.activityCard}>
        <View style={styles.activityInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.activityTitle, item.is_completed && styles.completedText]}>
              {item.title}
            </Text>
            {categoryDetail && (
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryDetail.color_hex}20` }]}>
                <Text style={[styles.categoryText, { color: categoryDetail.color_hex }]}>
                  {categoryDetail.name}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.activityDesc, item.is_completed && styles.completedDesc]}>
            {item.description || 'No description'}
          </Text>
        </View>

        <View style={styles.actionColumn}>
          {item.daily_occurrences > 1 ? (
            <View style={styles.occurrenceRow}>
              {Array.from({ length: item.daily_occurrences }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    const currentCount = item.occurrence_count || 0;
                    if (i === currentCount) toggleComplete(item.id, true);
                    else if (i === currentCount - 1) toggleComplete(item.id, false);
                  }}
                >
                  {i < (item.occurrence_count || 0) ? (
                    <CheckCircle size={22} color="#22c55e" />
                  ) : (
                    <Circle size={22} color="#475569" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity onPress={() => toggleComplete(item.id, !item.is_completed)}>
              {item.is_completed ? (
                <CheckCircle size={28} color="#22c55e" />
              ) : (
                <Circle size={28} color="#475569" />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => deleteActivity(item.id)} style={styles.deleteBtn}>
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo size={40} />
          <View>
            <Text style={styles.title}>Daily Tasks</Text>
            <Text style={styles.subtitle}>Get things done</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>


      <View style={styles.dateSelector}>
        <CalendarIcon size={18} color="#0ea5e9" />
        <Text style={styles.dateText}>{selectedDate}</Text>
        {/* Simple logic to change date - in a real app would use a date picker */}
        <TouchableOpacity onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 1);
          setSelectedDate(format(d, 'yyyy-MM-dd'));
        }}>
          <Text style={styles.dateNav}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 1);
          setSelectedDate(format(d, 'yyyy-MM-dd'));
        }}>
          <Text style={styles.dateNav}>Next</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tasks for this day</Text>
            </View>
          }
        />
      )}

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.field}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(t) => setFormData({ ...formData, title: t })}
                  placeholder="Task name"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                  placeholder="Notes..."
                  placeholderTextColor="#64748b"
                  multiline
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Daily Occurrences</Text>
                <TextInput
                  style={styles.input}
                  value={formData.daily_occurrences.toString()}
                  onChangeText={(t) => setFormData({ ...formData, daily_occurrences: parseInt(t) || 1 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  <TouchableOpacity 
                    style={[
                      styles.categoryChip, 
                      !formData.category && styles.selectedChip
                    ]}
                    onPress={() => setFormData({ ...formData, category: '' })}
                  >
                    <Text style={[styles.chipText, !formData.category && styles.selectedChipText]}>None</Text>
                  </TouchableOpacity>
                  {categories.map((cat) => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[
                        styles.categoryChip, 
                        formData.category === cat.id.toString() && { borderColor: cat.color_hex, backgroundColor: `${cat.color_hex}20` }
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat.id.toString() })}
                    >
                      <View style={[styles.dot, { backgroundColor: cat.color_hex }]} />
                      <Text style={[
                        styles.chipText, 
                        formData.category === cat.id.toString() && { color: cat.color_hex, fontWeight: 'bold' }
                      ]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Task</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 24, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  addBtn: { backgroundColor: '#0ea5e9', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 24, backgroundColor: '#1e293b', borderRadius: 12, gap: 12 },
  dateText: { color: '#f8fafc', fontWeight: 'bold', flex: 1 },
  dateNav: { color: '#0ea5e9', fontWeight: 'bold', paddingHorizontal: 8 },
  list: { padding: 24 },
  activityCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  activityInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  activityTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
  completedText: { color: '#64748b', textDecorationLine: 'line-through' },
  activityDesc: { color: '#94a3b8', fontSize: 13 },
  completedDesc: { color: '#475569' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  actionColumn: { alignItems: 'flex-end', gap: 12 },
  occurrenceRow: { flexDirection: 'row', gap: 4 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#64748b', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
  field: { marginBottom: 16 },
  label: { color: '#94a3b8', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#f8fafc' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  categoryScroll: { flexDirection: 'row', marginBottom: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#0f172a', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  selectedChip: { borderColor: '#0ea5e9', backgroundColor: '#0ea5e920' },
  chipText: { color: '#94a3b8', fontSize: 14 },
  selectedChipText: { color: '#0ea5e9', fontWeight: 'bold' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
});
