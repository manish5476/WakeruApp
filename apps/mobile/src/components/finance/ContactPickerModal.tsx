// src/components/finance/ContactPickerModal.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../providers/ThemeProvider';
import { useFriends } from '../../hooks/useFriends';
import { useLendingSummary } from '../../hooks/useFinance';
import AppIcon from '../common/AppIcon';
import { haptics } from '../../utils/haptics';
import { APP_NAME } from '../../config/branding';

export interface SelectedContact {
  name: string;
  phone?: string;
  userId?: string;
}

interface ContactPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: SelectedContact) => void;
  selectedContact?: SelectedContact | null;
}

export function ContactPickerModal({
  visible,
  onClose,
  onSelectContact,
  selectedContact,
}: ContactPickerModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'manual'>(
    'all',
  );

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Fetch registered friends
  const { data: friends = [] } = useFriends(searchQuery);

  // Fetch recent lending contacts
  const { data: lendingSummary } = useLendingSummary();
  const recentContacts: SelectedContact[] = useMemo(() => {
    return lendingSummary?.recentContacts || [];
  }, [lendingSummary]);

  // Filtered contacts
  const filteredRecent = useMemo(() => {
    if (!searchQuery.trim()) return recentContacts;
    const q = searchQuery.toLowerCase().trim();
    return recentContacts.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)),
    );
  }, [recentContacts, searchQuery]);

  const handleSelect = (contact: SelectedContact) => {
    haptics.selection();
    onSelectContact(contact);
    onClose();
  };

  const handleManualSubmit = () => {
    if (!manualName.trim()) {
      haptics.warning();
      return;
    }
    haptics.success();
    onSelectContact({
      name: manualName.trim(),
      phone: manualPhone.trim() || undefined,
    });
    setManualName('');
    setManualPhone('');
    onClose();
  };

  const getInitials = (name: string) => {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join('') || '?'
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={FadeInDown.springify().damping(22)}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text
                style={[styles.sheetTitle, { color: theme.colors.textPrimary }]}
              >
                Select Contact
              </Text>
              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Choose a friend or enter contact details
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
              hitSlop={8}
            >
              <AppIcon name="x" size={16} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View
            style={[
              styles.tabRow,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
              },
            ]}
          >
            <Pressable
              onPress={() => {
                haptics.light();
                setActiveTab('all');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'all' && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'all'
                        ? theme.colors.textInverse
                        : theme.colors.textSecondary,
                    fontWeight: activeTab === 'all' ? '700' : '500',
                  },
                ]}
              >
                Suggested
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.light();
                setActiveTab('friends');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'friends' && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'friends'
                        ? theme.colors.textInverse
                        : theme.colors.textSecondary,
                    fontWeight: activeTab === 'friends' ? '700' : '500',
                  },
                ]}
              >
                {APP_NAME} Friends ({friends.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.light();
                setActiveTab('manual');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'manual' && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'manual'
                        ? theme.colors.textInverse
                        : theme.colors.textSecondary,
                    fontWeight: activeTab === 'manual' ? '700' : '500',
                  },
                ]}
              >
                + Manual Entry
              </Text>
            </Pressable>
          </View>

          {/* Search Box (For 'all' and 'friends' tabs) */}
          {activeTab !== 'manual' && (
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <AppIcon
                name="search"
                size={16}
                color={theme.colors.textTertiary}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme.colors.textPrimary },
                ]}
                placeholder="Search by name or phone..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <AppIcon
                    name="x"
                    size={14}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>
          )}

          {/* Tab Content */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'manual' ? (
              /* ── MANUAL ENTRY FORM ── */
              <View style={styles.manualForm}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Contact Full Name *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: theme.colors.textPrimary,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={manualName}
                  onChangeText={setManualName}
                  autoFocus
                />

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textSecondary, marginTop: 14 },
                  ]}
                >
                  Phone Number (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      color: theme.colors.textPrimary,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={manualPhone}
                  onChangeText={setManualPhone}
                  keyboardType="phone-pad"
                />

                <Pressable
                  onPress={handleManualSubmit}
                  disabled={!manualName.trim()}
                  style={[
                    styles.submitManualBtn,
                    {
                      backgroundColor: manualName.trim()
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.submitManualBtnText}>Select Contact</Text>
                </Pressable>
              </View>
            ) : activeTab === 'friends' ? (
              /* ── TRIP SPLIT APP FRIENDS ── */
              friends.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    No registered friends found.
                  </Text>
                  <Pressable
                    onPress={() => setActiveTab('manual')}
                    style={[
                      styles.inlineAddBtn,
                      { borderColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.inlineAddBtnText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      + Enter Name Manually
                    </Text>
                  </Pressable>
                </View>
              ) : (
                friends.map((friend: any, index: number) => {
                  const isSelected =
                    selectedContact?.userId === (friend.userId || friend._id);
                  return (
                    <Pressable
                      key={friend.userId || friend._id || String(index)}
                      onPress={() =>
                        handleSelect({
                          name: friend.displayName || friend.name || 'Friend',
                          phone: friend.phoneNumber || friend.phone,
                          userId: friend.userId || friend._id,
                        })
                      }
                      style={[
                        styles.contactItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryBg
                            : theme.isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.02)',
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        style={styles.avatarCircle}
                      >
                        <Text style={styles.avatarText}>
                          {getInitials(
                            friend.displayName || friend.name || 'F',
                          )}
                        </Text>
                      </LinearGradient>

                      <View style={styles.contactDetails}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Text
                            style={[
                              styles.contactName,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            {friend.displayName || friend.name}
                          </Text>
                          <View style={styles.badgeAppUser}>
                            <Text style={styles.badgeAppUserText}>
                              Wakeru User
                            </Text>
                          </View>
                        </View>
                        {friend.email ? (
                          <Text
                            style={[
                              styles.contactSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            {friend.email}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected && (
                        <AppIcon
                          name="check-circle"
                          size={18}
                          color={theme.colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })
              )
            ) : (
              /* ── ALL / SUGGESTED (Recent + Friends) ── */
              <View>
                {/* Quick Add Custom Name Option */}
                {searchQuery.trim().length > 0 && (
                  <Pressable
                    onPress={() =>
                      handleSelect({
                        name: searchQuery.trim(),
                      })
                    }
                    style={[
                      styles.contactItem,
                      {
                        backgroundColor: theme.colors.primaryBg,
                        borderColor: theme.colors.primary,
                        marginBottom: 12,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <AppIcon name="plus" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.contactDetails}>
                      <Text
                        style={[
                          styles.contactName,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Use "{searchQuery.trim()}"
                      </Text>
                      <Text
                        style={[
                          styles.contactSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Tap to create record with this name
                      </Text>
                    </View>
                  </Pressable>
                )}

                {/* Recent Contacts Section */}
                {filteredRecent.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <AppIcon
                      name="clock"
                      size={12}
                      color={theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      RECENT CONTACTS
                    </Text>
                  </View>
                )}
                {filteredRecent.map((contact, idx) => {
                  const isSelected = selectedContact?.name === contact.name;
                  return (
                    <Pressable
                      key={`recent-${idx}`}
                      onPress={() => handleSelect(contact)}
                      style={[
                        styles.contactItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryBg
                            : theme.isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.02)',
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#F59E0B', '#D97706']}
                        style={styles.avatarCircle}
                      >
                        <Text style={styles.avatarText}>
                          {getInitials(contact.name)}
                        </Text>
                      </LinearGradient>

                      <View style={styles.contactDetails}>
                        <Text
                          style={[
                            styles.contactName,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {contact.name}
                        </Text>
                        {contact.phone ? (
                          <Text
                            style={[
                              styles.contactSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            {contact.phone}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected && (
                        <AppIcon
                          name="check-circle"
                          size={18}
                          color={theme.colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}

                {/* Friends Section */}
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <AppIcon
                    name="users"
                    size={12}
                    color={theme.colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    TRIPSPLIT FRIENDS
                  </Text>
                </View>
                {friends.slice(0, 10).map((friend: any, idx: number) => {
                  const isSelected =
                    selectedContact?.userId === (friend.userId || friend._id);
                  return (
                    <Pressable
                      key={`friend-${idx}`}
                      onPress={() =>
                        handleSelect({
                          name: friend.displayName || friend.name || 'Friend',
                          phone: friend.phoneNumber || friend.phone,
                          userId: friend.userId || friend._id,
                        })
                      }
                      style={[
                        styles.contactItem,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primaryBg
                            : theme.isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.02)',
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        style={styles.avatarCircle}
                      >
                        <Text style={styles.avatarText}>
                          {getInitials(
                            friend.displayName || friend.name || 'F',
                          )}
                        </Text>
                      </LinearGradient>

                      <View style={styles.contactDetails}>
                        <Text
                          style={[
                            styles.contactName,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {friend.displayName || friend.name}
                        </Text>
                        {friend.email ? (
                          <Text
                            style={[
                              styles.contactSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            {friend.email}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected && (
                        <AppIcon
                          name="check-circle"
                          size={18}
                          color={theme.colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}

                {/* Manual Add Button At Bottom */}
                <Pressable
                  onPress={() => setActiveTab('manual')}
                  style={[
                    styles.bottomAddBtn,
                    { borderColor: theme.colors.borderLight },
                  ]}
                >
                  <AppIcon name="plus" size={16} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.bottomAddBtnText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Enter Custom Name / Phone
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '85%',
    minHeight: 460,
    paddingTop: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badgeAppUser: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAppUserText: {
    color: '#4F46E5',
    fontSize: 9.5,
    fontWeight: '700',
  },
  manualForm: {
    paddingTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
  },
  submitManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 24,
  },
  submitManualBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inlineAddBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inlineAddBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  bottomAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
    marginTop: 12,
  },
  bottomAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
