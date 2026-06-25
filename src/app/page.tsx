"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { stocks as mockStocks, sectors as mockSectors, defaultWatchlist, fetchAllMarketData, marketOverview as defaultMarketOverview, computeFeatureCards, computeIHSG, computeTotalTurnover, watchlistToFeatureCards } from "@/data/mock"
import { Stock, FundamentalData, TechnicalData, FlowData, AlertRule, AlertEvent, View } from "@/types"
import { loadRules, saveRules, runAlerts, loadEvents, saveEvents } from "@/lib/alerts"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import Topbar from "@/components/Topbar"
import Sidebar from "@/components/Sidebar"
import StockTable from "@/components/StockTable"
import Watchlist from "@/components/Watchlist"
import Heatmap from "@/components/Heatmap"
import TechnicalAnalysis from "@/components/TechnicalAnalysis"
import FundamentalAnalysis from "@/components/FundamentalAnalysis"
import FlowAnalysis from "@/components/FlowAnalysis"
import StockScreener from "@/components/StockScreener"
import Portfolio from "@/components/Portfolio"
import AlertsManager from "@/components/AlertsManager"
import StrategyHub from "@/components/StrategyHub"
import AuthModal from "@/components/AuthModal"
import ProfileEditModal from "@/components/ProfileEditModal"
import NotificationSettings from "@/components/NotificationSettings"
import BacktestPanel from "@/components/BacktestPanel"
import AIAssistant from "@/components/AIAssistant"
import HeroSection from "@/components/HeroSection"
import MarketOverview from "@/components/MarketOverview"
import FeatureCards from "@/components/FeatureCards"
import BottomNav from "@/components/BottomNav"

