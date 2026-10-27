import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'
import DashboardLayout from '../components/DashboardLayout'
import ChatList from '../components/ChatList'

const Messages = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  return (
    <DashboardLayout>
      <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 500, margin: '0 0 28px' }}>{t.chat.inboxTitle}</h1>
      <ChatList user={user} t={t} navigate={navigate} limit={100} includeClosed />
    </DashboardLayout>
  )
}

export default Messages
