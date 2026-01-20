"use client";
import { useState, useEffect, memo } from "react";
import { useTenant } from "@/components/providers/tenant-provider";
import { useAuth } from "@/hooks/useAuth";
import { useBetState } from "@/lib/bet-state";
import { PromotionalBanner } from "@/components/ui/promotional-banner";
import { GuestNudgeBlock } from "@/components/guest/guest-nudge-blocks";
import BottomNavigation from "@/components/ui/bottom-navigation";
import { MatchDetailsModal } from "./match-details-modal";
import { useLiveEvents } from "@/hooks/useEvents";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  ThemedHeroSection,
  ThemedSportsGrid,
  ThemedMatchCard,
  ThemedLiveMatchRow,
  ThemedSectionHeader,
} from "./themed-sections";
import {
  MenuIcon,
  X,
  MonitorDot,
  Trophy,
  PhoneCall as Football,
  Dices,
  ReplyAll as Volleyball,
  Medal,
  Gamepad2,
  Target,
  Bike,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

const featuredMatches = [
  {
    id: 1,
    teams: "BRENTFORD V MAN UTD",
    league: "Premier League",
    betBoost: "BET BOOST",
    placed: "673 placed",
    markets: [
      { type: "Both Teams to Receive 2+ Cards", odds: null },
      { type: "Both Teams to Score", odds: null },
      { type: "Over 1 Corners in the 1st Half for Brentford", odds: null },
    ],
    mainOdds: { was: "15.00", now: "17.00", returns: "$10 stake returns $170" },
    time: "Sat 27 Sep",
  },
  {
    id: 2,
    teams: "CHELSEA V BRIGHTON",
    league: "Premier League",
    betBoost: "BET BOOST",
    placed: "314 placed",
    markets: [
      { type: "Joao Pedro: 2+ Shots on Target", odds: null },
      { type: "Pedro Neto: 2+ Shots on Target", odds: null },
    ],
    mainOdds: { was: "7.50", now: "8.50", returns: "$10 stake returns $85" },
    time: "Sat 27 Sep",
  },
  {
    id: 3,
    teams: "ARSENAL V LIVERPOOL",
    league: "Premier League",
    betBoost: "BET BOOST",
    placed: "892 placed",
    markets: [
      { type: "Both Teams to Score", odds: null },
      { type: "Over 2.5 Goals", odds: null },
    ],
    mainOdds: { was: "9.00", now: "11.00", returns: "$10 stake returns $110" },
    time: "Sun 28 Sep",
  },
  {
    id: 4,
    teams: "REAL MADRID V BARCELONA",
    league: "La Liga",
    betBoost: "BET BOOST",
    placed: "1245 placed",
    markets: [
      { type: "Vinicius Jr: 1+ Shots on Target", odds: null },
      { type: "Robert Lewandowski: Anytime Goalscorer", odds: null },
    ],
    mainOdds: { was: "14.00", now: "16.50", returns: "$10 stake returns $165" },
    time: "Sun 28 Sep",
  },
];

const sportIcons = [
  { id: "cricket", name: "Cricket", icon: Trophy, slug: "cricket" },
  { id: "soccer", name: "Soccer", icon: Football, slug: "soccer" },
  {
    id: "casino",
    name: "Casino",
    icon: Dices,
    slug: "casino",
    isExternal: true,
    href: "/casino",
  },
  {
    id: "volleyball",
    name: "Volleyball",
    icon: Volleyball,
    slug: "volleyball",
  },
  { id: "boxing", name: "Boxing", icon: Medal, slug: "boxing" },
  { id: "esports", name: "E-Sports", icon: Gamepad2, slug: "esports" },
  { id: "darts", name: "Darts", icon: Target, slug: "darts" },
  { id: "cycling", name: "Cycling", icon: Bike, slug: "cycling" },
];

const MemoizedMatchCard = memo(ThemedMatchCard);
const MemoizedLiveMatchRow = memo(ThemedLiveMatchRow);

function HomepageContent() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const {
    theme: tenant,
    brandName,
    primaryColor,
    secondaryColor,
    logoUrl,
  } = useTenant(); // Renamed `theme` to `tenant` to avoid conflict with the new `currentTheme` variable
  const { colors, styles } = useThemeColors();
  const { addBet } = useBetState();
  const { liveEvents, upcomingEvents, loading: liveLoading } = useLiveEvents();
  const { t } = useLanguage();

  const [activeSportFilter, setActiveSportFilter] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sports, setSports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null); // Declare selectedSport variable

  const displayName = brandName || "GoalBet";
  const casinoLink = isAuthenticated ? "/casino" : "/casino";

  const transformedLiveMatches = (liveEvents || []).map((event) => {
    const homeTeam = event.homeTeam?.name || event.homeTeam || "Home";
    const awayTeam = event.awayTeam?.name || event.awayTeam || "Away";
    const homeScore = event.score?.home || 0;
    const awayScore = event.score?.away || 0;

    // Get odds from event
    const matchOdds = event.odds?.["1X2"] || event.odds?.["Match Winner"] || {};
    const odds = [
      matchOdds.home?.toFixed(2) || "2.00",
      matchOdds.draw?.toFixed(2) || "3.00",
      matchOdds.away?.toFixed(2) || "3.50",
    ];

    return {
      id: event._id || event.id,
      _id: event._id || event.id,
      team1: homeTeam,
      team2: awayTeam,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      score1: homeScore,
      score2: awayScore,
      odds: odds,
      time: event.liveInfo?.minute
        ? `${event.liveInfo.minute}'`
        : event.matchTime || "LIVE",
      sportId: event.sportId?._id || event.sportId,
      leagueId: event.leagueId?._id || event.leagueId,
      originalEvent: event,
    };
  });

  useEffect(() => {
    fetchSports();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [activeSportFilter]);

  const fetchSports = async () => {
    try {
      setLoadingSports(true);
      const response = await fetch("/api/sports");
      if (response.ok) {
        const result = await response.json();
        console.log("[v0] Fetched sports:", result);
        setSports(
          result.success && Array.isArray(result.data) ? result.data : []
        );
      } else {
        setSports([]);
      }
    } catch (error) {
      console.error("[v0] Error fetching sports:", error);
      setSports([]);
    } finally {
      setLoadingSports(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      let url = "/api/sandbox/sports/events?status=scheduled&limit=20";
      if (activeSportFilter) {
        url += `&sportId=${activeSportFilter}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        console.log("[v0] Fetched matches:", result);
        const bettableMatches =
          result.success && Array.isArray(result.data)
            ? result.data.filter(
                (match) =>
                  match.status === "scheduled" || match.status === "live"
              )
            : [];
        setMatches(bettableMatches);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error("[v0] Error fetching matches:", error);
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSportClick = (sportId) => {
    if (activeSportFilter === sportId) {
      setActiveSportFilter(null);
    } else {
      setActiveSportFilter(sportId);
    }
  };

  const addToBetslip = (match, selectionType, odds) => {
    const homeTeam =
      match.homeTeam?.name || match.homeTeam || match.team1 || "Home";
    const awayTeam =
      match.awayTeam?.name || match.awayTeam || match.team2 || "Away";

    const selection = {
      eventId: match._id || match.id,
      eventName: `${homeTeam} vs ${awayTeam}`,
      market: "Match Winner",
      selection:
        selectionType === "1"
          ? homeTeam
          : selectionType === "X"
          ? "Draw"
          : awayTeam,
      odds: typeof odds === "string" ? Number.parseFloat(odds) : odds,
      sportId: match.sportId,
      leagueId: match.leagueId,
      league: match.league?.name || match.league || "Unknown League",
      isLive: true,
    };

    console.log("[v0] Adding live bet to betslip:", selection);
    addBet(selection);

    // Also dispatch event for guest betslip
    window.dispatchEvent(new CustomEvent("addGuestBet", { detail: selection }));
  };

  const openMatchDetails = (match) => {
    setSelectedMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleBetNow = (match) => {
    console.log("[v0] Bet Now clicked for match:", match);

    const homeTeam = match.homeTeam?.name || match.homeTeam;
    const awayTeam = match.awayTeam?.name || match.awayTeam;
    const boostedOdds = match.boostedOdds || match.odds?.home || 2.5;

    // Create bet object
    const bet = {
      id: `${match._id || match.id}-boost`,
      match: `${homeTeam} vs ${awayTeam}`,
      league: match.league?.name || match.league || "Unknown League",
      selection: "Bet Boost Combo",
      odds: Number.parseFloat(boostedOdds),
      stake: 10,
      eventId: match._id || match.id,
      marketName: "Bet Boost",
    };

    console.log("[v0] Dispatching addGuestBet event with:", bet);

    // Dispatch event for FloatingGuestBetslip
    window.dispatchEvent(new CustomEvent("addGuestBet", { detail: bet }));

    // Also add to state
    addBet(bet);
  };

  const loading = authLoading || loadingSports || loadingMatches || liveLoading;

  if (loading) {
    return (
      <div className="w-full mt-16 sm:mt-20 md:mt-24 pb-24 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="py-6 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse" style={{ color: colors.accent }}>
            {t("loading")}...
          </div>
        </div>
      </div>
    );
  }

  const currentTheme = tenant?.designId || "classic";

  return (
    <div className="min-h-screen" style={styles.pageBg}>
      <div className="w-full mt-16 sm:mt-20 md:mt-24 pb-24 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="py-6">
          {currentTheme === "classic" ? (
            // CLASSIC THEME - Sidebar layout
            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
              {/* Left Sidebar */}
              <div
                className={`${
                  mobileSidebarOpen
                    ? "fixed inset-0 z-40 backdrop-blur-sm"
                    : "hidden"
                } lg:block lg:w-64 lg:flex-shrink-0 lg:static`}
                style={
                  mobileSidebarOpen
                    ? { backgroundColor: `${colors.bgDark}f2` }
                    : {}
                }
              >
                <div
                  className={`${
                    mobileSidebarOpen ? "mt-10 w-64 h-full overflow-y-auto p-4" : ""
                  } lg:w-full`}
                >
                  {mobileSidebarOpen && (
                    <button
                      onClick={() => setMobileSidebarOpen(false)}
                      className="lg:hidden fixed top-4 right-4 p-3 rounded-full backdrop-blur-md shadow-lg z-[50]"
                      style={{
                        backgroundColor: `${colors.bgCard}dd`,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                      aria-label="Close sidebar"
                    >
                      {/* <X className="w-5 h-5 text-red-600" /> */}
                    </button>
                  )}

                  {/* Offers Section */}
                  <div
                    className="backdrop-blur-sm border rounded-xl p-4 shadow-xl mb-4 mt-28 lg:mt-0"
                    style={{
                      backgroundColor: `${colors.bgCard}cc`,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.accent }}
                      >
                        <span
                          style={{ color: colors.accentForeground }}
                          className="text-xs font-bold"
                        >
                          $
                        </span>
                      </div>
                      <h3
                        className="font-semibold"
                        style={{ color: colors.text }}
                      >
                        Offers
                      </h3>
                    </div>
                  </div>

                  {/* Most Used Section */}
                  <div
                    className="backdrop-blur-sm border rounded-xl p-4 shadow-xl mb-4"
                    style={{
                      backgroundColor: `${colors.bgCard}cc`,
                      borderColor: colors.border,
                    }}
                  >
                    <h3
                      className="font-semibold mb-3"
                      style={{ color: colors.accent }}
                    >
                      MOST USED
                    </h3>
                    <div className="space-y-1">
                      <div
                        className="font-semibold mb-2"
                        style={{ color: colors.textMuted }}
                      >
                        A-Z
                      </div>
                      {sportIcons.map((sport) => (
                        <button
                          key={sport.id}
                          onClick={() => {
                            setSelectedSport(sport.id);
                            setMobileSidebarOpen(false);
                          }}
                          className="w-full flex items-center space-x-2 p-2 rounded text-left transition-colors"
                          style={{
                            backgroundColor:
                              selectedSport === sport.id
                                ? colors.accent
                                : "transparent",
                            color:
                              selectedSport === sport.id
                                ? colors.accentForeground
                                : colors.textMuted,
                          }}
                        >
                          <span className="text-sm">{sport.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="relative mt-8">
                {/* Mobile Sidebar Toggle */}
                {/* <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden mb-4 w-full backdrop-blur-sm border rounded-xl p-3 flex items-center justify-center space-x-2 transition-colors"
                  style={{
                    backgroundColor: `${colors.bgCard}cc`,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <MenuIcon className="w-5 h-5" />
                  <span>{t("browseSports")}</span>
                </button> */}

                <button
                  onClick={() => setMobileSidebarOpen((prev) => !prev)}
                  className="lg:hidden absolute top-0 left-0 z-50 w-10 h-10 border border-[#FFD700]/30 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all"
                  style={{
                    backgroundColor: `${colors.bgCard}dd`,
                    // border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  aria-label="Toggle sidebar"
                >
                  {mobileSidebarOpen ? (
                    <X className="w-5 h-5 right-20 top-20 z-50" />
                  ) : (
                    <MenuIcon className="w-5 h-5" />
                  )}
                </button>
                <PromotionalBanner />

                <ThemedHeroSection
                  displayName={displayName}
                  isAuthenticated={isAuthenticated}
                  t={t}
                  colors={colors}
                />

                <ThemedSportsGrid
                  sports={sports}
                  loadingSports={loadingSports}
                  activeSportFilter={activeSportFilter}
                  handleSportClick={handleSportClick}
                  getSportEmoji={(sportName) => {
                    switch (sportName.toLowerCase()) {
                      case "soccer":
                        return "⚽";
                      case "cricket":
                        return "🏏";
                      case "tennis":
                        return "🎾";
                      case "basketball":
                        return "🏀";
                      case "esports":
                        return "🎮";
                      case "boxing":
                        return "🥊";
                      case "golf":
                        return "⛳";
                      case "cycling":
                        return "🚴";
                      case "virtual":
                        return "🖥️";
                      case "horses":
                        return "🐎";
                      default:
                        return "❓";
                    }
                  }}
                  t={t}
                  colors={colors}
                />

                {/* Featured Matches */}
                <div className="mb-6 md:mb-8">
                  <ThemedSectionHeader
                    title={t("featuredMatches")}
                    viewAllHref="/sports"
                    viewAllText={t("viewAll")}
                    colors={colors}
                  />

                  {loadingMatches ? (
                    <div className="flex items-center justify-center py-12">
                      <div
                        className="animate-pulse"
                        style={{ color: colors.accent }}
                      >
                        {t("loadingMatches")}
                      </div>
                    </div>
                  ) : !matches || matches.length === 0 ? (
                    <div className="text-center py-12">
                      <p style={{ color: colors.textMuted }} className="mb-4">
                        {t("noMatchesAvailable")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {matches.slice(0, 8).map((match) => (
                        <MemoizedMatchCard
                          key={match._id || match.id}
                          match={match}
                          onBetNow={handleBetNow}
                          onViewDetails={setSelectedMatch}
                          t={t}
                          colors={colors}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Matches */}
                <div className="mb-6 md:mb-8">
                  <ThemedSectionHeader
                    title={t("liveMatches")}
                    icon={MonitorDot}
                    viewAllHref="/in-play"
                    viewAllText={t("viewAll")}
                    colors={colors}
                  />

                  <div className="space-y-3">
                    {liveLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2
                          className="w-8 h-8 animate-spin"
                          style={{ color: colors.accent }}
                        />
                      </div>
                    ) : transformedLiveMatches.length > 0 ? (
                      transformedLiveMatches
                        .slice(0, 5)
                        .map((match) => (
                          <MemoizedLiveMatchRow
                            key={match.id}
                            match={match}
                            onAddToBetslip={addToBetslip}
                            colors={colors}
                          />
                        ))
                    ) : (
                      <div
                        className="text-center py-12 rounded-xl border"
                        style={{
                          backgroundColor: `${colors.bgCard}50`,
                          borderColor: colors.border,
                        }}
                      >
                        <MonitorDot
                          className="w-12 h-12 mx-auto mb-4 opacity-50"
                          style={{ color: colors.textMuted }}
                        />
                        <p style={{ color: colors.textMuted }}>
                          {t("noLiveMatchesAvailable") ||
                            "No live matches available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!isAuthenticated && <GuestNudgeBlock />}
              </div>
            </div>
          ) : (
            // MODERN & NEON THEMES - Full width layout (no sidebar)
            <div className="max-w-7xl mx-auto">
              <PromotionalBanner />

              <ThemedHeroSection
                displayName={displayName}
                isAuthenticated={isAuthenticated}
                t={t}
                colors={colors}
              />

              <ThemedSportsGrid
                sports={sportIcons}
                loadingSports={loadingSports}
                activeSportFilter={activeSportFilter}
                handleSportClick={handleSportClick}
                getSportEmoji={(sportName) => {
                  switch (sportName.toLowerCase()) {
                    case "soccer":
                      return "⚽";
                    case "cricket":
                      return "🏏";
                    case "tennis":
                      return "🎾";
                    case "basketball":
                      return "🏀";
                    case "esports":
                      return "🎮";
                    case "boxing":
                      return "🥊";
                    case "golf":
                      return "⛳";
                    case "cycling":
                      return "🚴";
                    case "virtual":
                      return "🖥️";
                    case "horses":
                      return "🐎";
                    default:
                      return "❓";
                  }
                }}
                t={t}
                colors={colors}
              />

              {/* Featured Matches */}
              <div className="mb-8">
                <ThemedSectionHeader
                  title={t("featuredMatches")}
                  viewAllHref="/sports"
                  viewAllText={t("viewAll")}
                  colors={colors}
                />

                {loadingMatches ? (
                  <div className="flex items-center justify-center py-12">
                    <div
                      className="animate-pulse"
                      style={{ color: colors.accent }}
                    >
                      {t("loadingMatches")}
                    </div>
                  </div>
                ) : !matches || matches.length === 0 ? (
                  <div className="text-center py-12">
                    <p style={{ color: colors.textMuted }} className="mb-4">
                      {t("noMatchesAvailable")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {matches.slice(0, 8).map((match) => (
                      <MemoizedMatchCard
                        key={match._id || match.id}
                        match={match}
                        onBetNow={handleBetNow}
                        onViewDetails={setSelectedMatch}
                        t={t}
                        colors={colors}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Live Matches */}
              <div className="mb-8">
                <ThemedSectionHeader
                  title={t("liveMatches")}
                  icon={MonitorDot}
                  viewAllHref="/in-play"
                  viewAllText={t("viewAll")}
                  colors={colors}
                />

                <div className="space-y-3">
                  {liveLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2
                        className="w-8 h-8 animate-spin"
                        style={{ color: colors.accent }}
                      />
                    </div>
                  ) : transformedLiveMatches.length > 0 ? (
                    transformedLiveMatches
                      .slice(0, 5)
                      .map((match) => (
                        <MemoizedLiveMatchRow
                          key={match.id}
                          match={match}
                          onAddToBetslip={addToBetslip}
                          colors={colors}
                        />
                      ))
                  ) : (
                    <div
                      className="text-center py-12 rounded-xl border"
                      style={{
                        backgroundColor: `${colors.bgCard}50`,
                        borderColor: colors.border,
                      }}
                    >
                      <MonitorDot
                        className="w-12 h-12 mx-auto mb-4 opacity-50"
                        style={{ color: colors.textMuted }}
                      />
                      <p style={{ color: colors.textMuted }}>
                        {t("noLiveMatchesAvailable") ||
                          "No live matches available"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="mb-8">
                  <ThemedSectionHeader
                    title={t("upcoming") || "Upcoming"}
                    viewAllHref="/sports"
                    viewAllText={t("viewAll")}
                    colors={colors}
                  />

                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 5).map((event) => (
                      <MemoizedLiveMatchRow
                        key={event.id}
                        match={event}
                        onAddToBetslip={addToBetslip}
                        colors={colors}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!isAuthenticated && <GuestNudgeBlock />}
            </div>
          )}
        </div>
      </div>

      {/* Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatch}
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        language={undefined}
      />

      <BottomNavigation activeTab="sports" />
    </div>
  );
}

export default HomepageContent;
export { HomepageContent };