export default function Home() {
  const [view, setView] = useState<View>("table")
  const [search, setSearch] = useState("")
  const [syariahOnly, setSyariahOnly] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [watchlist, setWatchlist] = useState(defaultWatchlist)
  const [aiOpen, setAiOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [stocks, setStocks] = useState(mockStocks)
  const [sectors, setSectors] = useState(mockSectors)
  const [technicalData, setTechnicalData] = useState<Record<string, TechnicalData>>({})
  const [fundamentalData, setFundamentalData] = useState<Record<string, FundamentalData>>({})
  const [flowDataMap, setFlowDataMap] = useState<Record<string, FlowData>>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([])

  useEffect(() => { setAlertRules(loadRules()) }, [])
  useEffect(() => { setAlertEvents(loadEvents()) }, [])
  useEffect(() => { saveRules(alertRules) }, [alertRules])
  useEffect(() => { saveEvents(alertEvents) }, [alertEvents])

  const alertUnread = useMemo(() => alertEvents.filter(e => !e.read).length, [alertEvents])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const result = await fetchAllMarketData()
    setStocks(result.stocks)
    setSectors(result.sectors)
    setTechnicalData(result.technicalData)
    setFundamentalData(result.fundamentalData)
    setFlowDataMap(result.flowData)
    setLastUpdated(result.lastUpdated)
    setIsLoading(false)

    const rules = alertRules.length ? alertRules : loadRules()
    const newEvents = runAlerts(rules, result.stocks, result.technicalData, result.flowData)
    if (newEvents.length) {
      setAlertEvents(prev => [...newEvents, ...prev])
    }
  }, [alertRules])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 120000)
    return () => clearInterval(interval)
  }, [loadData])

  const filteredStocks = useMemo(() => {
    let result = stocks
    if (syariahOnly) result = result.filter(s => s.isSyariah)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, syariahOnly, stocks])

  const ihsgData = useMemo(() => computeIHSG(stocks), [stocks])
  const totalTurnover = useMemo(() => computeTotalTurnover(stocks), [stocks])
  const featureCards = useMemo(() => computeFeatureCards(stocks, technicalData, fundamentalData), [stocks, technicalData, fundamentalData])
  const watchlistCards = useMemo(() => watchlistToFeatureCards(watchlist), [watchlist])

  const toggleWatchlist = (stock: Stock) => {
    if (watchlist.some(w => w.stock.code === stock.code)) {
      setWatchlist(w => w.filter(i => i.stock.code !== stock.code))
    } else {
      setWatchlist(w => [...w, { id: crypto.randomUUID(), stock, addedAt: new Date().toISOString() }])
    }
  }

  const isInWatchlist = (code: string) => watchlist.some(w => w.stock.code === code)

  const handleSelectStock = (code: string) => {
    const s = stocks.find(st => st.code === code)
    if (s) { setSelectedStock(s); setView("table") }
  }

  function DataSyncer() {
    const { user, syncWatchlist } = useAuth()
    useEffect(() => {
      if (!user) return
      const timer = setTimeout(() => {
        syncWatchlist(watchlist.map(w => ({ id: w.id, stockCode: w.stock.code })))
      }, 5000)
      return () => clearTimeout(timer)
    }, [watchlist, user])
    return null
  }

  const handleToggleRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
  }

  const handleSetRuleStock = (ruleId: string, stockCode: string) => {
    setAlertRules(prev => prev.map(r => r.id === ruleId ? { ...r, stockCode } : r))
  }

  const handleResetRules = () => {
    const defaults = loadRules()
    setAlertRules(defaults.map(r => ({ ...r, enabled: false })))
  }

  const handleMarkRead = (eventId: string) => {
    setAlertEvents(prev => prev.map(e => e.id === eventId ? { ...e, read: true } : e))
  }

  const handleMarkAllRead = () => {
    setAlertEvents(prev => prev.map(e => ({ ...e, read: true })))
  }

  const handleClearEvents = () => {
    setAlertEvents([])
  }

  return (
    <AuthProvider>
      <DataSyncer />
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar view={view} setView={setView} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col min-w-0 relative pb-[60px] lg:pb-0">
        <Topbar
          search={search}
          setSearch={setSearch}
          syariahOnly={syariahOnly}
          setSyariahOnly={setSyariahOnly}
          aiOpen={aiOpen}
          setAiOpen={setAiOpen}
          isLoading={isLoading}
          alertUnread={alertUnread}
          onAlertsClick={() => setView("alerts")}
          onAuthClick={() => setAuthOpen(true)}
          onEditProfile={() => setProfileOpen(true)}
          onNotifications={() => setNotifOpen(true)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-5 lg:p-6 space-y-5">
          {view === "table" && (
            <div className="space-y-5 animate-fadeIn">
              <HeroSection ihsg={ihsgData} totalTurnover={totalTurnover} />
              <MarketOverview data={defaultMarketOverview} />
              <FeatureCards
                momentum={featureCards.momentum}
                undervalued={featureCards.undervalued}
                buyOnWeakness={featureCards.buyOnWeakness}
                watchlist={watchlistCards}
                onViewChange={setView}
                onSelectStock={handleSelectStock}
              />
              <StockTable
                stocks={filteredStocks}
                selectedStock={selectedStock}
                setSelectedStock={setSelectedStock}
                isInWatchlist={isInWatchlist}
                toggleWatchlist={toggleWatchlist}
                technicalData={technicalData}
                fundamentalData={fundamentalData}
              />
            </div>
          )}

          {view === "watchlist" && (
            <Watchlist
              items={watchlist}
              setSelectedStock={setSelectedStock}
              setView={setView}
              removeItem={(id) => setWatchlist(w => w.filter(i => i.id !== id))}
            />
          )}

          {view === "heatmap" && <Heatmap sectors={sectors} />}

          {view === "technical" && (
            <TechnicalAnalysis
              stock={selectedStock || stocks[0]}
              technicalData={technicalData}
            />
          )}

          {view === "fundamental" && (
            <FundamentalAnalysis
              stock={selectedStock || stocks[0]}
              fundamentalData={fundamentalData}
            />
          )}

          {view === "flow" && (
            <FlowAnalysis
              stocks={stocks}
              flowData={flowDataMap}
            />
          )}

          {view === "screener" && (
            <StockScreener
              stocks={stocks}
              technicalData={technicalData}
              fundamentalData={fundamentalData}
              flowData={flowDataMap}
              setSelectedStock={setSelectedStock}
              isInWatchlist={isInWatchlist}
              toggleWatchlist={toggleWatchlist}
            />
          )}

          {view === "portfolio" && (
            <Portfolio
              stocks={stocks}
              setSelectedStock={setSelectedStock}
            />
          )}

          {view === "alerts" && (
            <AlertsManager
              rules={alertRules}
              events={alertEvents}
              stocks={stocks}
              onToggleRule={handleToggleRule}
              onSetRuleStock={handleSetRuleStock}
              onReset={handleResetRules}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onClearEvents={handleClearEvents}
              onSelectStock={(code) => {
                const s = stocks.find(st => st.code === code)
                if (s) { setSelectedStock(s); setView("table") }
              }}
            />
          )}

          {view === "backtest" && <BacktestPanel />}

          {view === "strategies" && (
            <StrategyHub
              stocks={stocks}
              technicalData={technicalData}
              fundamentalData={fundamentalData}
              flowData={flowDataMap}
              onSelectStock={(code) => {
                const s = stocks.find(st => st.code === code)
                if (s) { setSelectedStock(s); setView("table") }
              }}
            />
          )}
        </main>
      </div>

      <AIAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        selectedStock={selectedStock}
        allStocks={stocks}
        technicalData={technicalData}
        fundamentalData={fundamentalData}
        flowData={flowDataMap}
      />

      <BottomNav view={view} setView={setView} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      {notifOpen && <NotificationSettings onClose={() => setNotifOpen(false)} />}
    </div>
    </AuthProvider>
  )
}
