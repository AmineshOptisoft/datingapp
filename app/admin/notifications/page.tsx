"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { toast } from "sonner";
import { 
  Bell, Save, Plus, Trash2, Clock, Settings, AlertCircle, RefreshCw, BarChart2, CheckCircle2, XCircle
} from "lucide-react";

export default function NotificationsAdminPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [config, setConfig] = useState({
    isEnabled: true,
    maxNotificationsPerDay: 4,
    cooldownMinutes: 240,
    inactivityThresholdMinutes: 2,
    timeSlots: [{ startTime: "09:00", endTime: "22:00", label: "Daytime" }],
    templates: {
      titles: ["Miss you! 🥺"],
      bodies: ["${characterName} is waiting for your reply! 💕"],
      inChatMessages: ["Hey, I haven't heard from you in a while..."],
    },
    timezone: "Asia/Kolkata",
  });

  const [activeTab, setActiveTab] = useState<"general" | "templates">("general");

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [token]);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.schedule) {
        setConfig(data.schedule);
      }
    } catch (err) {
      toast.error("Failed to fetch scheduling configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/notifications/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Notification settings saved successfully");
        setConfig(data.schedule);
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = () => {
    setConfig({
      ...config,
      timeSlots: [...config.timeSlots, { startTime: "12:00", endTime: "13:00", label: "New Slot" }]
    });
  };

  const removeTimeSlot = (index: number) => {
    const newSlots = [...config.timeSlots];
    newSlots.splice(index, 1);
    setConfig({ ...config, timeSlots: newSlots });
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const newSlots = [...config.timeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setConfig({ ...config, timeSlots: newSlots });
  };

  const addTemplate = (type: "titles" | "bodies" | "inChatMessages") => {
    setConfig({
      ...config,
      templates: {
        ...config.templates,
        [type]: [...config.templates[type], "New message..."]
      }
    });
  };

  const removeTemplate = (type: "titles" | "bodies" | "inChatMessages", index: number) => {
    const newArr = [...config.templates[type]];
    newArr.splice(index, 1);
    setConfig({
      ...config,
      templates: {
        ...config.templates,
        [type]: newArr
      }
    });
  };

  const updateTemplate = (type: "titles" | "bodies" | "inChatMessages", index: number, value: string) => {
    const newArr = [...config.templates[type]];
    newArr[index] = value;
    setConfig({
      ...config,
      templates: {
        ...config.templates,
        [type]: newArr
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Bell className="w-6 h-6 text-pink-500" />
            Notification Scheduler
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Control when and how push notifications are sent to users.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>System Status:</span>
            <button 
              onClick={() => setConfig({...config, isEnabled: !config.isEnabled})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.isEnabled ? 'bg-green-500' : isDark ? 'bg-zinc-700' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.isEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
          <button 
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2 text-blue-500">
              <BarChart2 className="w-5 h-5" />
              <span className="font-semibold">Sent Today</span>
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.todaySent}</div>
            <div className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Total all time: {stats.totalSent}</div>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Inactivity Today</span>
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats.byType?.inactivity_reminder || 0}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2 text-red-500">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Failed Today</span>
            </div>
            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.todayFailed}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`flex gap-2 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "general" 
              ? "border-pink-500 text-pink-500" 
              : `border-transparent ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
          }`}
        >
          General & Scheduling
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "templates" 
              ? "border-pink-500 text-pink-500" 
              : `border-transparent ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
          }`}
        >
          Message Templates
        </button>
      </div>

      <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#111111]/80 border-white/10' : 'bg-white border-gray-200'}`}>
        
        {activeTab === "general" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Settings Group */}
              <div className="space-y-4">
                <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Settings className="w-4 h-4 text-pink-500" /> Limits & Thresholds
                </h3>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Max Notifications / Day / User
                  </label>
                  <input 
                    type="number" 
                    min="1" max="20"
                    value={config.maxNotificationsPerDay}
                    onChange={(e) => setConfig({...config, maxNotificationsPerDay: parseInt(e.target.value) || 1})}
                    className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-pink-500/50 ${
                      isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Cooldown Between Notifications (Minutes)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={config.cooldownMinutes}
                    onChange={(e) => setConfig({...config, cooldownMinutes: parseInt(e.target.value) || 1})}
                    className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-pink-500/50 ${
                      isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>E.g., 240 mins = 4 hours</p>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Inactivity Threshold (Minutes)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={config.inactivityThresholdMinutes}
                    onChange={(e) => setConfig({...config, inactivityThresholdMinutes: parseInt(e.target.value) || 1})}
                    className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-pink-500/50 ${
                      isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Triggers when user hasn't visited for this long.</p>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Clock className="w-4 h-4 text-blue-500" /> Active Time Slots
                  </h3>
                  <button 
                    onClick={addTimeSlot}
                    className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:bg-blue-500/10 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Slot
                  </button>
                </div>

                {config.timeSlots.length === 0 ? (
                  <div className={`p-4 rounded-xl text-center text-sm border border-dashed ${isDark ? 'border-white/20 text-zinc-500' : 'border-gray-300 text-gray-500'}`}>
                    No time slots configured. Notifications will be sent 24/7.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {config.timeSlots.map((slot, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border flex flex-col gap-2 relative ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                        <button 
                          onClick={() => removeTimeSlot(idx)}
                          className={`absolute top-2 right-2 p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="w-[85%]">
                          <input 
                            type="text" 
                            value={slot.label}
                            onChange={(e) => updateTimeSlot(idx, "label", e.target.value)}
                            placeholder="Label (e.g. Morning)"
                            className={`w-full px-2 py-1 mb-2 rounded text-sm border focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                              isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="time" 
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(idx, "startTime", e.target.value)}
                            className={`flex-1 px-2 py-1.5 rounded text-sm border focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                              isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <span className={isDark ? 'text-zinc-500' : 'text-gray-500'}>to</span>
                          <input 
                            type="time" 
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(idx, "endTime", e.target.value)}
                            className={`flex-1 px-2 py-1.5 rounded text-sm border focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
                              isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={`mt-4 p-3 rounded-lg flex gap-2 items-start text-xs ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Cron runs every 2 minutes. Time slots restrict the windows during which the cron is allowed to send inactivity pushes.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-8">
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Customize message variants. One will be picked randomly per notification. <br/>
              <span className="font-mono text-pink-500 bg-pink-500/10 px-1 rounded">{"${characterName}"}</span> will be replaced dynamically.
            </p>

            {/* Push Titles */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Push Titles</h3>
                <button 
                  onClick={() => addTemplate("titles")}
                  className="text-xs font-medium text-pink-500 hover:bg-pink-500/10 px-2 py-1 rounded transition-colors"
                >
                  + Add Title
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {config.templates.titles.map((tpl, idx) => (
                  <div key={idx} className="relative group">
                    <input 
                      type="text" 
                      value={tpl}
                      onChange={(e) => updateTemplate("titles", idx, e.target.value)}
                      className={`w-full pr-8 pl-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-pink-500 ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                    <button 
                      onClick={() => removeTemplate("titles", idx)}
                      className="absolute right-2 top-2 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Push Bodies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Push Message Bodies</h3>
                <button 
                  onClick={() => addTemplate("bodies")}
                  className="text-xs font-medium text-pink-500 hover:bg-pink-500/10 px-2 py-1 rounded transition-colors"
                >
                  + Add Message
                </button>
              </div>
              <div className="space-y-2">
                {config.templates.bodies.map((tpl, idx) => (
                  <div key={idx} className="relative group flex items-start">
                    <textarea 
                      value={tpl}
                      onChange={(e) => updateTemplate("bodies", idx, e.target.value)}
                      rows={1}
                      className={`w-full pr-8 pl-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-pink-500 resize-none ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                    <button 
                      onClick={() => removeTemplate("bodies", idx)}
                      className="absolute right-2 top-2 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* In App Messages */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  In-Chat Phantom Messages
                </h3>
                <button 
                  onClick={() => addTemplate("inChatMessages")}
                  className="text-xs font-medium text-pink-500 hover:bg-pink-500/10 px-2 py-1 rounded transition-colors"
                >
                  + Add Message
                </button>
              </div>
              <p className={`text-xs mb-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>These messages are silently injected into the character's chat history when a push is sent.</p>
              <div className="space-y-2">
                {config.templates.inChatMessages.map((tpl, idx) => (
                  <div key={idx} className="relative group flex items-start">
                    <textarea 
                      value={tpl}
                      onChange={(e) => updateTemplate("inChatMessages", idx, e.target.value)}
                      rows={2}
                      className={`w-full pr-8 pl-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-pink-500 resize-none ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                    <button 
                      onClick={() => removeTemplate("inChatMessages", idx)}
                      className="absolute right-2 top-2 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
