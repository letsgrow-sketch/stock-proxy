"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { stocks as mockStocks, sectors as mockSectors, defaultWatchlist, fetchAllMarketData, computeMarketOverview, computeFeatureCards, computeIHSG, computeTotalTurnover, watchlistToFeatureCards, ihsgData as mockIhsgData, usdIdrData as mockUsdIdrData } from "@/data/mock"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [syariahOnly, setSyariahOnly] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [watchlist, setWatchlist] = useState(defaultWatchlist)
  const [aiOpen, setAiOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  const [stocks, setStocks] = useState(mockStocks)
  const [sectors, setSectors] = useState(mockSectors)
  const [technicalData, setTechnicalData] = useState<Record<string, TechnicalData>>({})
  const [fundamentalData, setFundamentalData] = useState<Record<string, FundamentalData>>({})
  const [flowDataMap, setFlowDataMap] = useState<Record<string, FlowData>>({})
  const [ihsgState, setIhsgState] = useState(mockIhsgData)
  const [usdIdrState, setUsdIdrState] = useState(mockUsdIdrData)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([])

  useEffect(() => { setAlertRules(loadRules()) }, [])
  useEffect(() => { setAlertEvents(loadEvents()) }, [])
  useEffect(() => { saveRules(alertRules) }, [alertRules])
  useEffect(() => { saveEvents(alertEvents) }, [alertEvents])

  const alertUnread = useMemo(() => alertEvents.filter(e => !e.read).length, [alertEvents])

  const alertRulesRef = useRef(alertRules)
  alertRulesRef.current = alertRules

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await fetchAllMarketData()
      setStocks(result.stocks)
      setSectors(result.sectors)
      setTechnicalData(result.technicalData)
      setFundamentalData(result.fundamentalData)
      setFlowDataMap(result.flowData)
      if (result.ihsg) setIhsgState(result.ihsg)
      if (result.usdIdr) setUsdIdrState(result.usdIdr)
      setLastUpdated(result.lastUpdated)

      const rules = alertRulesRef.current.length ? alertRulesRef.current : loadRules()
      const newEvents = runAlerts(rules, result.stocks, result.technicalData, result.flowData)
      if (newEvents.length) {
        setAlertEvents(prev => [...newEvents, ...prev])
      }
    } catch (error) {
      console.error("loadData failed:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const filteredStocks = useMemo(() => {
    console.log("[DEBUG filteredStocks] running searchQuery='%s' stocks.length=%d", searchQuery, stocks.length)
    const result = stocks.filter(stock => {
      const matchSearch =
       stock?.code?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
stock?.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
      const matchSyariah = !syariahOnly || stock.isSyariah === true
      const matchSector = !selectedSector || stock.sector === selectedSector
      return matchSearch && matchSyariah && matchSector
    })
    console.log("[DEBUG filteredStocks] before=%d after=%d codes=%s", stocks.length, result.length, result.map(s => s.code).join(","))
    return result
  }, [stocks, searchQuery, syariahOnly, selectedSector])

  const ihsgData = useMemo(() => computeIHSG(ihsgState, stocks), [ihsgState, stocks])
  const totalTurnover = useMemo(() => computeTotalTurnover(stocks), [stocks])
  const featureCards = useMemo(() => computeFeatureCards(stocks, technicalData, fundamentalData), [stocks, technicalData, fundamentalData])
  const marketOverview = useMemo(() => computeMarketOverview(stocks, sectors, usdIdrState), [stocks, sectors, usdIdrState])
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
    if (s) setSelectedStock(s)
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
          search={searchQuery}
          setSearch={setSearchQuery}
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
              <MarketOverview data={marketOverview} />
              <FeatureCards
                momentum={featureCards.momentum}
                undervalued={featureCards.undervalued}
                buyOnWeakness={featureCards.buyOnWeakness}
                watchlist={watchlistCards}
                onViewChange={setView}
                onSelectStock={handleSelectStock}
              />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stock..."
                  value={searchQuery}
                  onChange={(e) => { console.log("[DEBUG inlineSearch] onChange value='%s'", e.target.value); setSearchQuery(e.target.value) }}
                  className="w-full h-9 bg-surface-50 border border-border/50 rounded-lg pl-3 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-green/30 focus:ring-1 focus:ring-green/10 transition-all"
                />
              </div>
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
              selectedStock={selectedStock}
              setSelectedStock={setSelectedStock}
              setView={setView}
              removeItem={(id) => setWatchlist(w => w.filter(i => i.id !== id))}
            />
          )}

          {view === "heatmap" && (
            <Heatmap
              sectors={sectors}
              selectedSector={selectedSector}
              onSectorSelect={setSelectedSector}
            />
          )}

          {view === "technical" && (
            <TechnicalAnalysis
              stock={selectedStock || filteredStocks[0]}
              technicalData={technicalData}
            />
          )}

          {view === "fundamental" && (
            <FundamentalAnalysis
              stock={selectedStock || filteredStocks[0]}
              fundamentalData={fundamentalData}
            />
          )}

          {view === "flow" && (
            <FlowAnalysis
              stocks={filteredStocks}
              flowData={flowDataMap}
            />
          )}

          {view === "screener" && (
            <StockScreener
              stocks={filteredStocks}
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
              stocks={filteredStocks}
              setSelectedStock={setSelectedStock}
            />
          )}

          {view === "alerts" && (
            <AlertsManager
              rules={alertRules}
              events={alertEvents}
              stocks={filteredStocks}
              onToggleRule={handleToggleRule}
              onSetRuleStock={handleSetRuleStock}
              onReset={handleResetRules}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onClearEvents={handleClearEvents}
              onSelectStock={(code) => {
                const s = filteredStocks.find(st => st.code === code)
                if (s) setSelectedStock(s)
              }}
            />
          )}

          {view === "backtest" && <BacktestPanel />}

          {view === "strategies" && (
            <StrategyHub
              stocks={filteredStocks}
              technicalData={technicalData}
              fundamentalData={fundamentalData}
              flowData={flowDataMap}
              onSelectStock={(code) => {
                const s = filteredStocks.find(st => st.code === code)
                if (s) setSelectedStock(s)
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
