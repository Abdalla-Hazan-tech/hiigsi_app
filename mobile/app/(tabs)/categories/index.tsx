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
  RefreshControl
} from 'react-native';
import { Plus, Tag, X, Trash2, Check } from 'lucide-react-native';
import Logo from '../../../components/Logo';

import client from '../../../src/api/client';
import { Category } from '../../../src/types';

const PRESET_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#e2e8f0'];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color_hex: '#3b82f6' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await client.get('categories/');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleSubmit = async () => {
    if (!newCategory.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('categories/', newCategory);
      setIsModalOpen(false);
      setNewCategory({ name: '', color_hex: '#3b82f6' });
      fetchCategories();
    } catch (err) {
      Alert.alert('Error', 'Could not create category');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = (id: number) => {
    Alert.alert(
      'Delete Category',
      'Are you sure? Tasks in this category will become uncategorized.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await client.delete(`categories/${id}/`);
              setCategories(prev => prev.filter(c => c.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Could not delete category');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color_hex }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteCategory(item.id)} style={styles.deleteBtn}>
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Logo size={40} />
          <View>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>Organize your focus</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>


      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Tag size={48} color="#334155" />
              <Text style={styles.emptyText}>No categories yet</Text>
            </View>
          }
        />
      )}

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={newCategory.name}
                onChangeText={(t) => setNewCategory({ ...newCategory, name: t })}
                placeholder="Work, Health, Learning..."
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Pick a Color</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategory.color_hex === color && styles.selectedColor
                    ]}
                    onPress={() => setNewCategory({ ...newCategory, color_hex: color })}
                  >
                    {newCategory.color_hex === color && <Check size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Create Category</Text>}
            </TouchableOpacity>
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
  list: { padding: 24 },
  categoryCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  colorIndicator: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', marginTop: 100, gap: 16 },
  emptyText: { color: '#64748b', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold' },
  field: { marginBottom: 24 },
  label: { color: '#94a3b8', marginBottom: 12, fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#f8fafc' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  selectedColor: { borderWidth: 2, borderColor: '#fff' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 16, padding: 18, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
