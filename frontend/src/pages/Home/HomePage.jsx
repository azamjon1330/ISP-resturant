import React from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, ChefHat, ShieldCheck } from 'lucide-react'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <div className="home-bg" />
      <div className="home-content">
        <div className="home-logo">
          <UtensilsCrossed size={48} color="#FF6B35" />
          <h1>YouIt Café</h1>
          <p>Миллий таомлар кафеси</p>
        </div>

        <div className="home-panels">
          <button className="home-panel" onClick={() => navigate('/cashier')}>
            <div className="panel-icon orange">
              <UtensilsCrossed size={32} />
            </div>
            <h2>Касса</h2>
            <p>Заказ қабул қилиш ва тайёрлаш</p>
          </button>

          <button className="home-panel" onClick={() => navigate('/kitchen')}>
            <div className="panel-icon green">
              <ChefHat size={32} />
            </div>
            <h2>Ошпаз</h2>
            <p>Буюртмаларни кўриш ва бошқариш</p>
          </button>

          <button className="home-panel" onClick={() => navigate('/admin')}>
            <div className="panel-icon gray">
              <ShieldCheck size={32} />
            </div>
            <h2>Админ</h2>
            <p>Бошқарув панели</p>
          </button>
        </div>
      </div>
    </div>
  )
}
