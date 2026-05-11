import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { agentAPI } from '../api'
import Toast from 'react-native-toast-message'

export default function WelcomeScreen({ navigation }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const enter = async () => {
    if (phone.trim().length < 9) {
      Toast.show({ type: 'error', text1: 'Xato', text2: "Telefon raqamni to'liq kiriting" })
      return
    }
    if (code.trim().length !== 7) {
      Toast.show({ type: 'error', text1: 'Xato', text2: '7 raqamli agentlik kodini kiriting' })
      return
    }
    setLoading(true)
    try {
      const res = await agentAPI.getByCode(code.trim())
      const agent = res.data
      const normalize = (p) => p.replace(/[\s\-\(\)\+]/g, '')
      if (agent.phone && normalize(agent.phone) !== normalize(phone.trim())) {
        Toast.show({ type: 'error', text1: 'Xato', text2: "Telefon raqam yoki kod noto'g'ri" })
        return
      }
      navigation.replace('Main', { agent })
    } catch {
      Toast.show({ type: 'error', text1: 'Agent topilmadi', text2: 'Kod yoki telefon raqamni tekshiring' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0d0300', '#1c0700', '#110400']} style={styles.container}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.logoBox}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🍽️</Text>
            </View>
            <Text style={styles.title}>YouIt Café</Text>
            <Text style={styles.subtitle}>Referal agent portali</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kirish</Text>
            <Text style={styles.cardSub}>Telefon raqam va agentlik kodingizni kiriting</Text>

            {/* Phone number */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>📱 Telefon raqam</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+998 90 000 00 00"
                placeholderTextColor="#6B3010"
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            {/* Agent code */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>🔑 Agentlik kodi (7 ta raqam)</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="0000000"
                placeholderTextColor="#6B3010"
                keyboardType="numeric"
                maxLength={7}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={[styles.enterBtn, loading && styles.enterBtnDisabled]}
              onPress={enter}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.enterBtnText}>Kirish →</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Agentlik kodini kassa xodimidan oling</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  circle1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(255,107,53,0.18)', top: -100, right: -100,
  },
  circle2: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,140,30,0.12)', bottom: -60, left: -80,
  },

  logoBox: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.4)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 30, fontWeight: '800', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,200,160,0.7)', fontWeight: '500' },

  card: {
    width: '100%', backgroundColor: 'rgba(20,7,1,0.82)',
    borderRadius: 20, padding: 24,
    borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.25)',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 13, color: 'rgba(255,200,160,0.55)', textAlign: 'center', marginBottom: 22 },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: 'rgba(255,180,120,0.8)', fontWeight: '600', marginBottom: 8 },

  input: {
    borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: 'white',
    backgroundColor: 'rgba(255,107,53,0.07)',
  },
  codeInput: {
    fontSize: 28, fontWeight: '900', letterSpacing: 8,
    paddingVertical: 16,
  },

  enterBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  enterBtnDisabled: { opacity: 0.55 },
  enterBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  footer: { fontSize: 13, color: 'rgba(255,180,120,0.45)', textAlign: 'center' },
})
