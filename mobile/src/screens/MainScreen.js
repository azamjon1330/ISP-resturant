import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { agentAPI } from '../api'
import Toast from 'react-native-toast-message'
import QRCode from 'react-native-qrcode-svg'

const TABS = [
  { key: 'cards', label: 'Kartalar', icon: 'card' },
  { key: 'profile', label: 'Profil', icon: 'person' },
]

const fmtDate = (iso) => {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

export default function MainScreen({ route, navigation }) {
  const { agent: initialAgent } = route.params
  const [agent, setAgent] = useState(initialAgent)
  const [tab, setTab] = useState('cards')
  const [history, setHistory] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [agentRes, histRes] = await Promise.all([
        agentAPI.getByCode(agent.code),
        agentAPI.getHistory(agent.code),
      ])
      setAgent(agentRes.data)
      setHistory(histRes.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const refresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  const logout = () => navigation.replace('Welcome')

  const goldVisits = agent.gold_card_uses % agent.bonus_threshold
  const goldPct = goldVisits / agent.bonus_threshold
  const regularCards = agent.cards?.filter(c => c.card_type === 'regular') || []

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1c0700', '#0d0300']} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{agent.name[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{agent.name}</Text>
            <Text style={styles.headerCode}>#{agent.code}</Text>
          </View>
        </View>
        {/* Gold progress mini */}
        <View style={styles.miniProgress}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={styles.miniProgressText}>{goldVisits}/{agent.bonus_threshold}</Text>
          <View style={styles.miniTrack}>
            <View style={[styles.miniFill, { width: `${Math.min(goldPct * 100, 100)}%` }]} />
          </View>
        </View>
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tabItem, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Ionicons name={tab === t.key ? t.icon : t.icon + '-outline'} size={20} color={tab === t.key ? '#FF6B35' : '#9CA3AF'} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B35" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF6B35" />}
        >
          {/* ===== CARDS TAB ===== */}
          {tab === 'cards' && (
            <>
              {/* Gold card */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⭐ Oltin karta</Text>
                <LinearGradient colors={['#3D1A00', '#5C2800']} style={styles.goldCard}>
                  <View style={styles.goldCardTop}>
                    <View>
                      <Text style={styles.goldCardCode}>{agent.gold_card_code}</Text>
                      <Text style={styles.goldCardSub}>
                        {goldVisits} / {agent.bonus_threshold} tashrif → {agent.discount_amount?.toLocaleString()} so'm bonus
                      </Text>
                    </View>
                    <Ionicons name="star" size={30} color="#F59E0B" />
                  </View>

                  {/* Progress bar */}
                  <View style={styles.goldProgress}>
                    <View style={styles.goldTrack}>
                      <View style={[styles.goldFill, { width: `${Math.min(goldPct * 100, 100)}%` }]} />
                    </View>
                    <Text style={styles.goldPct}>{Math.round(goldPct * 100)}%</Text>
                  </View>

                  {/* QR code */}
                  <View style={styles.qrCenter}>
                    <View style={styles.qrWrap}>
                      <QRCode value={agent.gold_card_code} size={110} color="#1F2937" backgroundColor="white" />
                    </View>
                    <Text style={styles.qrHint}>Kassada skanerlang</Text>
                  </View>

                  {/* Agent personal code hint */}
                  <View style={styles.personalCodeBox}>
                    <Ionicons name="key-outline" size={14} color="rgba(255,200,130,0.7)" />
                    <Text style={styles.personalCodeText}>
                      Shaxsiy kodingiz: <Text style={styles.personalCodeValue}>#{agent.code}</Text> — kassada ham ishlatiladi
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Referral cards */}
              {regularCards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💳 Referal kartalar ({regularCards.length} ta)</Text>
                  {regularCards.map(card => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.refCard, selectedCard?.id === card.id && styles.refCardSelected, !card.is_active && styles.refCardInactive]}
                      onPress={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="card-outline" size={16} color={card.is_active ? '#FF6B35' : '#9CA3AF'} />
                      <Text style={[styles.refCardCode, !card.is_active && styles.dimText]}>{card.card_code}</Text>
                      <Text style={styles.refUses}>{card.use_count}×</Text>
                      <Ionicons name={selectedCard?.id === card.id ? 'chevron-up' : 'chevron-down'} size={14} color="#9CA3AF" />
                    </TouchableOpacity>
                  ))}
                  {selectedCard && (
                    <View style={styles.qrExpandBox}>
                      <Text style={styles.qrExpandCode}>{selectedCard.card_code}</Text>
                      <View style={styles.qrWrap}>
                        <QRCode value={selectedCard.card_code} size={140} />
                      </View>
                      <Text style={styles.qrHint}>Kassaga bu QR kodni ko'rsating</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Visit history */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🕐 Tashrif tarixi</Text>
                {history.length === 0 ? (
                  <Text style={styles.emptyText}>Hali tashrif yo'q</Text>
                ) : (
                  history.map(h => (
                    <View key={h.id} style={styles.histRow}>
                      <View style={[styles.histIcon, h.card_type === 'gold' ? styles.histGold : styles.histReg]}>
                        <Ionicons name={h.card_type === 'gold' ? 'star' : 'card'} size={14} color={h.card_type === 'gold' ? '#F59E0B' : '#FF6B35'} />
                      </View>
                      <View style={styles.histInfo}>
                        <Text style={styles.histOrder}>Buyurtma #{h.order_code}</Text>
                        <Text style={styles.histDate}>{fmtDate(h.created_at)}</Text>
                      </View>
                      {h.discount_applied > 0 && (
                        <Text style={styles.histDiscount}>-{h.discount_applied?.toLocaleString()} so'm</Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {/* ===== PROFILE TAB ===== */}
          {tab === 'profile' && (
            <>
              <View style={styles.profileCard}>
                <LinearGradient colors={['#2a0f00', '#1c0700']} style={styles.profileGrad}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileInitial}>{agent.name[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.profileName}>{agent.name}</Text>
                  {agent.phone && (
                    <View style={styles.profilePhoneRow}>
                      <Ionicons name="call-outline" size={14} color="rgba(255,180,120,0.7)" />
                      <Text style={styles.profilePhone}>{agent.phone}</Text>
                    </View>
                  )}
                  <View style={styles.profileCodeRow}>
                    <Ionicons name="key-outline" size={14} color="rgba(255,180,120,0.7)" />
                    <Text style={styles.profileCodeText}>#{agent.code}</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Stats */}
              <View style={styles.statsGrid}>
                {[
                  { icon: 'star', color: '#F59E0B', label: "Oltin tashrif", val: agent.gold_card_uses },
                  { icon: 'card', color: '#FF6B35', label: 'Referal ishlatildi', val: agent.referral_card_total_uses },
                  { icon: 'gift', color: '#10B981', label: 'Bonus', val: agent.total_bonus_earned },
                  { icon: 'pricetag', color: '#3B82F6', label: 'Chegirma', val: `${agent.discount_amount?.toLocaleString()} so'm` },
                ].map((s, i) => (
                  <View key={i} style={styles.statCard}>
                    <Ionicons name={s.icon} size={20} color={s.color} style={{ marginBottom: 6 }} />
                    <Text style={styles.statVal}>{s.val}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Info rows */}
              <View style={styles.infoCard}>
                {[
                  { label: "Bonus chegarasi", val: `${agent.bonus_threshold} tashrif` },
                  { label: "Referal bonus", val: `${agent.referral_bonus_threshold} ishlatish` },
                  { label: "Referal kartalar", val: `${agent.regular_card_count} ta` },
                ].map((row, i) => (
                  <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoVal}>{row.val}</Text>
                  </View>
                ))}
              </View>

              {/* Logout */}
              <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.logoutText}>Chiqish</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0300' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,107,53,0.15)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarSmall: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '800', color: '#FF6B35' },
  headerName: { fontSize: 15, fontWeight: '700', color: 'white' },
  headerCode: { fontSize: 12, color: '#FF8C5A', fontWeight: '600' },

  miniProgress: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniProgressText: { fontSize: 11, color: 'rgba(255,200,130,0.7)', fontWeight: '600' },
  miniTrack: { width: 50, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },

  tabBar: {
    flexDirection: 'row', backgroundColor: 'rgba(20,7,1,0.9)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,107,53,0.15)',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FF6B35' },
  tabLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  tabLabelActive: { color: '#FF6B35', fontWeight: '700' },

  content: { flex: 1 },
  contentInner: { padding: 14, gap: 0 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: 'rgba(255,180,120,0.9)', marginBottom: 10 },

  // Gold card
  goldCard: {
    borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,150,30,0.35)',
  },
  goldCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  goldCardCode: { fontSize: 17, fontWeight: '800', color: '#FCD34D', letterSpacing: 1, marginBottom: 4 },
  goldCardSub: { fontSize: 12, color: 'rgba(255,200,130,0.7)' },
  goldProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  goldTrack: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  goldFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 },
  goldPct: { fontSize: 12, color: '#F59E0B', fontWeight: '700', minWidth: 34 },
  qrCenter: { alignItems: 'center', marginBottom: 14 },
  qrWrap: { padding: 10, backgroundColor: 'white', borderRadius: 12 },
  qrHint: { fontSize: 11, color: 'rgba(255,200,130,0.55)', marginTop: 8, textAlign: 'center' },
  personalCodeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,53,0.1)', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
  },
  personalCodeText: { fontSize: 11, color: 'rgba(255,200,130,0.65)', flex: 1 },
  personalCodeValue: { fontWeight: '800', color: '#FF8C5A' },

  // Referral cards
  refCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(20,7,1,0.7)', borderRadius: 10, padding: 12, marginBottom: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.18)',
  },
  refCardSelected: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.1)' },
  refCardInactive: { opacity: 0.4 },
  refCardCode: { flex: 1, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  refUses: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  dimText: { opacity: 0.4 },
  qrExpandBox: {
    backgroundColor: 'rgba(20,7,1,0.8)', borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 6,
    borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.3)',
  },
  qrExpandCode: { fontSize: 13, fontWeight: '700', color: '#FF8C5A', marginBottom: 14 },

  // History
  emptyText: { textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, paddingVertical: 20 },
  histRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(20,7,1,0.7)', borderRadius: 10, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.1)',
  },
  histIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  histGold: { backgroundColor: 'rgba(245,158,11,0.15)' },
  histReg: { backgroundColor: 'rgba(255,107,53,0.12)' },
  histInfo: { flex: 1 },
  histOrder: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  histDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  histDiscount: { fontSize: 13, fontWeight: '700', color: '#10B981' },

  // Profile
  profileCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
  profileGrad: { padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', borderRadius: 18 },
  profileAvatar: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,107,53,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileInitial: { fontSize: 32, fontWeight: '800', color: '#FF6B35' },
  profileName: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 6 },
  profilePhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  profilePhone: { fontSize: 14, color: 'rgba(255,180,120,0.7)' },
  profileCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  profileCodeText: { fontSize: 14, color: '#FF8C5A', fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(20,7,1,0.7)',
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)',
  },
  statVal: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,200,130,0.5)', textAlign: 'center' },

  infoCard: {
    backgroundColor: 'rgba(20,7,1,0.7)', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)', marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,107,53,0.08)' },
  infoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  infoVal: { fontSize: 13, fontWeight: '700', color: 'rgba(255,200,130,0.85)' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.25)', marginBottom: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
})
