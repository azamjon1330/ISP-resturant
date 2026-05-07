import React from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <div className="home-pattern" />
      <div className="home-content">
        <div className="home-hero">
          <div className="home-emoji-row">
            🍽️ 🥘 🍜
          </div>
          <h1>YouIt Café</h1>
          <p>Миллий таомлар кафеси бошқарув тизими</p>
          <div className="home-divider" />
        </div>

        <div className="home-panels">
          <button className="home-panel" onClick={() => navigate('/cashier')}>
            <div className="panel-emoji">🧾</div>
            <h2>Кассир</h2>
            <p>Буюртма қабул қилиш ва тўлов</p>
            <span className="panel-arrow">→</span>
          </button>

          <button className="home-panel" onClick={() => navigate('/kitchen')}>
            <div className="panel-emoji">👨‍🍳</div>
            <h2>Ошпазхона</h2>
            <p>Буюртмаларни кўриш ва тайёрлаш</p>
            <span className="panel-arrow">→</span>
          </button>

          <button className="home-panel" onClick={() => navigate('/admin')}>
            <div className="panel-emoji">⚙️</div>
            <h2>Бошқарув</h2>
            <p>Админ панели ва аналитика</p>
            <span className="panel-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
