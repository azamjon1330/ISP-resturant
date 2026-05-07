import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ScrollView, ActivityIndicator, RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { menuAPI, agentAPI } from '../api'
import Toast from 'react-native-toast-message'
import QRCode from 'react-native-qrcode-svg'

const TABS = [
  { key: 'menu', label: 'Меню', icon: 'restaurant' },
  { key: 'cards', label: 'Карталар', icon: 'card' },
  { key: 'profile', label: 'Профил', icon: 'person' },
]

export default function MainScreen({ route, navigation }) {
  const { agent: initialAgent } = route.params
  const [agent, setAgent] = useState(initialAgent)
  const [tab, setTab] = useState('menu')
  const [menu, setMenu] = useState([])
  const [history, setHistory] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => { loadMenu(); loadHistory() }, [])

  const loadMenu = async () => {
    setMenuLoading(true)
    try { const r = await menuAPI.getAll(); setMenu(r.data) }
    catch { Toast.show({ type: 'error', text1: 'Меню юкланмади' }) }
    finally { setMenuLoading(false) }
  }

  const loadHistory = async () => {
    try { const r = await agentAPI.getHistory(agent.code); setHistory(r.data) }
    catch {}
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const r = await agentAPI.getByCode(agent.code)
      setAgent(r.data)
      await loadHistory()
    } catch {}
    finally { setRefreshing(false) }
  }

  const goldProgress = agent.gold_card_uses % agent.bonus_threshold
  const goldProgressPct = goldProgress / agent.bonus_threshold

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentCode}>#{agent.code}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Welcome')}>
          <Ionicons name="log-out-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.bonusBar}>
        <View style={styles.bonusInfo}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.bonusText}>
            {goldProgress} / {agent.bonus_threshold} ташриф → бонус
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${goldProgressPct * 100}%` }]} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabItem, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Ionicons name={t.icon + (tab === t.key ? '' : '-outline')} size={20} color={tab === t.key ? '#FF6B35' : '#9CA3AF'} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'menu' && (
          menuLoading ? (
            <ActivityIndicator color="#FF6B35" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={menu}
              keyExtractor={i => String(i.id)}
              contentContainerStyle={styles.menuList}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF6B35" />}
              renderItem={({ item }) => (
                <View style={styles.menuItem}>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuCategory}>{item.category}</Text>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                  </View>
                  <View style={styles.menuPriceBox}>
                    <Text style={styles.menuPrice}>{item.price?.toLocaleString()}</Text>
                    <Text style={styles.menuPriceSub}>сум</Text>
                  </View>
                </View>
              )}
            />
          )
        )}

        {tab === 'cards' && (
          <ScrollView contentContainerStyle={styles.cardsScroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF6B35" />}>
            <View style={styles.goldCardBox}>
              <View style={styles.goldCardHeader}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.goldCardTitle}>Олтин карта</Text>
                <View style={styles.goldBadge}><Text style={styles.goldBadgeText}>GOLD</Text></View>
              </View>
              <Text style={styles.goldCardCode}>{agent.gold_card_code}</Text>
              <Text style={styles.goldCardInfo}>{agent.gold_card_uses} марта ишлатилди • {agent.bonus_threshold} дан кейин бонус</Text>
              <View style={styles.qrBox}>
                <QRCode value={agent.gold_card_code} size={100} color="#1F2937" backgroundColor="white" />
              </View>
            </View>

            <Text style={styles.cardsTitle}>Реферал карталар ({agent.cards?.filter(c => c.card_type === 'regular').length})</Text>
            {agent.cards?.filter(c => c.card_type === 'regular').map(card => (
              <TouchableOpacity key={card.id} style={[styles.refCardRow, selectedCard?.id === card.id && styles.refCardSelected]}
                onPress={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}>
                <Ionicons name="card-outline" size={16} color={card.is_active ? '#FF6B35' : '#9CA3AF'} />
                <Text style={[styles.refCardCode, !card.is_active && styles.inactive]}>{card.card_code}</Text>
                <Text style={styles.refUses}>{card.use_count}×</Text>
                <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            {selectedCard && (
              <View style={styles.qrModal}>
                <Text style={styles.qrModalTitle}>{selectedCard.card_code}</Text>
                <QRCode value={selectedCard.card_code} size={150} />
                <Text style={styles.qrModalSub}>Кассага ушбу QR кодни кўрсатинг</Text>
              </View>
            )}
          </ScrollView>
        )}

        {tab === 'profile' && (
          <ScrollView contentContainerStyle={styles.profileScroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF6B35" />}>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>{agent.name[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.profileName}>{agent.name}</Text>
              {agent.phone && <Text style={styles.profilePhone}>{agent.phone}</Text>}
              <View style={styles.profileStats}>
                <View style={styles.pstat}><Text style={styles.pstatVal}>{agent.gold_card_uses}</Text><Text style={styles.pstatLabel}>Визит</Text></View>
                <View style={styles.pstat}><Text style={styles.pstatVal}>{agent.referral_card_total_uses}</Text><Text style={styles.pstatLabel}>Реферал</Text></View>
                <View style={styles.pstat}><Text style={styles.pstatVal}>{agent.total_bonus_earned}</Text><Text style={styles.pstatLabel}>Бонус</Text></View>
              </View>
            </View>

            <Text style={styles.historyTitle}>Тарих</Text>
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>Транзакциялар йўқ</Text>
            ) : (
              history.map(h => (
                <View key={h.id} style={styles.historyRow}>
                  <View style={[styles.historyIcon, h.card_type === 'gold' ? styles.goldIcon : styles.regIcon]}>
                    <Ionicons name={h.card_type === 'gold' ? 'star' : 'card'} size={14} color={h.card_type === 'gold' ? '#F59E0B' : '#FF6B35'} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyOrder}>Буюртма #{h.order_code}</Text>
                    <Text style={styles.historyDate}>{new Date(h.created_at).toLocaleDateString('ru-RU')}</Text>
                  </View>
                  {h.discount_applied > 0 && (
                    <Text style={styles.historyDiscount}>-{h.discount_applied?.toLocaleString()} сум</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingBottom: 12, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  agentName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  agentCode: { fontSize: 13, color: '#FF6B35', fontWeight: '600', marginTop: 1 },
  logoutBtn: { padding: 8 },

  bonusBar: { backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 12 },
  bonusInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  bonusText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  progressTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 3 },

  tabBar: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF6B35' },
  tabLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive: { color: '#FF6B35', fontWeight: '600' },

  content: { flex: 1 },

  menuList: { padding: 12, gap: 8 },
  menuItem: {
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  menuInfo: { flex: 1, marginRight: 12 },
  menuCategory: { fontSize: 10, fontWeight: '600', color: '#FF6B35', marginBottom: 3, textTransform: 'uppercase' },
  menuName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  menuDesc: { fontSize: 12, color: '#9CA3AF', lineHeight: 16 },
  menuPriceBox: { alignItems: 'flex-end' },
  menuPrice: { fontSize: 16, fontWeight: '800', color: '#E85A24' },
  menuPriceSub: { fontSize: 10, color: '#9CA3AF' },

  cardsScroll: { padding: 14, gap: 10 },
  goldCardBox: {
    backgroundColor: '#FFFBEB', borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: '#FDE68A', marginBottom: 8,
    alignItems: 'center',
  },
  goldCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  goldCardTitle: { fontSize: 16, fontWeight: '700', color: '#92400E' },
  goldBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  goldBadgeText: { fontSize: 10, fontWeight: '800', color: 'white' },
  goldCardCode: { fontSize: 16, fontWeight: '700', color: '#1F2937', letterSpacing: 1, marginBottom: 4 },
  goldCardInfo: { fontSize: 12, color: '#92400E', marginBottom: 14 },
  qrBox: { padding: 10, backgroundColor: 'white', borderRadius: 10 },

  cardsTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  refCardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'white', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  refCardSelected: { borderColor: '#FF6B35', backgroundColor: '#FFF4EF' },
  refCardCode: { flex: 1, fontSize: 12, fontWeight: '600', color: '#374151' },
  refUses: { fontSize: 11, color: '#9CA3AF' },
  inactive: { opacity: 0.4 },

  qrModal: {
    backgroundColor: 'white', borderRadius: 16, padding: 24,
    alignItems: 'center', marginTop: 12,
    borderWidth: 1.5, borderColor: '#FF6B35',
  },
  qrModalTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 16 },
  qrModalSub: { fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' },

  profileScroll: { padding: 14 },
  profileCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFF4EF', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileInitial: { fontSize: 28, fontWeight: '800', color: '#FF6B35' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  profilePhone: { fontSize: 14, color: '#9CA3AF', marginBottom: 20 },
  profileStats: { flexDirection: 'row', gap: 24 },
  pstat: { alignItems: 'center' },
  pstatVal: { fontSize: 22, fontWeight: '800', color: '#FF6B35' },
  pstatLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  historyTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },
  historyEmpty: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, paddingVertical: 30 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 10, padding: 12, marginBottom: 6,
  },
  historyIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  goldIcon: { backgroundColor: '#FEF3C7' },
  regIcon: { backgroundColor: '#FFF4EF' },
  historyInfo: { flex: 1 },
  historyOrder: { fontSize: 13, fontWeight: '600', color: '#374151' },
  historyDate: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  historyDiscount: { fontSize: 13, fontWeight: '700', color: '#10B981' },
})
