"use client";
import { useState } from "react";
import { Card3D } from "@/components/ui/3d-card";
import { BrandedButton } from "@/components/ui/branded-button";
import {
  Trophy,
  Gamepad2,
  Dices,
  Save,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { Logo } from "../ui/logo";

export function ModuleSettings() {
  const [modules, setModules] = useState({
    sports: true,
    virtual: true,
    casino: true,
  });

  const [saved, setSaved] = useState(false);
  const [betId] = useState(
    "GB-" + Math.random().toString(36).substr(2, 9).toUpperCase()
  );
  const [copiedBetId, setCopiedBetId] = useState(false);

  const toggleModule = (module) => {
    setModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
    setSaved(false);
  };

  const saveSettings = () => {
    // Save to localStorage or backend
    localStorage.setItem("moduleSettings", JSON.stringify(modules));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetSettings = () => {
    setModules({
      sports: true,
      virtual: true,
      casino: true,
    });
    setSaved(false);
  };

  const copyBetId = () => {
    navigator.clipboard.writeText(betId);
    setCopiedBetId(true);
    setTimeout(() => setCopiedBetId(false), 2000);
  };

  const moduleConfig = [
    {
      id: "sports",
      name: "Sports Betting",
      description: "Enable sports betting module with live matches and odds",
      icon: Trophy,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "virtual",
      name: "Virtual Games",
      description: "Enable virtual sports and instant games",
      icon: Gamepad2,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "casino",
      name: "Casino Games",
      description: "Enable casino games including slots, roulette, and more",
      icon: Dices,
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6 pt-2">
      <Card3D className="mb-8">
        <div className="glass p-4 sm:p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-2">Your Bet ID</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use this unique ID to track your bets and transactions
          </p>

          {/* Fixed width table container to prevent movement */}
          <div className="w-full overflow-hidden">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b-2 border-[#FFD700]">
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-[#FFD700] w-[25%]">
                    Field
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-[#FFD700] w-[50%]">
                    Value
                  </th>
                  <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-[#FFD700] w-[25%]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#2A3F55] hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2 sm:px-4 font-medium text-sm">
                    Bet ID
                  </td>
                  <td className="py-4 px-2 sm:px-4">
                    <code className="bg-[#1A2F45] px-2 sm:px-3 py-1 rounded text-[#FFD700] font-mono text-xs sm:text-sm break-all">
                      {betId}
                    </code>
                  </td>
                  <td className="py-4 px-2 sm:px-4">
                    <button
                      onClick={copyBetId}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-[#FFD700] text-[#0A1A2F] rounded font-bold text-xs sm:text-sm hover:bg-[#FFD700]/90 transition-colors whitespace-nowrap"
                    >
                      {copiedBetId ? (
                        <>
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-[#2A3F55] hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2 sm:px-4 font-medium text-sm">
                    Status
                  </td>
                  <td className="py-4 px-2 sm:px-4">
                    <span className="inline-block px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                      Active
                    </span>
                  </td>
                  <td className="py-4 px-2 sm:px-4 text-muted-foreground text-sm">
                    -
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2 sm:px-4 font-medium text-sm">
                    Created
                  </td>
                  <td className="py-4 px-2 sm:px-4 text-muted-foreground text-sm">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="py-4 px-2 sm:px-4 text-muted-foreground text-sm">
                    -
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card3D>

      {/* Save Status */}
      {saved && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400 text-center animate-pulse">
          Settings saved successfully!
        </div>
      )}

      {/* Module Toggles */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Module Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enable or disable betting modules
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {moduleConfig.map((module) => (
          <Card3D key={module.id}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${module.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                  >
                    <module.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule(module.id)}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                    modules[module.id] ? "bg-primary" : "bg-card/50"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                      modules[module.id] ? "translate-x-8" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card3D>
        ))}
      </div>

      {/* Module Status Summary */}
      <Card3D className="mb-8">
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Active Modules</h3>
          <div className="grid grid-cols-3 gap-4">
            {moduleConfig.map((module) => (
              <div key={module.id} className="text-center">
                <div
                  className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    modules[module.id]
                      ? `bg-gradient-to-r ${module.color}`
                      : "bg-card/50"
                  }`}
                >
                  <module.icon
                    className={`w-6 h-6 ${
                      modules[module.id]
                        ? "text-white"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="text-xs font-medium">
                  {module.name.split(" ")[0]}
                </div>
                <div
                  className={`text-xs ${
                    modules[module.id] ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {modules[module.id] ? "Active" : "Disabled"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card3D>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <BrandedButton
          variant="primary"
          className="flex items-center justify-center gap-2 cursor-pointer"
          onClick={saveSettings}
        >
          <div className="flex items-center justify-between gap-4">
            <p>Save </p>
            <Save className="w-5 h-5" />
          </div>
        </BrandedButton>
        <BrandedButton
          variant="secondary"
          className="flex items-center justify-center gap-2 px-6 cursor-pointer"
          onClick={resetSettings}
        >
          <div className="flex items-center justify-between gap-4">
            <p>Reset</p>
            <RotateCcw className="w-5 h-5" />
          </div>
        </BrandedButton>
      </div>

      {/* Info Card */}
      <Card3D className="my-8">
        <div className="glass p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <h3 className="font-bold mb-2">About Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your betting experience by managing your Bet ID and
            enabling or disabling specific features. Changes will take effect
            immediately after saving.
          </p>
        </div>
      </Card3D>
    </div>
  );
}
