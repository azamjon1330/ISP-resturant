import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { agentAPI } from '../api'
import Toast from 'react-native-toast-message'

export default function WelcomeScreen({ navigation }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const enter = async () => {
    if (code.trim().length !== 7) {
      Toast.show({ type: 'error', text1: 'Хато', text2: '7 рақамли кодни киритинг' })
      return
    }
    setLoading(true)
    try {
      const res = await agentAPI.getByCode(code.trim())
      navigation.replace('Main', { agent: res.data })
    } catch {
      Toast.show({ type: 'error', text1: 'Агент топилмади', text2: 'Кодни текширинг' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#FFF4EF', '#FFFFFF', '#FFF4EF']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.logoBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🍽️</Text>
          </View>
          <Text style={styles.title}>YouIt Café</Text>
          <Text style={styles.subtitle}>Реферал агент портали</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Агент кодини киритинг</Text>
          <Text style={styles.cardSub}>Сизга берилган 7 рақамли кодни киритинг</Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            placeholder="0000000"
            placeholderTextColor="#D1D5DB"
            keyboardType="numeric"
            maxLength={7}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.enterBtn, loading && styles.enterBtnDisabled]}
            onPress={enter}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.enterBtnText}>Кириш →</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Агент кодини кассадан олинг</Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  logoBox: { alignItems: 'center', marginBottom: 36 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#FFF4EF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },

  card: {
    width: '100%', backgroundColor: 'white',
    borderRadius: 20, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6, textAlign: 'center' },
  cardSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 },

  codeInput: {
    borderWidth: 2, borderColor: '#E5E7EB',
    borderRadius: 14, padding: 16,
    fontSize: 28, fontWeight: '900',
    color: '#111827', letterSpacing: 8,
    marginBottom: 16,
  },

  enterBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  enterBtnDisabled: { opacity: 0.6 },
  enterBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },

  footer: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
})
