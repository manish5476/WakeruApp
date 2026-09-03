import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { useTheme } from '../../providers/ThemeProvider';
import { useFriends, useSendTripInvite } from '../../hooks/useFriends';
import GlobalLoader from '../common/GlobalLoader';

export function InviteFriendModal({
  visible,
  onClose,
  tripId,
}: {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const { data: friends = [], isLoading } = useFriends(search);
  const { mutate: sendInvite, isPending } = useSendTripInvite();

  const handleInvite = (friendUserId: string, friendName: string) => {
    sendInvite(
      { tripId, friendUserId, message: 'Please join my trip!' },
      {
        onSuccess: () => {
          Alert.alert('Success', `Invitation sent to ${friendName}!`);
          onClose();
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to send invite.');
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <GlassCard style={styles.content} intensity={theme.isDark ? 20 : 10}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Invite a Friend
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 18 }}>
                ×
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
              },
            ]}
            placeholder="Search friends..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />

          {isLoading ? (
            <View style={styles.loader}>
              <GlobalLoader
                variant="inline"
                size="small"
                color={theme.colors.primary}
              />
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item.userId}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.friendItem,
                    { borderBottomColor: theme.colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.colors.primaryBg },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.primary,
                        fontWeight: 'bold',
                      }}
                    >
                      {item.displayName?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.friendName,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {item.displayName}
                  </Text>
                  <Pressable
                    style={[
                      styles.inviteBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => handleInvite(item.userId, item.displayName)}
                    disabled={isPending}
                  >
                    <Text
                      style={{
                        color: theme.colors.textInverse,
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    >
                      Invite
                    </Text>
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  No friends found.
                </Text>
              }
            />
          )}
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  inviteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  loader: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
  },
});
