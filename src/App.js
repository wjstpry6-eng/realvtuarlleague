import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Trophy,
  Gamepad2,
  Swords,
  BarChart3,
  PlusCircle,
  Trash2,
  User,
  Users,
  Loader2,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  Camera,
  X,
  Activity,
  Crown,
  Clover,
  Gem,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Shield,
  Ticket,
  Plus,
  Minus,
  Search,
  Filter,
  Heart,
  PieChart,
  Tv,
  Edit,
  Coins,
  Star,
  Target,
  Settings,
  Layers,
  Megaphone,
  CheckSquare,
  Menu,
  ArrowLeft,
  Copy,
  Link2,
  Sparkles,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
  increment,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  writeBatch,
} from "firebase/firestore";

// --- Firebase 초기화 ---
const fallbackConfig = {
  apiKey: "AIzaSyDQ4quZh90YTXSqut2nrPXnpQ4E_XO-2rk",
  authDomain: "virtual-league-f72fb.firebaseapp.com",
  projectId: "virtual-league-f72fb",
  storageBucket: "virtual-league-f72fb.firebasestorage.app",
  messagingSenderId: "911374464561",
  appId: "1:911374464561:web:b2021383cc764e232e8710",
  measurementId: "G-4STYYKEXFR",
};
const firebaseConfig =
  typeof __firebase_config !== "undefined" && __firebase_config
    ? JSON.parse(__firebase_config)
    : fallbackConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId =
  typeof __app_id !== "undefined" ? __app_id : "virtual-league-dev-final";

// ★ 실전용 상대평가 티어 설정 (S+ ~ D 총 7단계로 세분화) ★
const TIER_SETTINGS = [
  {
    id: "S+",
    name: "S+ 티어",
    color: "bg-red-800",
    percent: 5,
    label: "상위 5%",
  },
  {
    id: "S",
    name: "S 티어",
    color: "bg-red-500",
    percent: 15,
    label: "상위 6% ~ 15%",
  },
  {
    id: "A+",
    name: "A+ 티어",
    color: "bg-orange-600",
    percent: 30,
    label: "상위 16% ~ 30%",
  },
  {
    id: "A",
    name: "A 티어",
    color: "bg-orange-400",
    percent: 45,
    label: "상위 31% ~ 45%",
  },
  {
    id: "B",
    name: "B 티어",
    color: "bg-yellow-500",
    percent: 65,
    label: "상위 46% ~ 65%",
  },
  {
    id: "C",
    name: "C 티어",
    color: "bg-green-500",
    percent: 85,
    label: "상위 66% ~ 85%",
  },
  {
    id: "D",
    name: "D 티어",
    color: "bg-blue-500",
    percent: 100,
    label: "하위 15%",
  },
];

// ★ WOW 고유 직업 색상 사전 정의 ★
const WOW_CLASS_COLORS = {
  전사: "#C79C6E",
  사제: "#FFFFFF",
  도적: "#FFF569",
  성기사: "#F58CBA",
  사냥꾼: "#ABD473",
  주술사: "#0070DE",
  마법사: "#69CCF0",
  흑마: "#9482C9",
  흑마법사: "#9482C9",
  드루: "#FF7D0A",
  드루이드: "#FF7D0A",
  죽음의기사: "#C41E3A",
  수도사: "#00FF96",
  악마사냥꾼: "#A330C9",
  기원사: "#33937F",
};
const fallbackColors = ["#94a3b8", "#cbd5e1", "#64748b"];

// ★ 직업 뱃지에 파스텔 톤 반투명 효과를 주는 마법의 함수 ★
const getJobBadgeStyle = (jobClass) => {
  const hex = WOW_CLASS_COLORS[jobClass] || "#94a3b8";
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return {
    color: hex,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
  };
};

const RAID_SLOT_SIZE = 5;
const RAID_TYPE_OPTIONS = [
  { id: "10", label: "10인", groupCount: 2, totalSlots: 10 },
  { id: "20", label: "20인", groupCount: 4, totalSlots: 20 },
  { id: "25", label: "25인", groupCount: 5, totalSlots: 25 },
  { id: "40", label: "40인", groupCount: 8, totalSlots: 40 },
];
const DEFAULT_RAID_TYPE = "40";
const GUILD_MASTER_ID = "__guild_master_woowakgood__";
const GUILD_MASTER_MEMBER = {
  id: GUILD_MASTER_ID,
  streamerName: "우왁굳",
  wowNickname: "길드장 우왁굳",
  jobClass: "성기사",
  level: 60,
  isGuildMaster: true,
};

const RAID_LEVEL_FILTER_OPTIONS = [
  { id: "50+", label: "50+" },
  { id: "50-59", label: "50-59" },
  { id: "60-69", label: "60-69" },
  { id: "70", label: "70" },
];

const RAID_ROLE_OPTIONS = [
  {
    id: "raidLeader",
    label: "공대장",
    iconKey: "crown",
    toneClass: "text-amber-300",
    chipClass: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  },
  {
    id: "mainTank",
    label: "메인탱커",
    iconKey: "shield",
    toneClass: "text-sky-300",
    chipClass: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  },
  {
    id: "subTank",
    label: "서브탱커",
    iconKey: "swords",
    toneClass: "text-orange-300",
    chipClass: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  },
  {
    id: "mainHealer",
    label: "메인힐러",
    iconKey: "sparkles",
    toneClass: "text-violet-300",
    chipClass: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  },
  {
    id: "subHealer",
    label: "서브힐러",
    iconKey: "heart",
    toneClass: "text-rose-300",
    chipClass: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  },
];

const getRaidRoleMeta = (roleId) =>
  RAID_ROLE_OPTIONS.find((role) => role.id === roleId) || null;

const renderRaidRoleIcon = (roleId, className = "w-3.5 h-3.5") => {
  const roleMeta = getRaidRoleMeta(roleId);
  const iconClassName = `${className} ${roleMeta?.toneClass || "text-white"}`;

  switch (roleMeta?.iconKey) {
    case "crown":
      return <Crown className={iconClassName} />;
    case "shield":
      return <Shield className={iconClassName} />;
    case "swords":
      return <Swords className={iconClassName} />;
    case "sparkles":
      return <Sparkles className={iconClassName} />;
    case "heart":
      return <Heart className={iconClassName} />;
    default:
      return <CheckSquare className={iconClassName} />;
  }
};

const matchesRaidLevelFilter = (levelValue, selectedFilters = ["50+"]) => {
  const level = Number(levelValue) || 0;
  if (level < 50) return false;
  if (
    !Array.isArray(selectedFilters) ||
    selectedFilters.length === 0 ||
    selectedFilters.includes("50+")
  ) {
    return true;
  }

  return selectedFilters.some((filterId) => {
    if (filterId === "50-59") return level >= 50 && level <= 59;
    if (filterId === "60-69") return level >= 60 && level <= 69;
    if (filterId === "70") return level >= 70;
    return false;
  });
};

const BUSKING_VOTE_STORAGE_KEY = "wak_wow_busking_votes_v1";
const BUSKING_CLIENT_ID_STORAGE_KEY = "wak_wow_busking_client_v1";
const BUSKING_PUBLIC_REFRESH_MS = 5000;
const BUSKING_PUBLIC_SUMMARY_DOC_ID = "busking_public";
const BUSKING_PUBLIC_SHARD_COUNT = 12;
const BUSKING_PUBLIC_SHARDS_COLLECTION = "public_shards";

const getRaidConfig = (raidType = DEFAULT_RAID_TYPE) =>
  RAID_TYPE_OPTIONS.find((option) => option.id === raidType) ||
  RAID_TYPE_OPTIONS[RAID_TYPE_OPTIONS.length - 1];

const createEmptyRaidLayout = (groupCount, leaderId = GUILD_MASTER_ID) => {
  const layout = Array.from({ length: groupCount }, () =>
    Array(RAID_SLOT_SIZE).fill(null)
  );
  if (leaderId && layout[0]?.[0] !== undefined) layout[0][0] = leaderId;
  return layout;
};

const resizeRaidLayout = (layout, groupCount, leaderId = GUILD_MASTER_ID) => {
  const next = createEmptyRaidLayout(groupCount, leaderId);
  const memberIds = (layout || [])
    .flat()
    .filter((memberId) => memberId && memberId !== leaderId);

  let cursor = 0;
  for (let groupIndex = 0; groupIndex < next.length; groupIndex += 1) {
    for (
      let slotIndex = 0;
      slotIndex < next[groupIndex].length;
      slotIndex += 1
    ) {
      if (groupIndex === 0 && slotIndex === 0) continue;
      if (cursor >= memberIds.length) return next;
      next[groupIndex][slotIndex] = memberIds[cursor];
      cursor += 1;
    }
  }

  return next;
};

const cloneRaidLayout = (layout) => layout.map((group) => [...group]);

const findRaidSlotByMemberId = (layout, memberId) => {
  for (let groupIndex = 0; groupIndex < layout.length; groupIndex += 1) {
    for (
      let slotIndex = 0;
      slotIndex < layout[groupIndex].length;
      slotIndex += 1
    ) {
      if (layout[groupIndex][slotIndex] === memberId) {
        return { groupIndex, slotIndex };
      }
    }
  }
  return null;
};

const findNextEmptyRaidSlot = (layout, { skipLockedSlot = false } = {}) => {
  for (let groupIndex = 0; groupIndex < layout.length; groupIndex += 1) {
    for (
      let slotIndex = 0;
      slotIndex < layout[groupIndex].length;
      slotIndex += 1
    ) {
      if (skipLockedSlot && groupIndex === 0 && slotIndex === 0) continue;
      if (!layout[groupIndex][slotIndex]) return { groupIndex, slotIndex };
    }
  }
  return null;
};

const sortBuskingParticipants = (participants) =>
  [...participants].sort((a, b) => {
    const voteGap = (b.buskingVoteCount || 0) - (a.buskingVoteCount || 0);
    if (voteGap !== 0) return voteGap;
    const levelGap = (Number(b.level) || 0) - (Number(a.level) || 0);
    if (levelGap !== 0) return levelGap;
    return (a.streamerName || "").localeCompare(b.streamerName || "", "ko");
  });

const computeBuskingVoteSnapshot = (voteCounts = {}) => {
  const normalized = Object.entries(voteCounts || {}).reduce(
    (acc, [memberId, count]) => {
      const safeCount = Number(count) || 0;
      if (safeCount > 0) acc[memberId] = safeCount;
      return acc;
    },
    {}
  );

  return {
    voteCounts: normalized,
    totalVotes: Object.values(normalized).reduce(
      (sum, count) => sum + (Number(count) || 0),
      0
    ),
  };
};

const applyBuskingVoteCounts = (roster = [], voteCounts = {}) =>
  roster.map((member) => ({
    ...member,
    buskingVoteCount: Number(voteCounts?.[member.id]) || 0,
  }));

const getBuskingVoteShardIndex = (
  seed,
  shardCount = BUSKING_PUBLIC_SHARD_COUNT
) => {
  const normalizedSeed = `${seed || "busking"}`;
  let hash = 0;
  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = (hash << 5) - hash + normalizedSeed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % shardCount;
};

const buildBuskingPublicSummary = (
  roster = [],
  settings = {},
  voteCounts = {}
) => {
  const normalizedSettings = {
    isVotingOpen: false,
    roundId: "wow-busking-default",
    startedAt: null,
    endedAt: null,
    ...settings,
  };

  const participants = sortBuskingParticipants(
    roster
      .filter(
        (member) => member?.isBuskingParticipant && Number(member?.level) >= 40
      )
      .map((member) => ({
        id: member.id,
        streamerName: member.streamerName || "",
        wowNickname: member.wowNickname || "",
        jobClass: member.jobClass || "",
        level: Number(member.level) || 0,
        imageUrl: member.imageUrl || "",
        broadcastUrl: member.broadcastUrl || "",
        buskingVoteCount: Number(member.buskingVoteCount) || 0,
      }))
  );

  return {
    roundId: normalizedSettings.roundId || "wow-busking-default",
    isVotingOpen: !!normalizedSettings.isVotingOpen,
    startedAt: normalizedSettings.startedAt || null,
    endedAt: normalizedSettings.endedAt || null,
    participants,
    participantCount: participants.length,
    totalVotes: participants.reduce(
      (sum, member) => sum + (member.buskingVoteCount || 0),
      0
    ),
    leaderId: participants[0]?.id || null,
    updatedAt: new Date().toISOString(),
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return [
      "home",
      "players",
      "matches",
      "stats",
      "tier",
      "wow",
      "busking",
      "raid",
      "admin",
    ].includes(hash)
      ? hash
      : "home";
  });
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);

  // ★ WOW 탭 상태 관리 ★
  const [wowRoster, setWowRoster] = useState([]);
  const [wowSortConfig, setWowSortConfig] = useState({
    key: "level",
    direction: "desc",
  });
  const [isWowFaqOpen, setIsWowFaqOpen] = useState(false);

  const [wowSearchInput, setWowSearchInput] = useState("");
  const [showWowSearchDropdown, setShowWowSearchDropdown] = useState(false);
  const [wowSearchResults, setWowSearchResults] = useState([]);
  const [currentWowSearchIndex, setCurrentWowSearchIndex] = useState(-1);
  const [highlightedWowMemberId, setHighlightedWowMemberId] = useState(null);

  // ★ 직업 필터 상태 관리 ★
  const [selectedJobFilter, setSelectedJobFilter] = useState("전체");

  const [raidType, setRaidType] = useState(DEFAULT_RAID_TYPE);
  const [raidAssignments, setRaidAssignments] = useState(() =>
    createEmptyRaidLayout(
      getRaidConfig(DEFAULT_RAID_TYPE).groupCount,
      GUILD_MASTER_ID
    )
  );
  const [selectedRaidMemberId, setSelectedRaidMemberId] = useState(null);
  const [raidSearchInput, setRaidSearchInput] = useState("");
  const [raidSelectedJobFilters, setRaidSelectedJobFilters] = useState([
    "전체",
  ]);
  const [raidSelectedLevelFilters, setRaidSelectedLevelFilters] = useState([
    "50+",
  ]);
  const [isRaidLevelFilterOpen, setIsRaidLevelFilterOpen] = useState(false);
  const [isRaidWaitingRoomCollapsed, setIsRaidWaitingRoomCollapsed] =
    useState(false);
  const [raidRoleAssignments, setRaidRoleAssignments] = useState({});
  const [raidRoleMenuSlotKey, setRaidRoleMenuSlotKey] = useState(null);
  const [isRaidRoleGuideOpen, setIsRaidRoleGuideOpen] = useState(false);
  const [raidDragMemberId, setRaidDragMemberId] = useState(null);
  const [raidDragOverSlot, setRaidDragOverSlot] = useState(null);
  const [isRaidCapturing, setIsRaidCapturing] = useState(false);
  const [buskingSettings, setBuskingSettings] = useState({
    isVotingOpen: false,
    roundId: "wow-busking-default",
    startedAt: null,
    endedAt: null,
    noticeUrl: "",
  });
  const [pendingBuskingVoteId, setPendingBuskingVoteId] = useState(null);
  const [buskingLocalVotes, setBuskingLocalVotes] = useState([]);
  const [buskingPublicRoster, setBuskingPublicRoster] = useState([]);
  const [buskingPublicMeta, setBuskingPublicMeta] = useState({
    totalVotes: 0,
    participantCount: 0,
    updatedAt: null,
    leaderId: null,
  });
  const [buskingShardCounts, setBuskingShardCounts] = useState({});
  const [isBuskingAdminSaving, setIsBuskingAdminSaving] = useState(false);
  const [buskingNoticeLinkInput, setBuskingNoticeLinkInput] = useState("");
  const [buskingClientId] = useState(() => {
    try {
      const existing = localStorage.getItem(BUSKING_CLIENT_ID_STORAGE_KEY);
      if (existing) return existing;
      const generated = `busking-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 12)}`;
      localStorage.setItem(BUSKING_CLIENT_ID_STORAGE_KEY, generated);
      return generated;
    } catch (error) {
      return `busking-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
  });
  const raidScreenshotRef = useRef(null);

  const fetchBuskingShardSnapshot = async (roundId) => {
    const resolvedRoundId = roundId || "wow-busking-default";
    const shardsRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "busking_rounds",
      resolvedRoundId,
      BUSKING_PUBLIC_SHARDS_COLLECTION
    );
    const shardsSnap = await getDocs(shardsRef);

    const voteCounts = {};
    let totalVotes = 0;
    let latestUpdatedAt = null;

    shardsSnap.forEach((shardDoc) => {
      const shardData = shardDoc.data() || {};
      totalVotes += Number(shardData.totalVotes) || 0;
      if (
        shardData.updatedAt &&
        (!latestUpdatedAt ||
          new Date(shardData.updatedAt).getTime() >
            new Date(latestUpdatedAt).getTime())
      ) {
        latestUpdatedAt = shardData.updatedAt;
      }

      const shardCounts = shardData.counts || {};
      Object.entries(shardCounts).forEach(([memberId, count]) => {
        voteCounts[memberId] =
          (voteCounts[memberId] || 0) + (Number(count) || 0);
      });

      Object.entries(shardData).forEach(([fieldKey, count]) => {
        if (!fieldKey.startsWith("counts.")) return;
        const memberId = fieldKey.slice(7);
        if (!memberId) return;
        voteCounts[memberId] =
          (voteCounts[memberId] || 0) + (Number(count) || 0);
      });
    });

    return { voteCounts, totalVotes, updatedAt: latestUpdatedAt };
  };

  const persistBuskingPublicSummary = async ({
    rosterOverride = null,
    settingsOverride = null,
    voteCountsOverride = null,
  } = {}) => {
    const resolvedRoster = Array.isArray(rosterOverride)
      ? rosterOverride
      : wowRoster;
    let resolvedSettings = settingsOverride;

    if (!resolvedSettings) {
      const settingsSnap = await getDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "busking")
      );
      resolvedSettings = settingsSnap.exists()
        ? {
            isVotingOpen: false,
            roundId: "wow-busking-default",
            startedAt: null,
            endedAt: null,
            ...settingsSnap.data(),
          }
        : {
            isVotingOpen: false,
            roundId: "wow-busking-default",
            startedAt: null,
            endedAt: null,
          };
    }

    const resolvedVoteCounts = voteCountsOverride ?? buskingShardCounts;
    const summary = buildBuskingPublicSummary(
      resolvedRoster,
      resolvedSettings,
      resolvedVoteCounts
    );
    await setDoc(
      doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "settings",
        BUSKING_PUBLIC_SUMMARY_DOC_ID
      ),
      summary
    );
    return summary;
  };

  const [isLoading, setIsLoading] = useState(true);

  // ★ 관리자 인증 상태 관리 ★
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminNicknameInput, setAdminNicknameInput] = useState(
    () => localStorage.getItem("wak_admin_nickname") || ""
  );
  const [currentAdminName, setCurrentAdminName] = useState(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // ★ 관리자 화면 내부 탭 관리 (main: 메인 설정, etc: 기타 설정) ★
  const [adminInnerTab, setAdminInnerTab] = useState("main");

  const [rawAdminPresence, setRawAdminPresence] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCleaningGhosts, setIsCleaningGhosts] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [todayVisits, setTodayVisits] = useState(0);

  // ★ 사이트 전체 팝업 관리 상태 ★
  const [sitePopup, setSitePopup] = useState(null);
  const [showSitePopup, setShowSitePopup] = useState(false);
  const [popupTitleInput, setPopupTitleInput] = useState("");
  const [popupContentInput, setPopupContentInput] = useState("");

  // ★ 모바일 퀵 메뉴 플로팅 버튼 상태 ★
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [expandedFundingMatchId, setExpandedFundingMatchId] = useState(null);
  const [cheeringPlayerId, setCheeringPlayerId] = useState(null);

  const [gameName, setGameName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchMode, setMatchMode] = useState("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInputs, setImageInputs] = useState({});
  const [wowImageInputs, setWowImageInputs] = useState({});
  const [wowBroadcastUrlInputs, setWowBroadcastUrlInputs] = useState({});
  const [broadcastUrlInputs, setBroadcastUrlInputs] = useState({});

  const [wowStreamerName, setWowStreamerName] = useState("");
  const [wowNickname, setWowNickname] = useState("");
  const [wowJobClass, setWowJobClass] = useState("");
  const [wowLevel, setWowLevel] = useState("");
  const [isWowSubmitting, setIsWowSubmitting] = useState(false);
  const [wowAdminSearchTerm, setWowAdminSearchTerm] = useState("");
  const [wowAdminSortOption, setWowAdminSortOption] = useState("levelDesc");

  const [hasFunding, setHasFunding] = useState(false);
  const [totalFunding, setTotalFunding] = useState("");

  const [individualResults, setIndividualResults] = useState([
    {
      playerName: "",
      rank: 1,
      scoreChange: 100,
      fundingRatio: "",
      fundingAmount: "",
    },
    {
      playerName: "",
      rank: 2,
      scoreChange: 50,
      fundingRatio: "",
      fundingAmount: "",
    },
  ]);
  const [teamResults, setTeamResults] = useState([
    {
      id: 1,
      rank: 1,
      scoreChange: 100,
      players: ["", ""],
      fundingRatio: "",
      fundingAmount: "",
    },
    {
      id: 2,
      rank: 2,
      scoreChange: -50,
      players: ["", ""],
      fundingRatio: "",
      fundingAmount: "",
    },
  ]);

  const [sortConfig, setSortConfig] = useState({
    key: "points",
    direction: "desc",
  });
  const [matchToEdit, setMatchToEdit] = useState(null);
  const [editGameName, setEditGameName] = useState("");
  const [editMatchDate, setEditMatchDate] = useState("");
  const [editMatchMode, setEditMatchMode] = useState("individual");
  const [editHasFunding, setEditHasFunding] = useState(false);
  const [editTotalFunding, setEditTotalFunding] = useState("");
  const [editIndividualResults, setEditIndividualResults] = useState([]);
  const [editTeamResults, setEditTeamResults] = useState([]);
  const [isEditingSubmit, setIsEditingSubmit] = useState(false);

  const playerStatsMap = useMemo(() => {
    return players.map((p) => {
      let matchCount = 0;
      let winCount = 0;
      matches.forEach((m) => {
        const res = m.results?.find((r) => r.playerName === p.name);
        if (res) {
          matchCount++;
          if (res.rank === 1) winCount++;
        }
      });
      const avgScore = matchCount > 0 ? p.points / matchCount : 0;
      return {
        ...p,
        matchCount,
        winCount,
        avgScore: Number(avgScore.toFixed(1)),
      };
    });
  }, [players, matches]);

  const sortedPlayerStats = useMemo(() => {
    let sortableItems = [...playerStatsMap];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "asc" ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return sortableItems;
  }, [playerStatsMap, sortConfig]);

  const requestSort = (key) => {
    let direction = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc")
      direction = "asc";
    setSortConfig({ key, direction });
  };

  const sortedWowRoster = useMemo(() => {
    let filteredItems = wowRoster;
    if (selectedJobFilter !== "전체") {
      filteredItems = filteredItems.filter(
        (m) => m.jobClass === selectedJobFilter
      );
    }

    let sortableItems = [...filteredItems];
    sortableItems.sort((a, b) => {
      if (a[wowSortConfig.key] < b[wowSortConfig.key])
        return wowSortConfig.direction === "asc" ? -1 : 1;
      if (a[wowSortConfig.key] > b[wowSortConfig.key])
        return wowSortConfig.direction === "asc" ? 1 : -1;
      return a.streamerName.localeCompare(b.streamerName);
    });
    return sortableItems;
  }, [wowRoster, wowSortConfig, selectedJobFilter]);

  const requestWowSort = (key) => {
    let direction = "desc";
    if (
      wowSortConfig &&
      wowSortConfig.key === key &&
      wowSortConfig.direction === "desc"
    )
      direction = "asc";
    setWowSortConfig({ key, direction });
  };

  const wowJobStats = useMemo(() => {
    const stats = { 전체: wowRoster.length };
    wowRoster.forEach((m) => {
      stats[m.jobClass] = (stats[m.jobClass] || 0) + 1;
    });
    const sortedJobs = Object.keys(stats)
      .filter((key) => key !== "전체")
      .sort((a, b) => stats[b] - stats[a]);
    return { stats, sortedJobs: ["전체", ...sortedJobs] };
  }, [wowRoster]);

  const raidConfig = useMemo(() => getRaidConfig(raidType), [raidType]);

  const raidMemberMap = useMemo(() => {
    const mappedRoster = wowRoster.reduce((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
    mappedRoster[GUILD_MASTER_ID] = GUILD_MASTER_MEMBER;
    return mappedRoster;
  }, [wowRoster]);

  const raidAssignedPositions = useMemo(() => {
    const positions = {};
    raidAssignments.forEach((group, groupIndex) => {
      group.forEach((memberId, slotIndex) => {
        if (memberId) positions[memberId] = { groupIndex, slotIndex };
      });
    });
    return positions;
  }, [raidAssignments]);

  const raidAssignedMembers = useMemo(
    () =>
      raidAssignments
        .flat()
        .filter(Boolean)
        .map((memberId) => raidMemberMap[memberId])
        .filter(Boolean),
    [raidAssignments, raidMemberMap]
  );

  const raidSelectedMember = selectedRaidMemberId
    ? raidMemberMap[selectedRaidMemberId]
    : null;

  const raidEligibleRoster = useMemo(
    () =>
      wowRoster.filter((member) =>
        matchesRaidLevelFilter(member.level, raidSelectedLevelFilters)
      ),
    [wowRoster, raidSelectedLevelFilters]
  );

  const raidJobStats = useMemo(() => {
    const stats = { 전체: raidEligibleRoster.length };
    raidEligibleRoster.forEach((member) => {
      stats[member.jobClass] = (stats[member.jobClass] || 0) + 1;
    });
    const sortedJobs = Object.keys(stats)
      .filter((key) => key !== "전체")
      .sort((a, b) => stats[b] - stats[a]);
    return { stats, sortedJobs: ["전체", ...sortedJobs] };
  }, [raidEligibleRoster]);

  const raidAvailableMembers = useMemo(() => {
    let items = raidEligibleRoster.filter(
      (member) => !raidAssignedPositions[member.id]
    );

    const isAllJobsSelected =
      raidSelectedJobFilters.includes("전체") ||
      raidSelectedJobFilters.length === 0;
    if (!isAllJobsSelected) {
      items = items.filter((member) =>
        raidSelectedJobFilters.includes(member.jobClass)
      );
    }

    if (raidSearchInput.trim()) {
      const term = raidSearchInput.toLowerCase();
      items = items.filter(
        (member) =>
          (member.streamerName || "").toLowerCase().includes(term) ||
          (member.wowNickname || "").toLowerCase().includes(term) ||
          (member.jobClass || "").toLowerCase().includes(term)
      );
    }

    return [...items].sort((a, b) => {
      if ((Number(b.level) || 0) !== (Number(a.level) || 0))
        return (Number(b.level) || 0) - (Number(a.level) || 0);
      return (a.streamerName || "").localeCompare(b.streamerName || "", "ko");
    });
  }, [
    raidEligibleRoster,
    raidAssignedPositions,
    raidSelectedJobFilters,
    raidSearchInput,
  ]);

  const buskingEligibleMembers = useMemo(
    () =>
      applyBuskingVoteCounts(
        [...wowRoster].filter((member) => Number(member.level) >= 40),
        buskingShardCounts
      ).sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return a.streamerName.localeCompare(b.streamerName, "ko");
      }),
    [wowRoster, buskingShardCounts]
  );

  const buskingSourceRoster = useMemo(
    () => (activeTab === "busking" ? buskingPublicRoster : wowRoster),
    [activeTab, buskingPublicRoster, wowRoster]
  );

  const buskingParticipants = useMemo(
    () =>
      sortBuskingParticipants(
        applyBuskingVoteCounts(
          [...buskingSourceRoster].filter(
            (member) =>
              Number(member.level) >= 40 && member.isBuskingParticipant
          ),
          buskingShardCounts
        )
      ),
    [buskingSourceRoster, buskingShardCounts]
  );

  const buskingTopMembers = useMemo(
    () => buskingParticipants.slice(0, 3),
    [buskingParticipants]
  );
  const buskingTotalVotes = useMemo(
    () =>
      Object.values(buskingShardCounts).reduce(
        (sum, count) => sum + (Number(count) || 0),
        0
      ),
    [buskingShardCounts]
  );
  const buskingLeader = buskingParticipants[0] || null;

  useEffect(() => {
    setBuskingNoticeLinkInput(buskingSettings.noticeUrl || "");
  }, [buskingSettings.noticeUrl]);

  useEffect(() => {
    setRaidAssignments((prev) => {
      const next = cloneRaidLayout(prev);
      let changed = false;

      next.forEach((group, groupIndex) => {
        group.forEach((memberId, slotIndex) => {
          if (memberId && !raidMemberMap[memberId]) {
            next[groupIndex][slotIndex] = null;
            changed = true;
          }
        });
      });

      return changed ? next : prev;
    });
  }, [raidMemberMap]);

  useEffect(() => {
    if (selectedRaidMemberId && !raidMemberMap[selectedRaidMemberId]) {
      setSelectedRaidMemberId(null);
    }
  }, [selectedRaidMemberId, raidMemberMap]);

  useEffect(() => {
    setRaidAssignments((prev) =>
      resizeRaidLayout(prev, raidConfig.groupCount, GUILD_MASTER_ID)
    );
  }, [raidConfig.groupCount]);

  useEffect(() => {
    const assignedMemberIds = new Set(
      raidAssignedMembers.map((member) => member?.id).filter(Boolean)
    );
    setRaidRoleAssignments((prev) => {
      let changed = false;
      const next = {};

      Object.entries(prev).forEach(([memberId, roles]) => {
        const safeRoles = Array.isArray(roles)
          ? roles.filter((roleId) =>
              RAID_ROLE_OPTIONS.some((role) => role.id === roleId)
            )
          : [];
        if (!assignedMemberIds.has(memberId) || safeRoles.length === 0) {
          changed = true;
          return;
        }
        next[memberId] = safeRoles;
        if (safeRoles.length !== roles.length) changed = true;
      });

      return changed ? next : prev;
    });
  }, [raidAssignedMembers]);

  useEffect(() => {
    if (!raidRoleMenuSlotKey && !isRaidRoleGuideOpen) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest('[data-raid-role-layer="true"]')) return;
      setRaidRoleMenuSlotKey(null);
      setIsRaidRoleGuideOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [raidRoleMenuSlotKey, isRaidRoleGuideOpen]);

  useEffect(() => {
    const currentRoundId = buskingSettings.roundId || "wow-busking-default";
    try {
      const stored = JSON.parse(
        localStorage.getItem(BUSKING_VOTE_STORAGE_KEY) || "{}"
      );
      if (stored.roundId === currentRoundId && Array.isArray(stored.votes)) {
        setBuskingLocalVotes(stored.votes);
      } else {
        const next = { roundId: currentRoundId, votes: [] };
        localStorage.setItem(BUSKING_VOTE_STORAGE_KEY, JSON.stringify(next));
        setBuskingLocalVotes([]);
      }
    } catch (error) {
      const next = { roundId: currentRoundId, votes: [] };
      localStorage.setItem(BUSKING_VOTE_STORAGE_KEY, JSON.stringify(next));
      setBuskingLocalVotes([]);
    }
  }, [buskingSettings.roundId]);
  const handleRaidJobFilterToggle = (job) => {
    if (job === "전체") {
      setRaidSelectedJobFilters(["전체"]);
      return;
    }

    setRaidSelectedJobFilters((prev) => {
      const current = prev.includes("전체") ? [] : prev;
      const next = current.includes(job)
        ? current.filter((item) => item !== job)
        : [...current, job];

      return next.length ? next : ["전체"];
    });
  };

  const handleRaidLevelFilterToggle = (filterId) => {
    if (filterId === "50+") {
      setRaidSelectedLevelFilters(["50+"]);
      return;
    }

    setRaidSelectedLevelFilters((prev) => {
      const current = prev.includes("50+") ? [] : prev;
      const next = current.includes(filterId)
        ? current.filter((item) => item !== filterId)
        : [...current, filterId];

      return next.length ? next : ["50+"];
    });
  };

  const handleToggleRaidRole = (memberId, roleId) => {
    setRaidRoleAssignments((prev) => {
      const currentRoles = Array.isArray(prev[memberId]) ? prev[memberId] : [];
      const nextRoles = currentRoles.includes(roleId)
        ? currentRoles.filter((item) => item !== roleId)
        : [...currentRoles, roleId];

      const next = { ...prev };
      if (nextRoles.length > 0) {
        next[memberId] = nextRoles;
      } else {
        delete next[memberId];
      }
      return next;
    });
  };

  const handleJobFilterClick = (job) => {
    setSelectedJobFilter(job);
    setWowSortConfig({ key: "level", direction: "desc" });
  };

  useEffect(() => {
    if (!wowSearchInput.trim()) {
      setWowSearchResults([]);
      setCurrentWowSearchIndex(-1);
      return;
    }
    const term = wowSearchInput.toLowerCase();
    const results = sortedWowRoster.filter(
      (m) =>
        m.streamerName.toLowerCase().includes(term) ||
        m.wowNickname.toLowerCase().includes(term) ||
        m.jobClass.toLowerCase().includes(term)
    );
    setWowSearchResults(results);
  }, [wowSearchInput, sortedWowRoster]);

  const scrollToWowMember = (memberId) => {
    const element = document.getElementById(`wow-member-${memberId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedWowMemberId(memberId);
      setTimeout(() => setHighlightedWowMemberId(null), 2000);
    }
  };

  const handleWowSearchNext = () => {
    if (wowSearchResults.length === 0) return;
    const nextIndex = (currentWowSearchIndex + 1) % wowSearchResults.length;
    setCurrentWowSearchIndex(nextIndex);
    scrollToWowMember(wowSearchResults[nextIndex].id);
    setShowWowSearchDropdown(false);
  };

  const handleWowSearchPrev = () => {
    if (wowSearchResults.length === 0) return;
    const prevIndex =
      currentWowSearchIndex <= 0
        ? wowSearchResults.length - 1
        : currentWowSearchIndex - 1;
    setCurrentWowSearchIndex(prevIndex);
    scrollToWowMember(wowSearchResults[prevIndex].id);
    setShowWowSearchDropdown(false);
  };

  const handleWowSearchSelect = (member) => {
    setShowWowSearchDropdown(false);
    const idx = wowSearchResults.findIndex((m) => m.id === member.id);
    if (idx !== -1) setCurrentWowSearchIndex(idx);
    scrollToWowMember(member.id);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000
    );
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (
        [
          "home",
          "players",
          "matches",
          "stats",
          "tier",
          "wow",
          "busking",
          "raid",
          "admin",
        ].includes(hash)
      )
        setActiveTab(hash);
      else setActiveTab("home");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (tabName) => {
    window.location.hash = tabName;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error(error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const playersRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "players"
    );
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const matchesRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "matches"
    );
    const unsubMatches = onSnapshot(
      matchesRef,
      (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        matchesData.sort((a, b) => {
          const dateA = new Date(a.date).getTime(),
            dateB = new Date(b.date).getTime();
          if (dateA === dateB)
            return (
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
            );
          return dateB - dateA;
        });
        setMatches(matchesData);
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      }
    );

    const metaRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "metadata",
      "app_info"
    );
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
      if (docSnap.exists()) setLastUpdated(docSnap.data().lastUpdated);
    });

    const today = new Date();
    const todayDocId = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const visitRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "daily_visits",
      todayDocId
    );
    const unsubVisit = onSnapshot(visitRef, (docSnap) => {
      if (docSnap.exists()) setTodayVisits(docSnap.data().count || 0);
    });

    const presenceRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "admin_presence"
    );
    const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
      setRawAdminPresence(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    const popupRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "settings",
      "popup"
    );
    const unsubPopup = onSnapshot(popupRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSitePopup(data);
        if (data.isActive) {
          const hideToken = localStorage.getItem("wak_popup_hidden_today");
          const todayStr = new Date().toISOString().split("T")[0];
          if (hideToken !== `${todayStr}_${data.updatedAt}`) {
            setShowSitePopup(true);
          } else {
            setShowSitePopup(false);
          }
        } else {
          setShowSitePopup(false);
        }
      }
    });

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubMeta();
      unsubVisit();
      unsubPresence();
      unsubPopup();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!["wow", "raid", "admin"].includes(activeTab)) return;

    const wowRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "wow_roster"
    );
    const unsubWow = onSnapshot(wowRef, (snapshot) => {
      setWowRoster(
        snapshot.docs.map((wowDoc) => ({ id: wowDoc.id, ...wowDoc.data() }))
      );
    });

    return () => unsubWow();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "admin") return;

    const buskingRef = doc(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "settings",
      "busking"
    );
    const unsubBusking = onSnapshot(buskingRef, (docSnap) => {
      if (docSnap.exists()) {
        setBuskingSettings({
          isVotingOpen: false,
          roundId: "wow-busking-default",
          startedAt: null,
          endedAt: null,
          ...docSnap.data(),
        });
      } else {
        setBuskingSettings({
          isVotingOpen: false,
          roundId: "wow-busking-default",
          startedAt: null,
          endedAt: null,
        });
      }
    });

    return () => unsubBusking();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "busking") return;

    let isCancelled = false;
    let intervalId = null;

    const fetchBuskingData = async () => {
      try {
        const summaryRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          BUSKING_PUBLIC_SUMMARY_DOC_ID
        );
        const summarySnap = await getDoc(summaryRef);

        if (isCancelled) return;

        if (summarySnap.exists()) {
          const summaryData = summarySnap.data();
          const resolvedSettings = {
            isVotingOpen: !!summaryData.isVotingOpen,
            roundId: summaryData.roundId || "wow-busking-default",
            startedAt: summaryData.startedAt || null,
            endedAt: summaryData.endedAt || null,
          };
          const shardSnapshot = await fetchBuskingShardSnapshot(
            resolvedSettings.roundId
          );
          if (isCancelled) return;

          const rosterWithVotes = sortBuskingParticipants(
            applyBuskingVoteCounts(
              summaryData.participants || [],
              shardSnapshot.voteCounts
            )
          );
          setBuskingSettings(resolvedSettings);
          setBuskingShardCounts(shardSnapshot.voteCounts);
          setBuskingPublicRoster(
            rosterWithVotes.map((member) => ({
              ...member,
              isBuskingParticipant: true,
            }))
          );
          setBuskingPublicMeta({
            totalVotes: shardSnapshot.totalVotes,
            participantCount:
              Number(summaryData.participantCount) || rosterWithVotes.length,
            updatedAt: shardSnapshot.updatedAt || summaryData.updatedAt || null,
            leaderId: rosterWithVotes[0]?.id || null,
          });
          return;
        }

        const settingsRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          "busking"
        );
        const participantsQuery = query(
          collection(db, "artifacts", appId, "public", "data", "wow_roster"),
          where("isBuskingParticipant", "==", true)
        );

        const [settingsSnap, participantsSnap] = await Promise.all([
          getDoc(settingsRef),
          getDocs(participantsQuery),
        ]);

        if (isCancelled) return;

        const fallbackSettings = settingsSnap.exists()
          ? {
              isVotingOpen: false,
              roundId: "wow-busking-default",
              startedAt: null,
              endedAt: null,
              ...settingsSnap.data(),
            }
          : {
              isVotingOpen: false,
              roundId: "wow-busking-default",
              startedAt: null,
              endedAt: null,
            };
        const shardSnapshot = await fetchBuskingShardSnapshot(
          fallbackSettings.roundId
        );
        if (isCancelled) return;

        const fallbackRoster = participantsSnap.docs.map((wowDoc) => ({
          id: wowDoc.id,
          ...wowDoc.data(),
        }));
        const fallbackSummary = buildBuskingPublicSummary(
          fallbackRoster,
          fallbackSettings,
          shardSnapshot.voteCounts
        );

        setBuskingSettings(fallbackSettings);
        setBuskingShardCounts(shardSnapshot.voteCounts);
        setBuskingPublicRoster(
          fallbackSummary.participants.map((member) => ({
            ...member,
            isBuskingParticipant: true,
          }))
        );
        setBuskingPublicMeta({
          totalVotes: shardSnapshot.totalVotes,
          participantCount: fallbackSummary.participantCount,
          updatedAt: shardSnapshot.updatedAt || fallbackSummary.updatedAt,
          leaderId: fallbackSummary.leaderId,
        });
      } catch (error) {
        console.error("Failed to refresh busking data:", error);
      }
    };

    fetchBuskingData();
    intervalId = window.setInterval(
      fetchBuskingData,
      BUSKING_PUBLIC_REFRESH_MS
    );

    return () => {
      isCancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "admin") return;

    let isCancelled = false;
    let intervalId = null;

    const refreshShardCounts = async () => {
      try {
        const shardSnapshot = await fetchBuskingShardSnapshot(
          buskingSettings.roundId || "wow-busking-default"
        );
        if (isCancelled) return;
        setBuskingShardCounts(shardSnapshot.voteCounts);
        setBuskingPublicMeta((prev) => ({
          ...prev,
          totalVotes: shardSnapshot.totalVotes,
          updatedAt: shardSnapshot.updatedAt || prev.updatedAt || null,
        }));
      } catch (error) {
        console.error("Failed to refresh busking shard counts:", error);
      }
    };

    refreshShardCounts();
    intervalId = window.setInterval(
      refreshShardCounts,
      BUSKING_PUBLIC_REFRESH_MS
    );

    return () => {
      isCancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user, activeTab, buskingSettings.roundId]);

  useEffect(() => {
    if (sitePopup) {
      setPopupTitleInput(sitePopup.title || "");
      setPopupContentInput(sitePopup.content || "");
    }
  }, [sitePopup]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeAdmins = useMemo(() => {
    return rawAdminPresence.filter(
      (admin) => currentTime - admin.lastActive < 300000
    );
  }, [rawAdminPresence, currentTime]);

  useEffect(() => {
    if (!isAdminAuth || !currentAdminName || !user) return;
    let lastUpdated = Date.now();
    setDoc(
      doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "admin_presence",
        currentAdminName
      ),
      { lastActive: Date.now(), status: "online" }
    );
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdated > 60000) {
        lastUpdated = now;
        setDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "admin_presence",
            currentAdminName
          ),
          { lastActive: now, status: "online" },
          { merge: true }
        ).catch((err) => console.error(err));
      }
    };
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [isAdminAuth, currentAdminName, user]);

  useEffect(() => {
    const recordVisit = async () => {
      const today = new Date();
      const todayDocId = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const storageKey = `wak_visited_${todayDocId}`;
      if (!sessionStorage.getItem(storageKey)) {
        try {
          const visitRef = doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "daily_visits",
            todayDocId
          );
          await setDoc(visitRef, { count: increment(1) }, { merge: true });
          sessionStorage.setItem(storageKey, "true");
        } catch (error) {}
      }
    };
    if (user) recordVisit();
  }, [user]);

  const getAvatarSrc = (playerName) => {
    const p = players.find((p) => p.name === playerName);
    return p?.imageUrl?.trim()
      ? p.imageUrl
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerName}`;
  };

  const getWowAvatarSrc = (member) => {
    return member?.imageUrl?.trim()
      ? member.imageUrl
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
  };

  const updateLastModifiedTime = async () => {
    try {
      const metaRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "metadata",
        "app_info"
      );
      await setDoc(
        metaRef,
        { lastUpdated: new Date().toISOString() },
        { merge: true }
      );
    } catch (error) {}
  };

  const formatLastUpdated = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${month}.${day} ${hours}:${minutes}`;
  };

  const getPlayerStreak = (playerName) => {
    const playerMatches = matches.filter((m) =>
      m.results?.some((r) => r.playerName === playerName)
    );
    if (playerMatches.length === 0) return { type: "none", count: 0 };
    let streakType = "none",
      count = 0;
    for (const match of playerMatches) {
      const result = match.results.find((r) => r.playerName === playerName);
      if (!result) continue;
      const isWin = result.scoreChange > 0,
        isLoss = result.scoreChange < 0;
      if (count === 0) {
        if (isWin) {
          streakType = "win";
          count = 1;
        } else if (isLoss) {
          streakType = "lose";
          count = 1;
        } else break;
      } else {
        if (streakType === "win" && isWin) count++;
        else if (streakType === "lose" && isLoss) count++;
        else break;
      }
    }
    return { type: streakType, count };
  };

  const getPlayerStats = (playerName) => {
    const playerMatches = matches.filter((m) =>
      m.results?.some((r) => r.playerName === playerName)
    );
    const totalMatches = playerMatches.length;
    const wins = playerMatches.filter((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return r && r.rank === 1;
    }).length;
    const winRate =
      totalMatches === 0 ? 0 : Math.round((wins / totalMatches) * 100);
    const gameCounts = {};
    playerMatches.forEach((m) => {
      gameCounts[m.gameName] = (gameCounts[m.gameName] || 0) + 1;
    });
    let mostPlayedGame = "전적 없음",
      maxCount = 0;
    for (const [game, count] of Object.entries(gameCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostPlayedGame = game;
      }
    }
    const recentMatches = playerMatches.slice(0, 5).map((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return {
        id: m.id,
        gameName: m.gameName,
        date: m.date,
        rank: r.rank,
        scoreChange: r.scoreChange,
      };
    });
    return { totalMatches, wins, winRate, mostPlayedGame, recentMatches };
  };

  const handleCheerPlayer = async (playerId, playerName) => {
    if (!user) return;
    if (cheeringPlayerId === playerId) return;

    setCheeringPlayerId(playerId);
    const today = new Date().toISOString().split("T")[0];
    const storageKey = "wak_vleague_hearts_v1";
    let storedData = JSON.parse(
      localStorage.getItem(storageKey) || '{"date": "", "votes": []}'
    );
    if (storedData.date !== today) storedData = { date: today, votes: [] };
    const hasVoted = storedData.votes.includes(playerName);

    try {
      if (hasVoted) {
        await updateDoc(
          doc(db, "artifacts", appId, "public", "data", "players", playerId),
          { hearts: increment(-1) }
        );
        storedData.votes = storedData.votes.filter(
          (name) => name !== playerName
        );
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        showToast(`${playerName}님에 대한 응원을 취소했습니다. 💔`);
      } else {
        await updateDoc(
          doc(db, "artifacts", appId, "public", "data", "players", playerId),
          { hearts: increment(1) }
        );
        storedData.votes.push(playerName);
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        showToast(`${playerName}님을 성공적으로 응원했습니다! 💖`);
      }
    } catch (error) {
      showToast("응원 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setCheeringPlayerId(null);
    }
  };

  const handleAddWowMember = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (
      !wowStreamerName.trim() ||
      !wowNickname.trim() ||
      !wowJobClass.trim() ||
      !wowLevel
    )
      return showToast("모든 와우 캐릭터 정보를 입력해주세요.", "error");
    setIsWowSubmitting(true);
    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "wow_roster"),
        {
          streamerName: wowStreamerName.trim(),
          wowNickname: wowNickname.trim(),
          jobClass: wowJobClass.trim(),
          level: Number(wowLevel),
          isApplied: false,
          isWowPartner: false,
          isBuskingParticipant: false,
          buskingVoteCount: 0,
          broadcastUrl: "",
          createdAt: new Date().toISOString(),
        }
      );
      setWowStreamerName("");
      setWowNickname("");
      setWowJobClass("");
      setWowLevel("");
      showToast("와우 길드원이 성공적으로 등록되었습니다!");
    } catch (error) {
      showToast("길드원 등록 중 오류 발생", "error");
    } finally {
      setIsWowSubmitting(false);
    }
  };

  const handleUpdateWowLevel = async (id, newLevel) => {
    if (!user) return;
    if (newLevel < 1) newLevel = 1;
    if (newLevel > 70) newLevel = 70;
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", id),
        { level: newLevel }
      );
      const nextRoster = wowRoster.map((member) =>
        member.id === id ? { ...member, level: newLevel } : member
      );
      await persistBuskingPublicSummary({
        rosterOverride: nextRoster,
        voteCountsOverride: buskingShardCounts,
      });
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleToggleWowApply = async (id, currentStatus) => {
    if (!user) return;
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", id),
        { isApplied: !currentStatus }
      );
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleToggleWowPartner = async (id, currentStatus) => {
    if (!user) return;
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", id),
        { isWowPartner: !currentStatus }
      );
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleToggleBuskingParticipant = async (
    memberId,
    currentStatus,
    memberLevel
  ) => {
    if (!user) return;
    if (Number(memberLevel) < 40) {
      showToast(
        "40레벨 이상 길드원만 버스킹 참가자로 지정할 수 있습니다.",
        "error"
      );
      return;
    }
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId),
        { isBuskingParticipant: !currentStatus }
      );
      const nextRoster = wowRoster.map((member) =>
        member.id === memberId
          ? { ...member, isBuskingParticipant: !currentStatus }
          : member
      );
      await persistBuskingPublicSummary({
        rosterOverride: nextRoster,
        voteCountsOverride: buskingShardCounts,
      });
      await updateLastModifiedTime();
      showToast(
        !currentStatus
          ? "버스킹 참가자로 등록했습니다."
          : "버스킹 참가자에서 제외했습니다."
      );
    } catch (error) {
      showToast("버스킹 참가 상태를 변경하지 못했습니다.", "error");
    }
  };

  const handleUpdateWowBroadcastUrl = async (memberId, url) => {
    if (!user) return;
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId),
        { broadcastUrl: url || "" }
      );
      const nextRoster = wowRoster.map((member) =>
        member.id === memberId ? { ...member, broadcastUrl: url || "" } : member
      );
      await persistBuskingPublicSummary({
        rosterOverride: nextRoster,
        voteCountsOverride: buskingShardCounts,
      });
      await updateLastModifiedTime();
      showToast("WOW 방송국 주소가 저장되었습니다.");
    } catch (error) {
      showToast("WOW 방송국 주소 저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleStartBuskingVoting = async () => {
    if (!user || isBuskingAdminSaving) return;
    setIsBuskingAdminSaving(true);
    try {
      const nextSettings = {
        ...buskingSettings,
        isVotingOpen: true,
        roundId: buskingSettings.roundId || `wow-busking-${Date.now()}`,
        startedAt: new Date().toISOString(),
        endedAt: null,
      };
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "busking"),
        nextSettings,
        { merge: true }
      );
      await persistBuskingPublicSummary({
        settingsOverride: nextSettings,
        voteCountsOverride: buskingShardCounts,
      });
      showToast("와우 버스킹 투표를 시작했습니다.");
    } catch (error) {
      showToast("투표 시작 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBuskingAdminSaving(false);
    }
  };

  const handleStopBuskingVoting = async () => {
    if (!user || isBuskingAdminSaving) return;
    setIsBuskingAdminSaving(true);
    try {
      const nextSettings = {
        ...buskingSettings,
        isVotingOpen: false,
        endedAt: new Date().toISOString(),
      };
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "busking"),
        nextSettings,
        { merge: true }
      );
      await persistBuskingPublicSummary({
        settingsOverride: nextSettings,
        voteCountsOverride: buskingShardCounts,
      });
      showToast("와우 버스킹 투표를 종료했습니다.");
    } catch (error) {
      showToast("투표 종료 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBuskingAdminSaving(false);
    }
  };

  const handleResetBuskingVoting = async () => {
    if (!user || isBuskingAdminSaving) return;
    setIsBuskingAdminSaving(true);
    const nextRoundId = `wow-busking-${Date.now()}`;
    try {
      const batch = writeBatch(db);
      const nextSettings = {
        isVotingOpen: false,
        roundId: nextRoundId,
        startedAt: null,
        endedAt: null,
        resetAt: new Date().toISOString(),
      };
      batch.set(
        doc(db, "artifacts", appId, "public", "data", "settings", "busking"),
        nextSettings,
        { merge: true }
      );
      const resetSummary = buildBuskingPublicSummary(
        wowRoster,
        nextSettings,
        {}
      );
      batch.set(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          BUSKING_PUBLIC_SUMMARY_DOC_ID
        ),
        resetSummary
      );
      await batch.commit();
      localStorage.setItem(
        BUSKING_VOTE_STORAGE_KEY,
        JSON.stringify({ roundId: nextRoundId, votes: [] })
      );
      setBuskingLocalVotes([]);
      setBuskingShardCounts({});
      setBuskingPublicRoster(
        resetSummary.participants.map((member) => ({
          ...member,
          isBuskingParticipant: true,
        }))
      );
      setBuskingPublicMeta({
        totalVotes: 0,
        participantCount: resetSummary.participantCount,
        updatedAt: resetSummary.updatedAt,
        leaderId: resetSummary.leaderId,
      });
      setBuskingSettings(nextSettings);
      showToast("와우 버스킹 투표를 초기화했습니다.");
    } catch (error) {
      showToast("투표 초기화 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBuskingAdminSaving(false);
    }
  };

  const handleSaveBuskingNoticeUrl = async () => {
    if (!user || isBuskingAdminSaving) return;
    setIsBuskingAdminSaving(true);
    try {
      const nextSettings = {
        ...buskingSettings,
        noticeUrl: (buskingNoticeLinkInput || "").trim(),
      };
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "busking"),
        nextSettings,
        { merge: true }
      );
      setBuskingSettings(nextSettings);
      showToast(
        nextSettings.noticeUrl
          ? "와우 버스킹 공지사항 링크를 저장했습니다."
          : "공지사항 링크를 비웠습니다."
      );
    } catch (error) {
      showToast("공지사항 링크 저장 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBuskingAdminSaving(false);
    }
  };

  const handleDeleteBuskingNoticeUrl = async () => {
    if (!user || isBuskingAdminSaving) return;
    setIsBuskingAdminSaving(true);
    try {
      const nextSettings = {
        ...buskingSettings,
        noticeUrl: "",
      };
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "busking"),
        nextSettings,
        { merge: true }
      );
      setBuskingSettings(nextSettings);
      setBuskingNoticeLinkInput("");
      showToast("와우 버스킹 공지사항 링크를 삭제했습니다.");
    } catch (error) {
      showToast("공지사항 링크 삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBuskingAdminSaving(false);
    }
  };

  const handleBuskingVote = async (member) => {
    if (!user) return;
    if (pendingBuskingVoteId === member.id) return;
    if (!buskingSettings.isVotingOpen) {
      showToast("관리자가 투표를 시작하면 응원 투표가 열립니다.", "error");
      return;
    }
    if (buskingLocalVotes.includes(member.id)) {
      showToast(`${member.streamerName}님에게는 이미 투표를 완료했습니다.`);
      return;
    }

    const currentRoundId = buskingSettings.roundId || "wow-busking-default";
    const voteEntryId = `${buskingClientId}__${member.id}`;
    const shardIndex = getBuskingVoteShardIndex(
      `${buskingClientId}:${member.id}:${Date.now()}`
    );

    setPendingBuskingVoteId(member.id);
    try {
      await runTransaction(db, async (transaction) => {
        const settingsRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "settings",
          "busking"
        );
        const memberRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "wow_roster",
          member.id
        );
        const voteRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "busking_rounds",
          currentRoundId,
          "votes",
          voteEntryId
        );
        const shardRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "busking_rounds",
          currentRoundId,
          BUSKING_PUBLIC_SHARDS_COLLECTION,
          `shard_${shardIndex}`
        );

        const [settingsSnap, memberSnap, voteSnap] = await Promise.all([
          transaction.get(settingsRef),
          transaction.get(memberRef),
          transaction.get(voteRef),
        ]);

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
        if (
          !settingsData?.isVotingOpen ||
          (settingsData.roundId || "wow-busking-default") !== currentRoundId
        ) {
          throw new Error("VOTING_CLOSED");
        }

        if (!memberSnap.exists()) {
          throw new Error("MEMBER_NOT_FOUND");
        }

        if (voteSnap.exists()) {
          throw new Error("ALREADY_VOTED");
        }

        const memberData = memberSnap.data();
        if (
          !memberData?.isBuskingParticipant ||
          Number(memberData?.level) < 40
        ) {
          throw new Error("MEMBER_NOT_ELIGIBLE");
        }

        transaction.set(voteRef, {
          memberId: member.id,
          memberName: memberData.streamerName || member.streamerName || "",
          roundId: currentRoundId,
          clientId: buskingClientId,
          shardIndex,
          createdAt: new Date().toISOString(),
        });

        transaction.set(
          shardRef,
          {
            shardIndex,
            roundId: currentRoundId,
            totalVotes: increment(1),
            updatedAt: new Date().toISOString(),
            counts: {
              [member.id]: increment(1),
            },
          },
          { merge: true }
        );
      });

      const nextVotes = [...buskingLocalVotes, member.id];
      localStorage.setItem(
        BUSKING_VOTE_STORAGE_KEY,
        JSON.stringify({ roundId: currentRoundId, votes: nextVotes })
      );
      setBuskingLocalVotes(nextVotes);

      const nextCounts = {
        ...buskingShardCounts,
        [member.id]: (Number(buskingShardCounts[member.id]) || 0) + 1,
      };
      setBuskingShardCounts(nextCounts);

      let optimisticRoster = [];
      setBuskingPublicRoster((prev) => {
        optimisticRoster = sortBuskingParticipants(
          applyBuskingVoteCounts(prev, nextCounts)
        );
        return optimisticRoster;
      });
      setBuskingPublicMeta((prev) => ({
        ...prev,
        totalVotes: (prev.totalVotes || 0) + 1,
        updatedAt: new Date().toISOString(),
        leaderId: optimisticRoster[0]?.id || prev.leaderId || null,
      }));
      showToast(`${member.streamerName}님에게 응원 투표를 반영했습니다!`);
    } catch (error) {
      if (error?.message === "ALREADY_VOTED") {
        const nextVotes = buskingLocalVotes.includes(member.id)
          ? buskingLocalVotes
          : [...buskingLocalVotes, member.id];
        localStorage.setItem(
          BUSKING_VOTE_STORAGE_KEY,
          JSON.stringify({ roundId: currentRoundId, votes: nextVotes })
        );
        setBuskingLocalVotes(nextVotes);
        showToast(`${member.streamerName}님에게는 이미 투표를 완료했습니다.`);
      } else if (error?.message === "VOTING_CLOSED") {
        showToast("투표가 닫혀 있어 응원 투표를 반영할 수 없습니다.", "error");
      } else if (error?.message === "MEMBER_NOT_ELIGIBLE") {
        showToast("현재 이 참가자에게는 투표할 수 없습니다.", "error");
      } else {
        showToast("버스킹 투표 처리 중 오류가 발생했습니다.", "error");
      }
    } finally {
      setPendingBuskingVoteId(null);
    }
  };

  const copyTextToClipboard = async (text, successMessage) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      showToast(successMessage);
    } catch (error) {
      showToast("복사에 실패했습니다.", "error");
    }
  };

  const handleCopyWowApplicantList = () => {
    const applicants = wowRoster
      .filter((m) => m.level >= 40 && m.isApplied)
      .map((m) => m.streamerName)
      .join(", ");

    if (!applicants) {
      showToast("참가 신청 완료한 길드원이 아직 없습니다.", "error");
      return;
    }

    copyTextToClipboard(
      applicants,
      `참가 신청 명단(${applicants.split(", ").length}명) 복사 완료!`
    );
  };

  const isLockedRaidSlot = (groupIndex, slotIndex) =>
    groupIndex === 0 && slotIndex === 0;

  const assignMemberToRaidSlot = (
    memberId,
    targetGroupIndex,
    targetSlotIndex
  ) => {
    const member = raidMemberMap[memberId];
    if (!member) return;

    setRaidRoleMenuSlotKey(null);

    if (
      memberId === GUILD_MASTER_ID &&
      !isLockedRaidSlot(targetGroupIndex, targetSlotIndex)
    ) {
      showToast("길드장 우왁굳은 1번 파티 1번 슬롯에 고정됩니다.", "error");
      return;
    }

    if (
      isLockedRaidSlot(targetGroupIndex, targetSlotIndex) &&
      memberId !== GUILD_MASTER_ID
    ) {
      showToast(
        "1번 파티 1번 슬롯은 길드장 우왁굳의 고정 자리입니다.",
        "error"
      );
      return;
    }

    setRaidAssignments((prev) => {
      const next = cloneRaidLayout(prev);
      const sourceSlot = findRaidSlotByMemberId(next, memberId);
      const targetMemberId = next[targetGroupIndex][targetSlotIndex];

      if (
        sourceSlot &&
        sourceSlot.groupIndex === targetGroupIndex &&
        sourceSlot.slotIndex === targetSlotIndex
      ) {
        return prev;
      }

      if (targetMemberId === GUILD_MASTER_ID && memberId !== GUILD_MASTER_ID) {
        return prev;
      }

      if (sourceSlot) {
        next[sourceSlot.groupIndex][sourceSlot.slotIndex] = null;
      }

      if (targetMemberId && targetMemberId !== memberId && sourceSlot) {
        next[sourceSlot.groupIndex][sourceSlot.slotIndex] = targetMemberId;
      }

      if (targetMemberId && targetMemberId !== memberId && !sourceSlot) {
        setRaidRoleAssignments((prevRoles) => {
          if (!prevRoles[targetMemberId]) return prevRoles;
          const nextRoles = { ...prevRoles };
          delete nextRoles[targetMemberId];
          return nextRoles;
        });
      }

      next[targetGroupIndex][targetSlotIndex] = memberId;
      return next;
    });

    setSelectedRaidMemberId(null);
  };

  const handleRaidSlotClick = (groupIndex, slotIndex) => {
    const currentMemberId = raidAssignments[groupIndex]?.[slotIndex] || null;

    if (selectedRaidMemberId) {
      assignMemberToRaidSlot(selectedRaidMemberId, groupIndex, slotIndex);
      return;
    }

    if (currentMemberId) {
      if (currentMemberId === GUILD_MASTER_ID) {
        showToast("길드장 우왁굳은 1번 파티 1번 슬롯에 고정됩니다.", "error");
        return;
      }
      setSelectedRaidMemberId(currentMemberId);
    }
  };

  const handleQuickAddRaidMember = (memberId) => {
    const emptySlot = findNextEmptyRaidSlot(raidAssignments, {
      skipLockedSlot: true,
    });
    if (!emptySlot) {
      showToast(
        `${raidConfig.label} 레이드 자리가 모두 채워졌습니다.`,
        "error"
      );
      return;
    }

    assignMemberToRaidSlot(memberId, emptySlot.groupIndex, emptySlot.slotIndex);
  };

  const handleRemoveRaidMember = (groupIndex, slotIndex) => {
    if (isLockedRaidSlot(groupIndex, slotIndex)) {
      showToast("길드장 우왁굳은 고정 멤버라 해제할 수 없습니다.", "error");
      return;
    }

    const removedMemberId = raidAssignments[groupIndex]?.[slotIndex] || null;

    setRaidAssignments((prev) => {
      const next = cloneRaidLayout(prev);
      next[groupIndex][slotIndex] = null;
      return next;
    });

    if (removedMemberId) {
      setRaidRoleAssignments((prev) => {
        if (!prev[removedMemberId]) return prev;
        const next = { ...prev };
        delete next[removedMemberId];
        return next;
      });
    }

    if (removedMemberId && selectedRaidMemberId === removedMemberId) {
      setSelectedRaidMemberId(null);
    }
  };

  const handleResetRaid = () => {
    setRaidAssignments(
      createEmptyRaidLayout(raidConfig.groupCount, GUILD_MASTER_ID)
    );
    setSelectedRaidMemberId(null);
    setRaidDragMemberId(null);
    setRaidDragOverSlot(null);
    setRaidRoleAssignments({});
    setRaidRoleMenuSlotKey(null);
    showToast(`${raidConfig.label} 레이드 편성을 초기화했습니다.`);
  };

  const handleCopyRaidLink = () => {
    copyTextToClipboard(
      `${window.location.origin}${window.location.pathname}#raid`,
      "공유용 #raid 링크를 복사했습니다."
    );
  };

  const handleCopyRaidSummary = () => {
    const lines = [`[WOW ${raidConfig.label} 레이드 편성표]`];

    raidAssignments.forEach((group, groupIndex) => {
      lines.push("");
      lines.push(`파티 ${groupIndex + 1}`);

      group.forEach((memberId, slotIndex) => {
        const member = memberId ? raidMemberMap[memberId] : null;
        lines.push(
          `${slotIndex + 1}. ${
            member
              ? `${member.streamerName} / ${member.wowNickname} / ${member.jobClass} / Lv.${member.level}`
              : "빈자리"
          }`
        );
      });
    });

    copyTextToClipboard(lines.join("\n"), "레이드 편성표를 복사했습니다.");
  };

  const loadHtml2Canvas = async () => {
    if (typeof window === "undefined") {
      throw new Error("스크린샷 기능은 브라우저에서만 사용할 수 있습니다.");
    }

    if (window.html2canvas) return window.html2canvas;

    if (!window.__raidHtml2CanvasPromise) {
      window.__raidHtml2CanvasPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
          'script[data-raid-html2canvas="true"]'
        );

        const handleResolve = () => {
          if (window.html2canvas) {
            resolve(window.html2canvas);
          } else {
            reject(new Error("html2canvas를 불러오지 못했습니다."));
          }
        };

        const handleError = () =>
          reject(new Error("스크린샷 라이브러리를 불러오지 못했습니다."));

        if (existingScript) {
          existingScript.addEventListener("load", handleResolve, {
            once: true,
          });
          existingScript.addEventListener("error", handleError, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
        script.async = true;
        script.dataset.raidHtml2canvas = "true";
        script.onload = handleResolve;
        script.onerror = handleError;
        document.body.appendChild(script);
      }).catch((error) => {
        window.__raidHtml2CanvasPromise = null;
        throw error;
      });
    }

    return window.__raidHtml2CanvasPromise;
  };

  const handleCaptureRaidScreenshot = async () => {
    const target = raidScreenshotRef.current;
    if (!target) {
      showToast("캡처할 레이드 편성 영역을 찾지 못했습니다.", "error");
      return;
    }

    setIsRaidCapturing(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(target, {
        backgroundColor: "#020617",
        scale: Math.min(window.devicePixelRatio || 1.5, 2),
        useCORS: true,
        logging: false,
        imageTimeout: 12000,
        onclone: (clonedDocument) => {
          clonedDocument
            .querySelectorAll(
              '[data-no-screenshot="true"], [data-raid-role-panel="true"]'
            )
            .forEach((element) => {
              element.style.display = "none";
            });

          const captureRoot = clonedDocument.querySelector(
            '[data-raid-screenshot-root="true"]'
          );
          if (captureRoot) {
            captureRoot.style.boxShadow = "none";
            captureRoot.style.borderColor = "rgba(148, 163, 184, 0.28)";
          }
        },
      });

      const downloadLink = document.createElement("a");
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[T:]/g, "-");
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.download = `wow-raid-${raidType}raid-${timestamp}.png`;
      downloadLink.click();
      showToast("레이드 스크린샷 저장이 시작되었습니다.");
    } catch (error) {
      showToast(
        "스크린샷 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
        "error"
      );
    } finally {
      setIsRaidCapturing(false);
    }
  };

  const handleRaidDragStart = (event, memberId) => {
    if (!memberId || memberId === GUILD_MASTER_ID) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", memberId);
    setRaidDragMemberId(memberId);
  };

  const clearRaidDragState = () => {
    setRaidDragMemberId(null);
    setRaidDragOverSlot(null);
  };

  const handleRaidSlotDragOver = (event, groupIndex, slotIndex) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setRaidDragOverSlot(`${groupIndex}-${slotIndex}`);
  };

  const handleRaidSlotDrop = (event, groupIndex, slotIndex) => {
    event.preventDefault();
    const memberId =
      event.dataTransfer.getData("text/plain") || raidDragMemberId;
    if (memberId) {
      assignMemberToRaidSlot(memberId, groupIndex, slotIndex);
    }
    clearRaidDragState();
  };

  const handleDeleteWowMember = async (id) => {
    if (!user || !window.confirm("정말 이 길드원을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", id)
      );
      showToast("길드원이 삭제되었습니다.");
    } catch (error) {}
  };

  const handleResetDatabase = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      for (const m of matches)
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "matches", m.id)
        );
      for (const p of players)
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "players", p.id)
        );
      await updateLastModifiedTime();
      showToast("데이터가 초기화되고 백지상태로 시작됩니다!", "success");
      setShowResetModal(false);
    } catch (error) {
      showToast("초기화 중 오류가 발생했습니다.", "error");
    } finally {
      setIsResetting(false);
      navigateTo("tier");
    }
  };

  const hashPassword = async (password) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminNicknameInput.trim()) {
      showToast("닉네임을 입력해주세요.", "error");
      return;
    }
    if (!passwordInput.trim()) {
      showToast("비밀번호를 입력해주세요.", "error");
      return;
    }
    if (!user) {
      showToast("서버와 연결 중입니다. 잠시만 기다려주세요.", "error");
      return;
    }

    setIsAdminLoggingIn(true);
    try {
      const authDocRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "admin_auth",
        "config"
      );
      const authDocSnap = await getDoc(authDocRef);
      const inputHash = await hashPassword(passwordInput);

      if (!authDocSnap.exists()) {
        if (adminNicknameInput.trim() === "딸기세팅") {
          await setDoc(authDocRef, {
            hash: inputHash,
            createdAt: new Date().toISOString(),
          });
          showToast(
            `🔒 [최초 등록 완료] 이제부터 이 비밀번호로만 접속 가능합니다! 다시 로그인해주세요.`
          );
          setPasswordInput("");
          setAdminNicknameInput("");
        } else {
          showToast("비밀번호가 일치하지 않습니다.", "error");
        }
      } else {
        const storedHash = authDocSnap.data().hash;
        if (inputHash === storedHash) {
          localStorage.setItem("wak_admin_nickname", adminNicknameInput.trim());
          setCurrentAdminName(adminNicknameInput.trim());
          setIsAdminAuth(true);
          showToast(
            `${adminNicknameInput.trim()}님, 관리자 모드에 접속하셨습니다.`
          );
          setPasswordInput("");
        } else {
          showToast("비밀번호가 일치하지 않습니다.", "error");
        }
      }
    } catch (error) {
      console.error(error);
      showToast("로그인 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (currentAdminName) {
      try {
        await deleteDoc(
          doc(
            db,
            "artifacts",
            appId,
            "public",
            "data",
            "admin_presence",
            currentAdminName
          )
        );
      } catch (error) {}
    }
    setIsAdminAuth(false);
    setCurrentAdminName(null);
    showToast("성공적으로 로그아웃 되었습니다.");
  };

  const handleSavePopup = async (e) => {
    e.preventDefault();
    if (!popupTitleInput.trim() || !popupContentInput.trim()) {
      return showToast("팝업 제목과 내용을 모두 입력해주세요.", "error");
    }
    try {
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "popup"),
        {
          title: popupTitleInput.trim(),
          content: popupContentInput.trim(),
          isActive: true,
          updatedAt: Date.now(),
        }
      );
      showToast("팝업 공지가 유저들에게 띄워집니다!");
    } catch (error) {
      showToast("팝업 저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDeletePopup = async () => {
    try {
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "popup"),
        {
          isActive: false,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      showToast("팝업 공지가 사이트에서 즉시 내려갔습니다.");
    } catch (error) {
      showToast("팝업 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const handleUpdateImage = async (playerId, url) => {
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "players", playerId),
        { imageUrl: url || "" }
      );
      await updateLastModifiedTime();
      showToast("종겜 리그 프로필 이미지가 저장되었습니다.");
    } catch (error) {}
  };

  const handleUpdateBroadcastUrl = async (playerId, url) => {
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "players", playerId),
        { broadcastUrl: url || "" }
      );
      await updateLastModifiedTime();
      showToast("방송국 주소가 저장되었습니다.");
    } catch (error) {}
  };

  const handleUpdateWowImage = async (memberId, url) => {
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId),
        { imageUrl: url || "" }
      );
      await updateLastModifiedTime();
      showToast("와우 길드원 프로필 이미지가 저장되었습니다.");
    } catch (error) {}
  };

  // ★ 경기 삭제 시 유령 선수 제거 로직 ★
  const confirmDeleteMatch = async () => {
    if (!matchToDelete || !user) return;
    setIsDeleting(true);
    try {
      for (const result of matchToDelete.results) {
        const player = players.find((p) => p.name === result.playerName);
        if (player) {
          const hasOtherMatches = matches.some(
            (m) =>
              m.id !== matchToDelete.id &&
              m.results?.some((r) => r.playerName === player.name)
          );
          if (hasOtherMatches) {
            await updateDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "players",
                player.id
              ),
              { points: increment(-result.scoreChange) }
            );
          } else {
            await deleteDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "players",
                player.id
              )
            );
          }
        }
      }
      await deleteDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "matches",
          matchToDelete.id
        )
      );
      await updateLastModifiedTime();
      showToast(
        "경기가 삭제되고 남은 기록이 없는 선수가 명단에서 제외되었습니다."
      );
      setMatchToDelete(null);
    } catch (error) {
    } finally {
      setIsDeleting(false);
    }
  };

  // ★ 관리자가 수동으로 선수를 영구 삭제하는 기능 ★
  const handleDeletePlayer = async (playerId, playerName) => {
    if (
      !user ||
      !window.confirm(
        `정말 [${playerName}] 선수를 명단에서 강제 삭제하시겠습니까?\n\n(주의: 이 선수가 참여한 경기 기록이 남아있다면 데이터가 꼬일 수 있으니, 경기 기록이 없는 '유령 선수'만 삭제해주세요!)`
      )
    )
      return;
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "public", "data", "players", playerId)
      );
      await updateLastModifiedTime();
      showToast(`[${playerName}] 선수가 명단에서 영구 삭제되었습니다.`);
    } catch (error) {
      showToast("선수 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // ★ 유령 데이터 일괄 청소 버튼 기능 ★
  const handleCleanGhostData = async () => {
    if (
      !user ||
      !window.confirm(
        "경기 기록이 전혀 없는 '유령 선수'들을 찾아 명단에서 모두 삭제하시겠습니까?"
      )
    )
      return;
    setIsCleaningGhosts(true);
    try {
      let deletedCount = 0;
      for (const p of players) {
        const hasMatch = matches.some((m) =>
          m.results?.some((r) => r.playerName === p.name)
        );
        if (!hasMatch) {
          await deleteDoc(
            doc(db, "artifacts", appId, "public", "data", "players", p.id)
          );
          deletedCount++;
        }
      }
      await updateLastModifiedTime();
      if (deletedCount > 0) {
        showToast(
          `총 ${deletedCount}명의 유령 데이터를 성공적으로 청소했습니다!`
        );
      } else {
        showToast("삭제할 유령 데이터가 없습니다. (모두 정상입니다)");
      }
    } catch (error) {
      showToast("유령 데이터 청소 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCleaningGhosts(false);
    }
  };

  const handleOpenEditMatch = (match) => {
    setMatchToEdit({ ...match, originalMatch: match });
    setEditGameName(match.gameName);
    setEditMatchDate(match.date);
    setEditMatchMode(match.matchType || "individual");

    setEditHasFunding(match.hasFunding || false);
    setEditTotalFunding(match.totalFunding || "");

    if (match.matchType === "team") {
      const teamsByRank = {};
      (match.results || []).forEach((r) => {
        if (!teamsByRank[r.rank])
          teamsByRank[r.rank] = {
            id: Date.now() + Math.random(),
            rank: r.rank,
            scoreChange: r.scoreChange,
            players: [],
            fundingRatio: r.fundingRatio || "",
            fundingAmount: r.fundingAmount || "",
          };
        teamsByRank[r.rank].players.push(r.playerName);
      });
      setEditTeamResults(
        Object.values(teamsByRank).sort((a, b) => a.rank - b.rank)
      );
      setEditIndividualResults([
        {
          playerName: "",
          rank: 1,
          scoreChange: 100,
          fundingRatio: "",
          fundingAmount: "",
        },
        {
          playerName: "",
          rank: 2,
          scoreChange: 50,
          fundingRatio: "",
          fundingAmount: "",
        },
      ]);
    } else {
      setEditIndividualResults(
        [...(match.results || [])].map((r) => ({
          ...r,
          fundingRatio: r.fundingRatio || "",
          fundingAmount: r.fundingAmount || "",
        }))
      );
      setEditTeamResults([
        {
          id: 1,
          rank: 1,
          scoreChange: 100,
          players: ["", ""],
          fundingRatio: "",
          fundingAmount: "",
        },
        {
          id: 2,
          rank: 2,
          scoreChange: -50,
          players: ["", ""],
          fundingRatio: "",
          fundingAmount: "",
        },
      ]);
    }
  };

  const handleSaveEditedMatch = async (e) => {
    e.preventDefault();
    if (!editGameName.trim())
      return showToast("게임 이름을 입력해주세요.", "error");

    let finalResults = [];
    if (editMatchMode === "individual") {
      finalResults = editIndividualResults
        .filter((r) => r.playerName.trim() !== "")
        .map((r) => ({
          playerName: r.playerName.trim(),
          rank: r.rank,
          scoreChange: r.scoreChange,
          ...(editHasFunding
            ? {
                fundingRatio: Number(r.fundingRatio) || 0,
                fundingAmount: Number(r.fundingAmount) || 0,
              }
            : {}),
        }));
    } else {
      editTeamResults.forEach((team) => {
        team.players.forEach((pName) => {
          if (pName.trim() !== "") {
            finalResults.push({
              playerName: pName.trim(),
              rank: team.rank,
              scoreChange: team.scoreChange,
              ...(editHasFunding
                ? {
                    fundingRatio: Number(team.fundingRatio) || 0,
                    fundingAmount: Number(team.fundingAmount) || 0,
                  }
                : {}),
            });
          }
        });
      });
    }

    if (finalResults.length === 0)
      return showToast(
        "최소 1명 이상의 유효한 참가자를 입력해주세요.",
        "error"
      );

    setIsEditingSubmit(true);
    try {
      for (const origResult of matchToEdit.originalMatch.results) {
        const p = players.find((p) => p.name === origResult.playerName);
        if (p) {
          const isStillInThisMatch = finalResults.some(
            (r) => r.playerName === origResult.playerName
          );
          const hasOtherMatches = matches.some(
            (m) =>
              m.id !== matchToEdit.id &&
              m.results?.some((r) => r.playerName === origResult.playerName)
          );

          if (!isStillInThisMatch && !hasOtherMatches) {
            await deleteDoc(
              doc(db, "artifacts", appId, "public", "data", "players", p.id)
            );
          } else {
            await updateDoc(
              doc(db, "artifacts", appId, "public", "data", "players", p.id),
              {
                points: increment(-origResult.scoreChange),
              }
            );
          }
        }
      }

      for (const r of finalResults) {
        const pName = r.playerName.trim();
        const p = players.find((p) => p.name === pName);
        if (p) {
          await updateDoc(
            doc(db, "artifacts", appId, "public", "data", "players", p.id),
            {
              points: increment(r.scoreChange),
            }
          );
        } else {
          await addDoc(
            collection(db, "artifacts", appId, "public", "data", "players"),
            {
              name: pName,
              points: r.scoreChange,
              createdAt: new Date().toISOString(),
            }
          );
        }
      }

      await updateDoc(
        doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "matches",
          matchToEdit.id
        ),
        {
          gameName: editGameName,
          date: editMatchDate,
          matchType: editMatchMode,
          hasFunding: editHasFunding,
          totalFunding: editHasFunding ? Number(editTotalFunding) || 0 : 0,
          results: finalResults,
          updatedAt: new Date().toISOString(),
        }
      );

      await updateLastModifiedTime();
      showToast("경기 기록이 성공적으로 수정되었습니다.");
      setMatchToEdit(null);
    } catch (error) {
      showToast("수정 중 오류 발생", "error");
    } finally {
      setIsEditingSubmit(false);
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900 to-gray-900 rounded-2xl p-8 shadow-xl border border-green-800/50 relative overflow-hidden flex items-center min-h-[240px]">
        <div className="relative z-10 w-full md:w-3/4 pr-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 md:whitespace-nowrap tracking-tight">
            우왁굳의 버츄얼 종겜 리그에 오신 것을 환영합니다
          </h2>
          <p className="text-gray-300 mb-6 text-sm md:text-base break-keep">
            매주 바뀌는 게임과 실시간으로 갱신되는 티어표를 확인하세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigateTo("tier")}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition"
            >
              <Trophy className="w-5 h-5 mr-2" /> 티어표 보기
            </button>
            <button
              onClick={() => navigateTo("matches")}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 shadow-lg hover:bg-gray-700 transition"
            >
              <Swords className="w-5 h-5 mr-2" /> 경기 기록
            </button>
            <button
              onClick={() => navigateTo("wow")}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-900 to-purple-900 text-white rounded-lg border border-blue-700/50 shadow-lg hover:from-blue-800 hover:to-purple-800 transition"
            >
              <Shield className="w-5 h-5 mr-2" /> 와우 왁타버스 길드
            </button>
            <button
              onClick={() => navigateTo("busking")}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-fuchsia-700 to-rose-600 text-white rounded-lg border border-fuchsia-400/40 shadow-lg hover:from-fuchsia-600 hover:to-rose-500 transition"
            >
              <Megaphone className="w-5 h-5 mr-2" /> 이번주 이벤트 : 와우 버스킹
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-5 flex items-center">
            <Gamepad2 className="w-6 h-6 mr-2 text-green-400" /> 최근 경기
          </h3>
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.slice(0, 3).map((match) => (
                <div
                  key={match.id}
                  className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center">
                      {match.matchType === "team" && (
                        <Users className="w-4 h-4 text-indigo-400 mr-1.5" />
                      )}
                      <p className="font-bold text-white text-lg">
                        {match.gameName}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base text-yellow-400 font-bold">
                      1위:{" "}
                      {match.results?.find((r) => r.rank === 1)?.playerName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">최근 경기가 없습니다.</p>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-5 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-green-400" /> TOP 5
          </h3>
          {players.length > 0 ? (
            <div className="space-y-3">
              {[...players]
                .sort((a, b) => b.points - a.points)
                .slice(0, 5)
                .map((player, idx) => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player.name)}
                    className="flex items-center bg-gray-700/30 p-3 rounded-lg cursor-pointer hover:bg-gray-600/50 transition group"
                  >
                    <div
                      className={`w-10 h-10 text-lg rounded-full flex items-center justify-center font-bold mr-4 ${
                        idx === 0
                          ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                          : idx === 1
                          ? "bg-slate-300 text-black shadow-[0_0_10px_rgba(203,213,225,0.5)]"
                          : idx === 2
                          ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]"
                          : "bg-gray-600 text-white"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <img
                        src={getAvatarSrc(player.name)}
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                        }}
                        alt="avatar"
                        className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 group-hover:border-green-400 transition"
                      />
                      <span className="font-bold text-lg text-white group-hover:text-green-400 transition">
                        {player.name}
                      </span>
                    </div>
                    <div className="text-green-400 font-black text-lg">
                      {player.points} pt
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-lg">참가자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlayersView = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const storageData = JSON.parse(
      localStorage.getItem("wak_vleague_hearts_v1") ||
        '{"date": "", "votes": []}'
    );
    const votesToday = storageData.date === todayStr ? storageData.votes : [];

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Users className="w-48 h-48 text-purple-500" />
          </div>
          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 flex items-center justify-center drop-shadow-md">
              <Users className="w-8 h-8 mr-3 text-purple-400" /> 참가 선수
              갤러리
            </h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto break-keep">
              버츄얼 종겜 리그에 참여한 이력이 있는 스트리머들의 프로필을
              확인하실 수 있습니다.
              <br />
              <span className="text-purple-200 font-medium text-sm md:text-base mt-4 inline-block bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-sm backdrop-blur-sm">
                💡 궁금한 스트리머의 프로필을 클릭해보세요!
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {[...players]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((player) => {
              const hasVotedToday = votesToday.includes(player.name);
              const broadcastLink = player.broadcastUrl?.trim()
                ? player.broadcastUrl
                : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(
                    player.name
                  )}`;

              return (
                <div
                  key={player.id}
                  className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all duration-300 group flex flex-col"
                >
                  <div
                    className="p-4 flex-1 flex flex-col items-center cursor-pointer"
                    onClick={() => setSelectedPlayer(player.name)}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-700 border-2 border-gray-600 mb-3 overflow-hidden group-hover:scale-110 group-hover:border-purple-400 transition-all duration-300 shadow-md">
                      <img
                        src={getAvatarSrc(player.name)}
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                        }}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-white text-base md:text-lg group-hover:text-purple-400 transition-colors">
                      {player.name}
                    </h3>
                    <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2.5 py-0.5 rounded mt-1.5 border border-green-800/30">
                      {player.points} pt
                    </span>
                  </div>
                  <div className="px-3 pb-4 space-y-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheerPlayer(player.id, player.name);
                      }}
                      disabled={cheeringPlayerId === player.id}
                      className={`w-full flex items-center justify-center py-2 rounded-lg font-bold text-xs transition-all duration-300 transform active:scale-95 ${
                        cheeringPlayerId === player.id
                          ? "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed"
                          : hasVotedToday
                          ? "bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500/20 cursor-pointer"
                          : "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_4px_14px_rgba(236,72,153,0.3)]"
                      }`}
                    >
                      {cheeringPlayerId === player.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-gray-400" />{" "}
                          처리 중...
                        </>
                      ) : (
                        <>
                          <Heart
                            className={`w-3.5 h-3.5 mr-1.5 ${
                              hasVotedToday
                                ? "fill-pink-400 text-pink-400"
                                : "fill-transparent text-white"
                            }`}
                          />
                          {hasVotedToday ? "응원완료" : "응원하기"}{" "}
                          {(player.hearts || 0).toLocaleString()}
                        </>
                      )}
                    </button>
                    <a
                      href={broadcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md"
                    >
                      📺 방송국 가기
                    </a>
                  </div>
                </div>
              );
            })}
          {players.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>아직 등록된 선수가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMatchesView = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white flex items-center mb-4">
        <Swords className="w-8 h-8 mr-3 text-green-400" /> 경기 기록
      </h2>
      <div className="grid gap-6">
        {matches.map((match) => {
          if (match.matchType === "team") {
            const teamsByRank = {};
            (match.results || []).forEach((r) => {
              if (!teamsByRank[r.rank])
                teamsByRank[r.rank] = {
                  rank: r.rank,
                  scoreChange: r.scoreChange,
                  players: [],
                };
              teamsByRank[r.rank].players.push(r.playerName);
            });
            const sortedTeams = Object.values(teamsByRank).sort(
              (a, b) => a.rank - b.rank
            );

            return (
              <div
                key={match.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <div className="flex items-center flex-wrap gap-3">
                    <h3 className="text-2xl font-bold text-white">
                      {match.gameName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-3 py-1 rounded text-sm font-bold flex items-center shadow-sm">
                        <Users className="w-4 h-4 mr-1.5" /> 팀전
                      </span>
                      {match.hasFunding && (
                        <button
                          onClick={() =>
                            setExpandedFundingMatchId(
                              expandedFundingMatchId === match.id
                                ? null
                                : match.id
                            )
                          }
                          className="bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded text-sm font-bold flex items-center hover:bg-yellow-800/60 transition shadow-sm"
                        >
                          <Coins className="w-4 h-4 mr-1.5" /> 펀딩 결산{" "}
                          {expandedFundingMatchId === match.id ? (
                            <ChevronUp className="w-4 h-4 ml-1" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-1" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-base text-gray-400">{match.date}</span>
                </div>

                <div className="flex flex-col gap-4">
                  {sortedTeams.map((team, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-lg border ${
                        team.rank === 1
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-gray-700/30 border-gray-600"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4 border-b border-gray-600/50 pb-3">
                        <span
                          className={`text-lg font-bold ${
                            team.rank === 1
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        >
                          {team.rank}위 팀
                        </span>
                        <span
                          className={`text-sm font-bold px-3 py-1 rounded ${
                            team.scoreChange >= 0
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {team.scoreChange > 0 ? "+" : ""}
                          {team.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {team.players.map((p) => (
                          <div
                            key={p}
                            onClick={() => setSelectedPlayer(p)}
                            className="flex items-center bg-gray-900 px-4 py-2 rounded-full border border-gray-700 shadow-sm cursor-pointer hover:border-green-400 transition group"
                          >
                            <img
                              src={getAvatarSrc(p)}
                              onError={(e) => {
                                e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${p}`;
                              }}
                              alt="avatar"
                              className="w-8 h-8 rounded-full mr-2.5 bg-gray-800 object-cover border border-gray-600"
                            />
                            <span className="text-base font-bold text-white group-hover:text-green-400">
                              {p}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {expandedFundingMatchId === match.id && match.hasFunding && (
                  <div className="mt-4 p-5 bg-gradient-to-b from-gray-800 to-gray-900 border border-yellow-700/40 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2">
                    <div className="text-center mb-5 pb-4 border-b border-gray-700/50">
                      <span className="text-sm text-gray-400 font-bold">
                        총 펀딩 규모
                      </span>
                      <div className="text-3xl font-black text-yellow-400 mt-1 flex items-center justify-center">
                        <Star className="w-6 h-6 mr-2 fill-yellow-400 text-yellow-400" />
                        {(match.totalFunding || 0).toLocaleString()} 개
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedTeams.map((team, idx) => {
                        const firstPlayerResult = match.results.find(
                          (r) => r.playerName === team.players[0]
                        );
                        const fAmount = firstPlayerResult?.fundingAmount || 0;
                        const fRatio = firstPlayerResult?.fundingRatio || 0;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-3 border-b border-gray-700/80 pb-3">
                              <span
                                className={`text-base font-bold ${
                                  team.rank === 1
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                {team.rank}위 팀 전리품
                              </span>
                              <div className="text-right">
                                <span className="text-yellow-400 font-black text-xl">
                                  {Number(fAmount).toLocaleString()}개
                                </span>
                                {fRatio > 0 && (
                                  <span className="text-xs text-gray-400 font-bold ml-1.5">
                                    ({fRatio}%)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {team.players.map((p) => (
                                <span
                                  key={p}
                                  className="text-sm text-gray-200 font-medium bg-gray-700 px-2.5 py-1 rounded"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={match.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div className="flex items-center flex-wrap gap-3">
                  <h3 className="text-2xl font-bold text-white">
                    {match.gameName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-700 text-gray-300 border border-gray-600 px-3 py-1 rounded text-sm font-bold flex items-center shadow-sm">
                      <User className="w-4 h-4 mr-1.5" /> 개인전
                    </span>
                    {match.hasFunding && (
                      <button
                        onClick={() =>
                          setExpandedFundingMatchId(
                            expandedFundingMatchId === match.id
                              ? null
                              : match.id
                          )
                        }
                        className="bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 px-3 py-1 rounded text-sm font-bold flex items-center hover:bg-yellow-800/60 transition shadow-sm"
                      >
                        <Coins className="w-4 h-4 mr-1.5" /> 펀딩 결산{" "}
                        {expandedFundingMatchId === match.id ? (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-base text-gray-400">{match.date}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...(match.results || [])]
                  .sort((a, b) => a.rank - b.rank)
                  .map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPlayer(result.playerName)}
                      className={`p-4 rounded-xl border flex flex-col justify-center cursor-pointer transition group hover:-translate-y-1 hover:shadow-lg ${
                        result.rank === 1
                          ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400"
                          : "bg-gray-700/30 border-gray-600 hover:border-green-400"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-gray-300">
                          {result.rank}위
                        </span>
                        <span
                          className={`text-sm font-bold px-3 py-1 rounded ${
                            result.scoreChange >= 0
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {result.scoreChange > 0 ? "+" : ""}
                          {result.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarSrc(result.playerName)}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${result.playerName}`;
                          }}
                          alt="avatar"
                          className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600"
                        />
                        <span className="font-bold text-white truncate text-xl group-hover:text-green-400 transition">
                          {result.playerName}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {expandedFundingMatchId === match.id && match.hasFunding && (
                <div className="mt-4 p-5 bg-gradient-to-b from-gray-800 to-gray-900 border border-yellow-700/40 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2">
                  <div className="text-center mb-5 pb-4 border-b border-gray-700/50">
                    <span className="text-sm text-gray-400 font-bold">
                      총 펀딩 규모
                    </span>
                    <div className="text-3xl font-black text-yellow-400 mt-1 flex items-center justify-center">
                      <Star className="w-6 h-6 mr-2 fill-yellow-400 text-yellow-400" />
                      {(match.totalFunding || 0).toLocaleString()} 개
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...(match.results || [])]
                      .sort((a, b) => a.rank - b.rank)
                      .map((r, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-800 p-3.5 rounded-lg border border-gray-700 shadow-sm hover:border-yellow-500/30 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-base font-black w-8 text-center ${
                                r.rank === 1
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {r.rank}
                            </span>
                            <span className="text-white font-bold text-lg truncate w-24">
                              {r.playerName}
                            </span>
                          </div>
                          <div className="text-right flex flex-col">
                            <span className="text-yellow-400 font-black text-lg">
                              {Number(r.fundingAmount).toLocaleString()}개
                            </span>
                            {r.fundingRatio > 0 && (
                              <span className="text-[10px] text-gray-500 font-bold">
                                ({r.fundingRatio}%)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {matches.length === 0 && (
          <p className="text-gray-400 text-center py-12 text-lg">
            기록이 없습니다.
          </p>
        )}
      </div>
    </div>
  );

  const renderStatsView = () => {
    const mostWinsPlayer = [...playerStatsMap].sort(
      (a, b) => b.winCount - a.winCount || b.points - a.points
    )[0];
    const mostPlayedPlayer = [...playerStatsMap].sort(
      (a, b) => b.matchCount - a.matchCount || b.points - a.points
    )[0];
    const bestAvgPlayer = [...playerStatsMap]
      .filter((p) => p.matchCount > 0)
      .sort((a, b) => b.avgScore - a.avgScore)[0];

    const SortIcon = ({ columnKey }) => {
      if (sortConfig.key !== columnKey)
        return (
          <ChevronDown className="w-4 h-4 ml-1 opacity-30 group-hover:opacity-100 transition" />
        );
      return sortConfig.direction === "asc" ? (
        <ChevronUp className="w-4 h-4 ml-1 text-green-400" />
      ) : (
        <ChevronDown className="w-4 h-4 ml-1 text-green-400" />
      );
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center mb-3">
            <TrendingUp className="w-8 h-8 mr-3 text-indigo-400" /> 종합 통계
            대시보드
          </h2>
          <p className="text-base text-gray-400">
            매주 새로운 게임, 새로운 참가자들이 만들어내는 치열한 리그의 누적
            기록입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-900/40 to-gray-800 border border-yellow-700/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Crown className="w-40 h-40 text-yellow-500" />
            </div>
            <Crown className="w-10 h-10 text-yellow-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-300 mb-1">
              👑 종합 우승왕
            </h3>
            <p className="text-xs md:text-sm text-yellow-500/70 mb-4 text-center break-keep">
              1위를 가장 많이 달성한 유저
            </p>
            {mostWinsPlayer && mostWinsPlayer.winCount > 0 ? (
              <>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setSelectedPlayer(mostWinsPlayer.name)}
                >
                  <img
                    src={getAvatarSrc(mostWinsPlayer.name)}
                    alt="avatar"
                    className="w-12 h-12 rounded-full bg-gray-900 object-cover border-2 border-yellow-500/50 group-hover:scale-110 transition"
                  />
                  <span className="text-2xl font-black text-white group-hover:text-yellow-400 transition">
                    {mostWinsPlayer.name}
                  </span>
                </div>
                <p className="text-yellow-400 font-bold mt-4 bg-yellow-900/30 px-4 py-1.5 rounded-full text-base">
                  총 {mostWinsPlayer.winCount}회 우승
                </p>
              </>
            ) : (
              <span className="text-gray-500 mt-2 text-base">기록 없음</span>
            )}
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-gray-800 border border-emerald-700/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Clover className="w-40 h-40 text-emerald-500" />
            </div>
            <Clover className="w-10 h-10 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-300 mb-1">
              🍀 선택받은 자
            </h3>
            <p className="text-xs md:text-sm text-emerald-500/70 mb-4 text-center break-keep">
              경기에 가장 많이 참가한 유저
            </p>
            {mostPlayedPlayer && mostPlayedPlayer.matchCount > 0 ? (
              <>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setSelectedPlayer(mostPlayedPlayer.name)}
                >
                  <img
                    src={getAvatarSrc(mostPlayedPlayer.name)}
                    alt="avatar"
                    className="w-12 h-12 rounded-full bg-gray-900 object-cover border-2 border-emerald-500/50 group-hover:scale-110 transition"
                  />
                  <span className="text-2xl font-black text-white group-hover:text-emerald-400 transition">
                    {mostPlayedPlayer.name}
                  </span>
                </div>
                <p className="text-emerald-400 font-bold mt-4 bg-emerald-900/30 px-4 py-1.5 rounded-full text-base">
                  총 {mostPlayedPlayer.matchCount}회 참가
                </p>
              </>
            ) : (
              <span className="text-gray-500 mt-2 text-base">기록 없음</span>
            )}
          </div>

          <div className="bg-gradient-to-br from-cyan-900/40 to-gray-800 border border-cyan-700/50 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Gem className="w-40 h-40 text-cyan-500" />
            </div>
            <Gem className="w-10 h-10 text-cyan-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-300 mb-1">
              💎 최고 효율 플레이어
            </h3>
            <p className="text-xs md:text-sm text-cyan-500/70 mb-4 text-center break-keep">
              경기당 평균 획득 점수가 가장 높은 유저
            </p>
            {bestAvgPlayer && bestAvgPlayer.matchCount > 0 ? (
              <>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setSelectedPlayer(bestAvgPlayer.name)}
                >
                  <img
                    src={getAvatarSrc(bestAvgPlayer.name)}
                    alt="avatar"
                    className="w-12 h-12 rounded-full bg-gray-900 object-cover border-2 border-cyan-500/50 group-hover:scale-110 transition"
                  />
                  <span className="text-2xl font-black text-white group-hover:text-cyan-400 transition">
                    {bestAvgPlayer.name}
                  </span>
                </div>
                <p className="text-cyan-400 font-bold mt-4 bg-cyan-900/30 px-4 py-1.5 rounded-full text-base">
                  평균 {bestAvgPlayer.avgScore} pt
                </p>
              </>
            ) : (
              <span className="text-gray-500 mt-2 text-base">기록 없음</span>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8">
          <div className="p-5 border-b border-gray-700 bg-gray-800/50">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-green-400" /> 참가자 전체
              통계 리스트
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className="text-sm text-gray-400 bg-gray-900 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-5 rounded-tl-lg">
                    순위
                  </th>
                  <th scope="col" className="px-6 py-5">
                    선수명
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestSort("matchCount")}
                  >
                    <div className="flex items-center justify-center">
                      참가 횟수 <SortIcon columnKey="matchCount" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestSort("winCount")}
                  >
                    <div className="flex items-center justify-center">
                      1위 횟수 <SortIcon columnKey="winCount" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestSort("avgScore")}
                  >
                    <div className="flex items-center justify-center">
                      평균 획득 점수 <SortIcon columnKey="avgScore" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition rounded-tr-lg"
                    onClick={() => requestSort("points")}
                  >
                    <div className="flex items-center justify-end">
                      총 획득 점수 <SortIcon columnKey="points" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerStats.length > 0 ? (
                  sortedPlayerStats.map((player, idx) => (
                    <tr
                      key={player.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition cursor-pointer"
                      onClick={() => setSelectedPlayer(player.name)}
                    >
                      <td className="px-6 py-5 font-bold text-gray-400 text-lg">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-5 font-bold text-white flex items-center gap-4 text-lg">
                        <img
                          src={getAvatarSrc(player.name)}
                          alt={player.name}
                          className="w-8 h-8 rounded-full bg-gray-900 object-cover border border-gray-600"
                        />
                        {player.name}
                      </td>
                      <td className="px-6 py-5 text-center text-gray-300 text-lg">
                        {player.matchCount}회
                      </td>
                      <td className="px-6 py-5 text-center text-gray-300 text-lg">
                        {player.winCount > 0 ? (
                          <span className="text-yellow-400 font-bold">
                            {player.winCount}회
                          </span>
                        ) : (
                          "0회"
                        )}
                      </td>
                      <td className="px-6 py-5 text-center font-medium text-cyan-400 text-lg">
                        {player.avgScore} pt
                      </td>
                      <td className="px-6 py-5 text-right font-black text-green-400 text-xl">
                        {player.points} pt
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500 text-lg"
                    >
                      아직 등록된 참가자 통계가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTierListView = () => {
    const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
    const totalPlayers = sortedPlayers.length;
    let currentRank = 1;
    const rankedPlayers = sortedPlayers.map((player, index) => {
      if (index > 0 && player.points < sortedPlayers[index - 1].points) {
        currentRank = index + 1;
      }
      return { ...player, rank: currentRank };
    });

    const cutoffs = {
      "S+": Math.ceil(totalPlayers * 0.05),
      S: Math.ceil(totalPlayers * 0.15),
      "A+": Math.ceil(totalPlayers * 0.3),
      A: Math.ceil(totalPlayers * 0.45),
      B: Math.ceil(totalPlayers * 0.65),
      C: Math.ceil(totalPlayers * 0.85),
      D: totalPlayers,
    };

    const getTierIdByRank = (rank) => {
      if (totalPlayers === 0) return "D";
      if (rank <= cutoffs["S+"]) return "S+";
      if (rank <= cutoffs["S"]) return "S";
      if (rank <= cutoffs["A+"]) return "A+";
      if (rank <= cutoffs["A"]) return "A";
      if (rank <= cutoffs["B"]) return "B";
      if (rank <= cutoffs["C"]) return "C";
      return "D";
    };

    const categorizedPlayers = TIER_SETTINGS.map((tier, index) => {
      const playersInTier = rankedPlayers.filter(
        (p) => getTierIdByRank(p.rank) === tier.id
      );
      let startRank = 1;
      if (index > 0) {
        const prevTierId = TIER_SETTINGS[index - 1].id;
        startRank = cutoffs[prevTierId] + 1;
      }
      const endRank = cutoffs[tier.id];
      let rankLabel = "";
      if (totalPlayers > 0) {
        if (startRank > endRank) {
          rankLabel = "(공석)";
        } else if (startRank === endRank) {
          rankLabel = `(${startRank}위)`;
        } else {
          rankLabel = `(${startRank}위 ~ ${endRank}위)`;
        }
      } else {
        rankLabel = "(0명)";
      }
      return { ...tier, players: playersInTier, rankLabel };
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-400" /> 공식 실력
              티어표
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              상대평가(백분율) 기준에 따라 전체 등수로 티어가 실시간 결정됩니다.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col gap-1 p-1">
          {categorizedPlayers.map((tier) => {
            const isEmperor = tier.id === "S+";
            return (
              <div
                key={tier.id}
                className="flex flex-col md:flex-row bg-gray-800 rounded-lg overflow-hidden min-h-[100px] relative border border-gray-700"
              >
                {/* ★ S+ 티어가 들어간 왼쪽 박스에만 황금빛 오라 적용 (오른쪽 테두리는 깔끔하게 회색으로 통일) ★ */}
                <div
                  className={`md:w-28 w-full flex-shrink-0 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-gray-900 shadow-inner relative z-10 overflow-hidden ${
                    isEmperor
                      ? "bg-gradient-to-br from-gray-900 via-black to-yellow-900/40 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                      : tier.color
                  }`}
                >
                  {/* 어둠 속에서 뿜어져 나오는 네온 빛반사 효과 */}
                  {isEmperor && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-500/30 via-transparent to-transparent pointer-events-none"></div>
                  )}
                  {/* 은은하게 빛나는 왕관 */}
                  {isEmperor && (
                    <Crown className="absolute top-2 right-2 w-4 h-4 text-yellow-400 opacity-90 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                  )}

                  {/* S+ 텍스트 자체의 황금빛 그라데이션과 그림자 */}
                  <span
                    className={`text-2xl font-extrabold text-shadow relative z-10 ${
                      isEmperor
                        ? "text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                        : "text-white"
                    }`}
                  >
                    {tier.id}
                  </span>
                  <span
                    className={`text-xs font-bold mt-1 text-center relative z-10 ${
                      isEmperor
                        ? "text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]"
                        : "text-white/90"
                    }`}
                  >
                    {tier.label}
                  </span>
                  <span
                    className={`text-[10px] mt-0.5 text-center relative z-10 ${
                      isEmperor ? "text-yellow-500/80" : "text-white/70"
                    }`}
                  >
                    {tier.rankLabel}
                  </span>
                </div>

                <div className="flex-1 p-4 flex flex-wrap gap-4 items-center bg-gray-800/80">
                  {tier.players.length > 0 ? (
                    tier.players.map((player) => {
                      const streak = getPlayerStreak(player.name);
                      return (
                        <div
                          key={player.id}
                          onClick={() => setSelectedPlayer(player.name)}
                          className="group relative flex flex-col items-center cursor-pointer"
                        >
                          {streak.count >= 2 && (
                            <div
                              className={`absolute -top-2 -right-3 px-1.5 py-0.5 rounded-full text-[10px] font-black z-10 border shadow-md animate-bounce ${
                                streak.type === "win"
                                  ? "bg-red-900/90 text-red-400 border-red-500/50"
                                  : "bg-blue-900/90 text-blue-400 border-blue-500/50"
                              }`}
                            >
                              {streak.type === "win" ? "🔥" : "🧊"}
                              {streak.count}
                              {streak.type === "win" ? "연승" : "연패"}
                            </div>
                          )}
                          <div className="w-16 h-16 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden shadow-lg transition-transform transform group-hover:scale-110 group-hover:border-green-400">
                            <img
                              src={getAvatarSrc(player.name)}
                              onError={(e) => {
                                e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                              }}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="mt-2 text-sm font-medium text-white bg-gray-900/80 px-2 py-0.5 rounded group-hover:text-green-400 transition-colors">
                            {player.name}
                          </span>
                          <span className="text-xs font-bold text-green-400 mt-0.5">
                            {player.points} pt
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-gray-500 text-sm italic p-2">
                      해당 티어 플레이어 없음
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWowView = () => {
    const totalWowMembers = wowRoster.length;
    const qualifiedCount = wowRoster.filter((m) => m.level >= 40).length;
    const qualifyPercent =
      totalWowMembers === 0
        ? 0
        : Math.round((qualifiedCount / totalWowMembers) * 100);

    const avgLevel =
      totalWowMembers === 0
        ? 0
        : (
            wowRoster.reduce((sum, m) => sum + m.level, 0) / totalWowMembers
          ).toFixed(1);
    const top5Wow = [...wowRoster]
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);

    const classCounts = wowRoster.reduce((acc, m) => {
      acc[m.jobClass] = (acc[m.jobClass] || 0) + 1;
      return acc;
    }, {});
    const allClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

    const WowSortIcon = ({ columnKey }) => {
      if (wowSortConfig.key !== columnKey)
        return (
          <ChevronDown className="w-4 h-4 ml-1 opacity-30 group-hover:opacity-100 transition" />
        );
      return wowSortConfig.direction === "asc" ? (
        <ChevronUp className="w-4 h-4 ml-1 text-blue-400" />
      ) : (
        <ChevronDown className="w-4 h-4 ml-1 text-blue-400" />
      );
    };

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-8 shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Shield className="w-64 h-64 text-blue-300" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-3 flex items-center drop-shadow-md">
              <Shield className="w-8 h-8 mr-3 text-blue-400" /> 월드 오브
              워크래프트 x 버츄얼 종겜 리그
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl font-medium shadow-sm">
              왁타버스 길드에 가입하여 피나는 노력 끝에{" "}
              <strong className="text-yellow-400 font-black text-xl px-1">
                레벨 40
              </strong>
              을 달성한 자만이
              <br />
              종겜 리그의 공식 참가권을 얻을 수 있습니다! 과연 누가 가장 먼저
              합류할까요?
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500"></div>
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
            <Ticket className="w-6 h-6 mr-2" /> '종겜 리그 참가권'에 대한 정확한
            안내
          </h3>
          <div className="space-y-3 text-gray-300 text-lg leading-relaxed">
            <p>
              <strong className="text-white">✅ 확정 참가가 아닙니다:</strong>{" "}
              40레벨 달성 시 부여되는 뱃지는 버츄얼 종겜 리그의 '확정 참가
              권리'를 의미하지 않습니다.
            </p>
            <p>
              <strong className="text-white">✅ 핀볼 추첨 자격 획득:</strong>{" "}
              왁굳님의 '와우 로드맵 2.0' 내용에 따라, 추후 종겜 리그에서{" "}
              <strong className="text-blue-300 font-bold">
                "와튜버 한 자리 보장"
              </strong>{" "}
              룰이 적용되어 참가자를 뽑을 때{" "}
              <strong className="text-white font-bold">
                해당 핀볼(룰렛) 추첨 명단에 들어갈 수 있는 자격
              </strong>
              을 의미합니다.
            </p>
            <div className="mt-5 pt-4 border-t border-gray-700">
              <p className="text-base text-gray-400">
                단어 선택으로 인해 마치 '확정 참가'인 것처럼 오해를 불러일으킨
                점, 팬 여러분께 깊은 사과의 말씀을 드립니다. 앞으로 더욱
                정확하게 안내하는 관리자가 되겠습니다.{" "}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-yellow-400" /> 참가권 획득
                진척도
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                레벨 40 이상 달성자 비율
              </p>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-yellow-400">
                  {qualifiedCount}
                  <span className="text-lg text-gray-500 font-bold">
                    {" "}
                    / {totalWowMembers}명
                  </span>
                </span>
                <span className="text-lg font-bold text-white">
                  {qualifyPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-4 border border-gray-700 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${qualifyPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                <Swords className="w-5 h-5 mr-2 text-red-400" /> 길드 전투력
                요약
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                평균 레벨 및 최상위 선발대
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold mb-1">
                  길드 평균 레벨
                </span>
                <span className="text-3xl font-black text-white">
                  Lv. {avgLevel}
                </span>
              </div>
              <div className="flex -space-x-3 overflow-hidden">
                {top5Wow.map((m, i) => (
                  <div
                    key={i}
                    className="relative z-10 inline-block h-12 w-12 rounded-full ring-2 ring-gray-800"
                    title={`${m.streamerName} (Lv.${m.level})`}
                  >
                    <img
                      src={getWowAvatarSrc(m)}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.streamerName}`;
                      }}
                      alt={m.streamerName}
                      className="h-full w-full rounded-full object-cover bg-gray-900"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[10px] font-black px-1.5 rounded-full border border-gray-800">
                      {m.level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-400" /> 직업 분포도
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                길드 내 전체 직업 비율
              </p>
            </div>
            <div>
              <div className="flex h-4 rounded-full overflow-hidden mb-3 border border-gray-700 bg-gray-900">
                {allClasses.map((cls, i) => {
                  const pct =
                    totalWowMembers === 0
                      ? 0
                      : (cls[1] / totalWowMembers) * 100;
                  const bgColor =
                    WOW_CLASS_COLORS[cls[0]] ||
                    fallbackColors[i % fallbackColors.length];
                  return (
                    <div
                      key={i}
                      style={{ width: `${pct}%`, backgroundColor: bgColor }}
                      className="h-full"
                      title={`${cls[0]}: ${cls[1]}명`}
                    ></div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                {allClasses.map((cls, i) => {
                  const bgColor =
                    WOW_CLASS_COLORS[cls[0]] ||
                    fallbackColors[i % fallbackColors.length];
                  return (
                    <div
                      key={i}
                      className="flex items-center text-gray-300 font-medium"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full mr-1.5 border border-gray-600/50"
                        style={{ backgroundColor: bgColor }}
                      ></span>
                      {cls[0]}{" "}
                      <span className="text-gray-500 ml-1">({cls[1]})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8 transition-all duration-300">
          <button
            onClick={() => setIsWowFaqOpen(!isWowFaqOpen)}
            className="w-full p-5 flex items-center justify-between bg-gray-800 hover:bg-gray-700/80 transition-colors outline-none"
          >
            <div className="flex items-center text-blue-300 font-bold text-lg">
              <Activity className="w-5 h-5 mr-2" />
              🕒 캐릭터 레벨은 언제 업데이트되나요?
            </div>
            {isWowFaqOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {isWowFaqOpen && (
            <div className="p-6 pt-2 border-t border-gray-700/50 bg-gray-800/50 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base">
                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    💡 갱신 기준 시간
                  </h4>
                  <p className="pl-6 text-gray-400">
                    캐릭터들의 레벨 최신화 시점은 화면 좌측 최상단 바에 표시되는{" "}
                    <strong className="text-blue-300">최근 갱신 시각</strong>을
                    기준으로 합니다.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    🛠️ 업데이트 방식{" "}
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded ml-2 font-medium">
                      100% 수동 작업
                    </span>
                  </h4>
                  <p className="pl-6 text-gray-400 mb-2 break-keep">
                    현재 레벨 갱신은 게임 시스템과의 자동 연동이 어려워,
                    부득이하게 아래와 같은 방법으로 관리자가 직접 수동으로
                    업데이트하고 있습니다.
                  </p>
                  <ul className="pl-8 list-decimal text-gray-400 space-y-1.5 marker:font-bold marker:text-blue-400/50">
                    <li>
                      관리자가 직접 '월드 오브 워크래프트' 게임 내에 접속하여
                      길드창 확인
                    </li>
                    <li>
                      왁굳님 및 참가 스트리머분들의 생방송 화면을 실시간으로
                      모니터링하여 확인
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    ⏱️ 업데이트 주기
                  </h4>
                  <p className="pl-6 text-gray-400 break-keep">
                    평소에는 관리자가 여유가 생길 때마다 틈틈이 갱신 작업을
                    진행하고 있습니다. 다만, 중요한 컨텐츠나 이벤트가 시작되기
                    직전에는 작업의 우선순위를 가장 높여{" "}
                    <strong className="text-white">
                      최대한 실시간에 가깝게 반영
                    </strong>
                    하려 노력 중입니다.
                  </p>
                </div>

                <div className="bg-gray-900/60 p-5 rounded-lg border border-gray-700/50 mt-4 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                  <h4 className="font-bold text-yellow-400 mb-2 flex items-center text-lg">
                    🙇‍♂️ 팬 여러분께 드리는 말씀
                  </h4>
                  <p className="text-gray-300 text-base break-keep">
                    모든 분들의 레벨을 완벽한 실시간으로 반영하기에는 물리적인
                    어려움이 따르는 점, 팬 여러분들의 너른 양해를 부탁드립니다.
                    조금 느리더라도 확실하게, 늘 더 노력하는 관리자가
                    되겠습니다! 감사합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8">
          <div className="p-5 border-b border-gray-700 bg-gray-800/50 flex flex-col gap-4 relative">
            {/* 상단: 제목, 버튼, 검색창 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-400" /> 왁타버스 길드
                  버튜버 명단
                </h3>
                <button
                  onClick={handleCopyWowApplicantList}
                  className="bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded text-sm font-bold transition flex items-center shadow-sm whitespace-nowrap"
                >
                  📋 버종리 신청 명단 복사하기
                </button>
                <button
                  onClick={() => navigateTo("raid")}
                  className="relative overflow-hidden bg-gradient-to-r from-fuchsia-700/25 via-violet-700/20 to-blue-700/25 text-fuchsia-200 border border-fuchsia-500/40 hover:border-fuchsia-300 hover:text-white px-3.5 py-1.5 rounded text-sm font-black transition flex items-center shadow-[0_0_24px_rgba(168,85,247,0.18)] whitespace-nowrap"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-violet-500/5 to-blue-500/10 opacity-90 transition"></span>
                  <span className="relative flex items-center">
                    <Sparkles className="w-4 h-4 mr-1.5 text-fuchsia-300" />
                    WOW 레이드 만들기
                  </span>
                </button>
              </div>

              <div className="relative flex items-center w-full md:w-auto bg-gray-900 rounded-lg border border-gray-600 p-1 shadow-inner z-20 mt-2 md:mt-0">
                <div className="flex items-center px-2.5">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={wowSearchInput}
                  onChange={(e) => {
                    setWowSearchInput(e.target.value);
                    setShowWowSearchDropdown(true);
                  }}
                  onFocus={() => {
                    if (wowSearchInput) setShowWowSearchDropdown(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowWowSearchDropdown(false), 200)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleWowSearchNext();
                  }}
                  placeholder="스트리머, 직업 찾기..."
                  className="w-full md:w-48 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 py-1.5"
                />
                {wowSearchResults.length > 0 && wowSearchInput && (
                  <span className="text-[10px] text-gray-500 px-2 font-bold whitespace-nowrap select-none">
                    {currentWowSearchIndex + 1}/{wowSearchResults.length}
                  </span>
                )}
                <div className="flex border-l border-gray-700 pl-1 ml-1 select-none">
                  <button
                    onClick={handleWowSearchPrev}
                    className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleWowSearchNext}
                    className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {showWowSearchDropdown && wowSearchResults.length > 0 && (
                  <div className="absolute top-full right-0 mt-2 w-full md:w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden custom-scrollbar max-h-60 z-50">
                    {wowSearchResults.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleWowSearchSelect(m)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700/50 last:border-0 transition"
                      >
                        <img
                          src={getWowAvatarSrc(m)}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.streamerName}`;
                          }}
                          className="w-8 h-8 rounded-full object-cover bg-gray-900 border border-gray-600"
                          alt="avatar"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white leading-tight">
                            {m.streamerName}
                          </span>
                          <div className="flex items-center mt-0.5">
                            <span
                              className="text-xs font-bold"
                              style={{
                                color:
                                  WOW_CLASS_COLORS[m.jobClass] || "#94a3b8",
                              }}
                            >
                              {m.jobClass}
                            </span>
                            <span className="text-gray-500 mx-1 text-[10px]">
                              |
                            </span>
                            <span className="text-xs text-blue-400">
                              {m.wowNickname}
                            </span>
                          </div>
                        </div>
                        <span className="ml-auto text-xs font-black text-yellow-500">
                          Lv.{m.level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {showWowSearchDropdown &&
                  wowSearchInput &&
                  wowSearchResults.length === 0 && (
                    <div className="absolute top-full right-0 mt-2 w-full md:w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-4 text-center text-sm text-gray-400 z-50">
                      검색 결과가 없습니다.
                    </div>
                  )}
              </div>
            </div>

            {/* ★ 하단: 직업 필터 뱃지 구역 (가로 스크롤) ★ */}
            <div
              className="flex overflow-x-auto gap-2.5 pt-2 pb-1 custom-scrollbar w-full items-center"
              style={{ scrollbarWidth: "thin" }}
            >
              {wowJobStats.sortedJobs.map((job) => {
                const count = wowJobStats.stats[job];
                if (count === 0) return null; // 0명인 직업은 숨김

                const isSelected = selectedJobFilter === job;
                // '전체' 버튼의 색상과, 각 직업(마법사, 사제 등)별 파스텔 색상을 자동으로 가져옵니다.
                const baseStyle =
                  job === "전체"
                    ? {
                        color: "#e2e8f0",
                        backgroundColor: "rgba(51, 65, 85, 0.4)",
                        borderColor: "rgba(71, 85, 105, 0.6)",
                      }
                    : getJobBadgeStyle(job);

                return (
                  <button
                    key={job}
                    onClick={() => handleJobFilterClick(job)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                      isSelected
                        ? "ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.2)] transform scale-105"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{
                      ...baseStyle,
                      backgroundColor: isSelected
                        ? baseStyle.color
                        : baseStyle.backgroundColor,
                      color: isSelected ? "#000" : baseStyle.color,
                      borderColor: isSelected
                        ? "transparent"
                        : baseStyle.borderColor,
                    }}
                  >
                    {job}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isSelected
                          ? "bg-black/30 text-white"
                          : "bg-gray-900 text-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-base text-left">
              <thead className="text-sm text-gray-400 bg-gray-900 uppercase">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-5 rounded-tl-lg text-center"
                  >
                    번호
                  </th>
                  <th scope="col" className="px-6 py-5">
                    프로필
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestWowSort("streamerName")}
                  >
                    <div className="flex items-center">
                      스트리머명 <WowSortIcon columnKey="streamerName" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestWowSort("wowNickname")}
                  >
                    <div className="flex items-center">
                      와우 닉네임 <WowSortIcon columnKey="wowNickname" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition"
                    onClick={() => requestWowSort("jobClass")}
                  >
                    <div className="flex items-center">
                      직업 <WowSortIcon columnKey="jobClass" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-5 cursor-pointer group select-none hover:bg-gray-800 transition rounded-tr-lg"
                    onClick={() => requestWowSort("level")}
                  >
                    <div className="flex items-center justify-end">
                      현재 레벨 <WowSortIcon columnKey="level" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedWowRoster.length > 0 ? (
                  sortedWowRoster.map((member, idx) => {
                    const isQualified = member.level >= 40;

                    return (
                      <tr
                        id={`wow-member-${member.id}`}
                        key={member.id}
                        className={`border-b transition-all duration-500 ${
                          highlightedWowMemberId === member.id
                            ? "bg-purple-800/40 border-purple-500 shadow-[inset_0_0_15px_rgba(168,85,247,0.3)]"
                            : isQualified
                            ? "bg-yellow-900/10 hover:bg-yellow-900/20 border-gray-700"
                            : "hover:bg-gray-700/50 border-gray-700"
                        }`}
                      >
                        <td className="px-6 py-5 text-center font-bold text-gray-400 text-lg">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-5">
                          <div className="group relative flex flex-col items-center justify-center w-fit mx-auto md:mx-0 cursor-help z-10">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {member.isWowPartner ? (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[2.5px] shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                  <img
                                    src={getWowAvatarSrc(member)}
                                    onError={(e) => {
                                      e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                                    }}
                                    alt={member.streamerName}
                                    className="w-full h-full rounded-full object-cover border-[1.5px] border-gray-900 bg-gray-900"
                                  />
                                </div>
                              ) : (
                                <img
                                  src={getWowAvatarSrc(member)}
                                  onError={(e) => {
                                    e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                                  }}
                                  alt={member.streamerName}
                                  className={`w-full h-full rounded-full object-cover border-2 ${
                                    isQualified
                                      ? "border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                                      : "border-gray-600"
                                  }`}
                                />
                              )}
                              {member.isWowPartner && (
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-1 shadow-xl border border-yellow-500/50 z-10">
                                  <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.8)]" />
                                </div>
                              )}
                            </div>

                            {member.isWowPartner && (
                              <span className="mt-1.5 text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-widest drop-shadow-md select-none whitespace-nowrap">
                                와트너
                              </span>
                            )}

                            {member.isWowPartner && (
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-max max-w-[220px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] transform translate-y-2 group-hover:translate-y-0">
                                <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/40 rounded-xl p-3.5 shadow-[0_10px_30px_rgba(250,204,21,0.3)] flex flex-col items-center text-center relative overflow-hidden">
                                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent opacity-50"></div>
                                  <Crown className="w-5 h-5 text-yellow-400 mb-2 relative z-10 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                                  <p className="text-xs text-gray-300 leading-relaxed relative z-10 font-medium break-keep">
                                    와우 컨텐츠를 진행.
                                    <br />
                                    길드장{" "}
                                    <strong className="text-yellow-400 font-black text-sm">
                                      『왁두』
                                    </strong>
                                    에게
                                    <br />
                                    칭호를 하사받다.
                                  </p>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-yellow-500/40"></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-6 py-5 font-bold text-lg ${
                            isQualified ? "text-yellow-100" : "text-white"
                          }`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span>{member.streamerName}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {isQualified && member.isApplied && (
                                <span className="bg-green-900/60 text-green-400 border border-green-500/30 text-[10px] px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
                                  ✅ 참가 신청 완료
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-blue-300 font-medium text-lg">
                          {member.wowNickname}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            style={getJobBadgeStyle(member.jobClass)}
                            className="px-3 py-1.5 rounded-md text-sm font-bold border whitespace-nowrap inline-block"
                          >
                            {member.jobClass}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end">
                            <span
                              className={`font-black text-2xl mr-3 ${
                                isQualified
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              Lv. {member.level}
                            </span>
                            <div className="flex flex-col gap-1.5 items-end">
                              {isQualified && (
                                <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-[11px] font-bold px-2 py-1 rounded shadow-md flex items-center">
                                  <Ticket className="w-3 h-3 mr-1" /> 참가권
                                  획득!
                                </span>
                              )}
                              {!isQualified && (
                                <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded border border-gray-700">
                                  40까지 {40 - member.level}렙 남음
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-gray-500 flex-col items-center"
                    >
                      <Shield className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                      선택한 직업 또는 검색어에 해당하는 길드원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderBuskingView = () => {
    const noticeUrl = (buskingSettings.noticeUrl || "").trim();

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-fuchsia-900/40 via-violet-900/35 to-blue-900/40 border border-fuchsia-500/30 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden relative">
          <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
            <Megaphone className="w-40 h-40 text-fuchsia-300" />
          </div>
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
                <Megaphone className="w-8 h-8 md:w-10 md:h-10 text-fuchsia-300" />{" "}
                와우 버스킹
              </h2>
              <p className="text-gray-300 break-keep text-sm md:text-base leading-relaxed">
                와우 버스킹 이벤트에 참여한 스트리머 목록입니다. 방송국 가기
                버튼을 눌러 여러 스트리머의 버스킹을 즐겨보세요!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 xl:min-w-[420px]">
              <div className="bg-white/8 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-gray-300 mb-2">참여한 스트리머수</p>
                <p className="text-3xl font-black text-white">
                  {buskingParticipants.length}
                  <span className="text-base text-gray-400 ml-1">명</span>
                </p>
              </div>
              {noticeUrl ? (
                <a
                  href={noticeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/8 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 hover:bg-white/12 transition"
                >
                  <div>
                    <p className="text-sm text-gray-300 mb-2">이벤트 안내</p>
                    <p className="text-xl font-black text-fuchsia-200">
                      공지사항
                    </p>
                  </div>
                  <Link2 className="w-6 h-6 text-fuchsia-300 flex-shrink-0" />
                </a>
              ) : (
                <div className="bg-white/8 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-70">
                  <div>
                    <p className="text-sm text-gray-300 mb-2">이벤트 안내</p>
                    <p className="text-xl font-black text-gray-300">
                      공지사항 준비중
                    </p>
                  </div>
                  <Megaphone className="w-6 h-6 text-gray-400 flex-shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>

        {buskingParticipants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {buskingParticipants.map((member) => {
              const broadcastLink = member.broadcastUrl?.trim()
                ? member.broadcastUrl
                : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(
                    member.streamerName
                  )}`;
              const broadcastLabel = member.broadcastUrl?.trim()
                ? member.broadcastUrl
                    .replace(/^https?:\/\//, "")
                    .replace(/\/$/, "")
                : "SOOP 검색으로 이동";

              return (
                <div
                  key={member.id}
                  className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-lg hover:border-fuchsia-500/40 transition-all duration-300 group flex flex-col"
                >
                  <div className="p-5 flex-1 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-fuchsia-400/40 bg-gray-900 mb-4 shadow-[0_0_18px_rgba(217,70,239,0.16)]">
                      <img
                        src={getWowAvatarSrc(member)}
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                        }}
                        alt={member.streamerName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h4 className="text-lg font-black text-white break-keep">
                      {member.streamerName}
                    </h4>
                    <p
                      className="text-sm mt-1"
                      style={{
                        color: WOW_CLASS_COLORS[member.jobClass] || "#94a3b8",
                      }}
                    >
                      {member.jobClass} · Lv.{member.level}
                    </p>
                    <p className="text-xs text-gray-400 mt-3 break-all line-clamp-2 min-h-[2.5rem]">
                      {broadcastLabel}
                    </p>
                  </div>
                  <div className="px-4 pb-4">
                    <a
                      href={broadcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-md"
                    >
                      <Tv className="w-4 h-4 mr-2" /> 방송국 가기
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg py-20 text-center text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-25" />
            아직 버스킹 참가자로 등록된 스트리머가 없습니다.
          </div>
        )}
      </div>
    );
  };

  const renderRaidView = () => {
    const totalRaidSlots = raidConfig.totalSlots;
    const assignedCount = raidAssignedMembers.length;
    const remainingCount = Math.max(totalRaidSlots - assignedCount, 0);
    const assignedClassStats = raidAssignedMembers.reduce((acc, member) => {
      acc[member.jobClass] = (acc[member.jobClass] || 0) + 1;
      return acc;
    }, {});
    const raidLevelSummaryLabel = raidSelectedLevelFilters.includes("50+")
      ? "50+"
      : [...raidSelectedLevelFilters]
          .sort(
            (a, b) =>
              RAID_LEVEL_FILTER_OPTIONS.findIndex((item) => item.id === a) -
              RAID_LEVEL_FILTER_OPTIONS.findIndex((item) => item.id === b)
          )
          .join(", ");

    const raidPartyGridClass =
      raidType === "40"
        ? isRaidWaitingRoomCollapsed
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-4"
        : raidType === "25"
        ? isRaidWaitingRoomCollapsed
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3"
        : raidType === "20"
        ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        : "grid-cols-1 md:grid-cols-2";

    const isDenseRaidLayout =
      raidType === "20" || raidType === "25" || raidType === "40";
    const isUltraDenseRaidLayout = raidType === "40";
    const raidSlotMinHeightClass = isUltraDenseRaidLayout
      ? "min-h-[68px]"
      : raidType === "25"
      ? "min-h-[74px]"
      : raidType === "20"
      ? "min-h-[80px]"
      : "min-h-[90px]";
    const raidSlotPaddingClass = isUltraDenseRaidLayout
      ? "p-2.5"
      : isDenseRaidLayout
      ? "p-3"
      : "p-3.5";
    const raidSlotAvatarClass = isUltraDenseRaidLayout
      ? "w-10 h-10"
      : isDenseRaidLayout
      ? "w-11 h-11"
      : "w-12 h-12";
    const raidSlotNameClass = isUltraDenseRaidLayout
      ? "text-[12px]"
      : isDenseRaidLayout
      ? "text-[13px]"
      : "text-sm";
    const raidSlotInfoClass = isUltraDenseRaidLayout
      ? "text-[10px]"
      : "text-[11px]";
    const raidGroupInnerClass = isUltraDenseRaidLayout
      ? "p-2 space-y-1.5"
      : isDenseRaidLayout
      ? "p-2.5 space-y-2"
      : "p-3 space-y-2.5";
    const raidLayoutGridClass = isRaidWaitingRoomCollapsed
      ? "grid-cols-1 xl:grid-cols-[92px_minmax(0,1fr)]"
      : "grid-cols-1 xl:grid-cols-[minmax(300px,30%)_minmax(0,70%)]";

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => navigateTo("wow")}
            className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-700 bg-gray-800/80 text-gray-200 hover:text-white hover:border-blue-500/50 hover:bg-gray-800 transition w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> WOW 명단으로 돌아가기
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyRaidLink}
              className="inline-flex items-center px-3.5 py-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20 transition"
            >
              <Link2 className="w-4 h-4 mr-2" /> #raid 링크 복사
            </button>
            <button
              onClick={handleCopyRaidSummary}
              className="inline-flex items-center px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 transition"
            >
              <Copy className="w-4 h-4 mr-2" /> 편성표 복사
            </button>
            <button
              onClick={handleCaptureRaidScreenshot}
              disabled={isRaidCapturing}
              className={`inline-flex items-center px-3.5 py-2 rounded-xl border transition ${
                isRaidCapturing
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 cursor-wait"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
              }`}
            >
              {isRaidCapturing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}{" "}
              스크린샷 저장
            </button>
            <button
              onClick={handleResetRaid}
              className="inline-flex items-center px-3.5 py-2 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 초기화
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-r from-[#1b1331] via-[#141a33] to-[#10203a] p-6 shadow-[0_20px_60px_rgba(76,29,149,0.18)]">
          <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-fuchsia-500/10 blur-3xl"></div>
          <div className="absolute -bottom-12 left-16 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl pt-0.5">
              <h2 className="text-3xl md:text-4xl font-black text-white flex items-center leading-none">
                <span className="mr-3 text-3xl md:text-4xl">⚔️</span> 레이드
                구성하기
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-full xl:min-w-[460px] self-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-gray-400 mb-1">현재 레이드</div>
                <div className="text-2xl font-black text-white">
                  {raidConfig.label}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-gray-400 mb-1">편성 인원</div>
                <div className="text-2xl font-black text-white">
                  {assignedCount}
                  <span className="text-sm text-gray-400">
                    {" "}
                    / {totalRaidSlots}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-gray-400 mb-1">남은 자리</div>
                <div className="text-2xl font-black text-fuchsia-300">
                  {remainingCount}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-gray-400 mb-1">고정 파티원</div>
                <div className="text-lg font-black text-white truncate">
                  길드장 우왁굳
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/90 shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 bg-gray-900/60 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-black text-white">
                레이드 종류 선택
              </div>
              <div className="text-xs text-gray-400 mt-1">
                규모를 바꾸면 가능한 파티 수가 즉시 바뀌고, 기존 배치는 앞쪽부터
                최대한 유지됩니다.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {RAID_TYPE_OPTIONS.map((option) => {
                const isSelected = raidType === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setRaidType(option.id)}
                    className={`px-4 py-2 rounded-xl border text-sm font-black transition ${
                      isSelected
                        ? "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_18px_rgba(168,85,247,0.18)]"
                        : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500"
                    }`}
                  >
                    {option.label} 레이드
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`grid ${raidLayoutGridClass} gap-5 items-start`}>
          {isRaidWaitingRoomCollapsed ? (
            <div className="xl:sticky xl:top-24">
              <div className="rounded-2xl border border-gray-700 bg-gray-800/90 shadow-xl overflow-hidden">
                <div className="p-3 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRaidWaitingRoomCollapsed(false)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-900/80 text-gray-200 hover:text-white hover:border-fuchsia-500/40 hover:bg-gray-900 transition px-2 py-3 flex flex-col items-center gap-1.5"
                  >
                    <Menu className="w-5 h-5" />
                    <span className="text-[11px] font-black leading-tight text-center">
                      대기실 열기
                    </span>
                  </button>
                  <div className="w-full rounded-xl border border-gray-700 bg-gray-900/60 px-2 py-2 text-center">
                    <div className="text-[10px] text-gray-500">대기 인원</div>
                    <div className="text-base font-black text-white">
                      {raidAvailableMembers.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 xl:sticky xl:top-24">
              <div className="rounded-2xl border border-gray-700 bg-gray-800/90 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-900/60 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center">
                      <Users className="w-5 h-5 mr-2 text-fuchsia-300" /> 대기실
                      명단
                    </h3>
                    <p className="mt-1.5 text-xs text-gray-400">
                      참가자를 끌어다가 오른쪽 슬롯에 배치해보세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRaidWaitingRoomCollapsed(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-xs font-black text-gray-300 hover:text-white hover:border-fuchsia-500/40 hover:bg-gray-700 transition"
                  >
                    <Menu className="w-4 h-4" /> 접기
                  </button>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="relative flex items-center w-full bg-gray-900 rounded-xl border border-gray-700 px-1.5 py-1 shadow-inner">
                    <div className="flex items-center px-2.5">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={raidSearchInput}
                      onChange={(e) => setRaidSearchInput(e.target.value)}
                      placeholder="스트리머, 닉네임, 직업 검색"
                      className="w-full bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 py-1"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {raidJobStats.sortedJobs.map((job) => {
                      const count = raidJobStats.stats[job];
                      if (count === 0) return null;
                      const isSelected = raidSelectedJobFilters.includes(job);
                      const baseStyle =
                        job === "전체"
                          ? {
                              color: "#e2e8f0",
                              backgroundColor: "rgba(51, 65, 85, 0.4)",
                              borderColor: "rgba(71, 85, 105, 0.6)",
                            }
                          : getJobBadgeStyle(job);

                      return (
                        <button
                          key={job}
                          onClick={() => handleRaidJobFilterToggle(job)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                            isSelected
                              ? "ring-2 ring-white/40 shadow-[0_0_10px_rgba(255,255,255,0.15)]"
                              : "opacity-75 hover:opacity-100"
                          }`}
                          style={{
                            ...baseStyle,
                            backgroundColor: isSelected
                              ? baseStyle.color
                              : baseStyle.backgroundColor,
                            color: isSelected ? "#020617" : baseStyle.color,
                            borderColor: isSelected
                              ? "transparent"
                              : baseStyle.borderColor,
                          }}
                        >
                          {job}
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                              isSelected
                                ? "bg-black/25 text-white"
                                : "bg-gray-900 text-gray-300"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setIsRaidLevelFilterOpen((prev) => !prev)
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black transition ${
                          isRaidLevelFilterOpen
                            ? "border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-100"
                            : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500"
                        }`}
                      >
                        <Filter className="w-3.5 h-3.5" /> 레벨
                        <span className="px-1.5 py-0.5 rounded-full bg-black/25 text-[10px] text-gray-100">
                          {raidLevelSummaryLabel}
                        </span>
                        {isRaidLevelFilterOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {isRaidLevelFilterOpen && (
                      <div className="flex flex-wrap items-center gap-2 pl-0.5">
                        {RAID_LEVEL_FILTER_OPTIONS.map((option) => {
                          const isSelected = raidSelectedLevelFilters.includes(
                            option.id
                          );
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                handleRaidLevelFilterToggle(option.id)
                              }
                              className={`px-3 py-1 rounded-full border text-xs font-black transition whitespace-nowrap ${
                                isSelected
                                  ? "border-blue-400/40 bg-blue-500/15 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.14)]"
                                  : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {raidSelectedMember && !raidSelectedMember.isGuildMaster && (
                    <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-3 py-2.5 flex items-center gap-3">
                      <img
                        src={getWowAvatarSrc(raidSelectedMember)}
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${raidSelectedMember.streamerName}`;
                        }}
                        alt={raidSelectedMember.streamerName}
                        className="w-9 h-9 rounded-full object-cover border border-fuchsia-400/40 bg-gray-950 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-fuchsia-200 font-black">
                          클릭 선택됨
                        </div>
                        <div className="text-sm font-black text-white truncate">
                          {raidSelectedMember.streamerName}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[calc(100vh-300px)] min-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                    <div className="grid grid-cols-1 gap-2">
                      {raidAvailableMembers.map((member) => {
                        const isSelected = selectedRaidMemberId === member.id;
                        return (
                          <div
                            key={member.id}
                            draggable
                            onDragStart={(event) =>
                              handleRaidDragStart(event, member.id)
                            }
                            onDragEnd={clearRaidDragState}
                            onClick={() =>
                              setSelectedRaidMemberId((prev) =>
                                prev === member.id ? null : member.id
                              )
                            }
                            className={`rounded-xl border p-2.5 transition cursor-grab active:cursor-grabbing ${
                              isSelected
                                ? "border-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                                : "border-gray-700 bg-gray-900/60 hover:border-gray-500 hover:bg-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={getWowAvatarSrc(member)}
                                onError={(e) => {
                                  e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                                }}
                                alt={member.streamerName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-700 bg-gray-950 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-black text-white break-words leading-tight">
                                  {member.streamerName}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span
                                    style={getJobBadgeStyle(member.jobClass)}
                                    className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap"
                                  >
                                    {member.jobClass}
                                  </span>
                                  <span className="text-[11px] font-black text-gray-300">
                                    Lv. {member.level}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAddRaidMember(member.id);
                                }}
                                className="shrink-0 w-8 h-8 rounded-lg bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30 hover:bg-fuchsia-500/25 transition flex items-center justify-center"
                                aria-label="다음 빈칸에 추가"
                                title="다음 빈칸에 추가"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {raidAvailableMembers.length === 0 && (
                      <div className="rounded-2xl border border-gray-700 bg-gray-900/50 px-6 py-10 text-center text-gray-500 mt-2">
                        조건에 맞는 대기 인원이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className="space-y-5"
            ref={raidScreenshotRef}
            data-raid-screenshot-root="true"
          >
            <div className="rounded-2xl border border-gray-700 bg-gray-800/90 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/60 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-300" />{" "}
                    {raidConfig.label} 레이드 파티 구성
                  </h3>
                  <div className="relative" data-raid-role-layer="true">
                    <button
                      type="button"
                      onClick={() => setIsRaidRoleGuideOpen((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black transition ${
                        isRaidRoleGuideOpen
                          ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                          : "border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-500"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 역할 안내
                    </button>
                    {isRaidRoleGuideOpen && (
                      <div
                        data-raid-role-panel="true"
                        className="absolute left-0 top-[calc(100%+10px)] z-30 w-56 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-3 shadow-2xl"
                      >
                        <div className="text-[11px] font-black text-white mb-2">
                          레이드 역할 안내
                        </div>
                        <div className="space-y-1.5">
                          {RAID_ROLE_OPTIONS.map((role) => (
                            <div
                              key={role.id}
                              className="flex items-center gap-2 text-xs text-gray-200"
                            >
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border ${role.chipClass}`}
                              >
                                {renderRaidRoleIcon(role.id, "w-3.5 h-3.5")}
                              </span>
                              <span className="font-semibold">
                                {role.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">
                          참가자마다 여러 역할을 함께 지정할 수 있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(assignedClassStats).length > 0 ? (
                    Object.entries(assignedClassStats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([job, count]) => (
                        <span
                          key={job}
                          style={getJobBadgeStyle(job)}
                          className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-black border"
                        >
                          {job} <span className="ml-1 opacity-80">{count}</span>
                        </span>
                      ))
                  ) : (
                    <span className="text-sm text-gray-500">
                      아직 편성된 직업이 없습니다.
                    </span>
                  )}
                </div>
              </div>

              <div className={`p-3 grid gap-3 ${raidPartyGridClass}`}>
                {Array.from({ length: raidConfig.groupCount }).map(
                  (_, groupIndex) => {
                    const groupMembers = raidAssignments[groupIndex] || [];
                    const filledCount = groupMembers.filter(Boolean).length;

                    return (
                      <div
                        key={groupIndex}
                        className="rounded-2xl border border-gray-700 bg-gray-900/55 overflow-hidden"
                      >
                        <div
                          className={`px-3 ${
                            isUltraDenseRaidLayout ? "py-2" : "py-2.5"
                          } border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between`}
                        >
                          <div
                            className={`${
                              isUltraDenseRaidLayout ? "text-sm" : "text-base"
                            } font-black text-white`}
                          >
                            파티 {groupIndex + 1}
                          </div>
                          <div className={`${raidSlotInfoClass} text-gray-400`}>
                            {filledCount} / {RAID_SLOT_SIZE}
                          </div>
                        </div>

                        <div className={raidGroupInnerClass}>
                          {groupMembers.map((memberId, slotIndex) => {
                            const member = memberId
                              ? raidMemberMap[memberId]
                              : null;
                            const isLocked = isLockedRaidSlot(
                              groupIndex,
                              slotIndex
                            );
                            const isSelected =
                              memberId && selectedRaidMemberId === memberId;
                            const slotKey = `${groupIndex}-${slotIndex}`;
                            const isDropTarget = raidDragOverSlot === slotKey;
                            const roleIds = member
                              ? raidRoleAssignments[member.id] || []
                              : [];
                            const visibleRoleIds = roleIds.slice(0, 2);
                            const hiddenRoleCount = Math.max(
                              roleIds.length - visibleRoleIds.length,
                              0
                            );
                            const isRoleMenuOpen =
                              raidRoleMenuSlotKey === slotKey;
                            const roleTooltip = roleIds
                              .map((roleId) => getRaidRoleMeta(roleId)?.label)
                              .filter(Boolean)
                              .join(", ");

                            return (
                              <div
                                key={slotKey}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  handleRaidSlotClick(groupIndex, slotIndex)
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    handleRaidSlotClick(groupIndex, slotIndex);
                                  }
                                }}
                                onDragOver={(event) =>
                                  handleRaidSlotDragOver(
                                    event,
                                    groupIndex,
                                    slotIndex
                                  )
                                }
                                onDrop={(event) =>
                                  handleRaidSlotDrop(
                                    event,
                                    groupIndex,
                                    slotIndex
                                  )
                                }
                                onDragLeave={() =>
                                  setRaidDragOverSlot((prev) =>
                                    prev === slotKey ? null : prev
                                  )
                                }
                                draggable={Boolean(member && !isLocked)}
                                onDragStart={(event) =>
                                  handleRaidDragStart(event, memberId)
                                }
                                onDragEnd={clearRaidDragState}
                                className={`w-full rounded-xl border text-left transition overflow-visible ${
                                  isDropTarget
                                    ? "border-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_22px_rgba(168,85,247,0.18)]"
                                    : isSelected
                                    ? "border-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
                                    : member
                                    ? "border-gray-700 bg-gray-800/90 hover:border-blue-400/50 hover:bg-gray-800"
                                    : "border-dashed border-gray-700 bg-gray-900/60 hover:border-fuchsia-500/40 hover:bg-gray-900"
                                } ${
                                  member && !isLocked
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-pointer"
                                }`}
                              >
                                <div
                                  className={`flex items-center gap-2.5 ${raidSlotPaddingClass} ${raidSlotMinHeightClass}`}
                                >
                                  {member ? (
                                    <>
                                      {member.isGuildMaster ? (
                                        <div
                                          className={`${raidSlotAvatarClass} rounded-full bg-gradient-to-br from-yellow-300/25 via-amber-300/10 to-yellow-500/25 border border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.28)] flex items-center justify-center shrink-0 ${
                                            isUltraDenseRaidLayout
                                              ? "text-base"
                                              : "text-lg"
                                          }`}
                                        >
                                          👑
                                        </div>
                                      ) : (
                                        <img
                                          src={getWowAvatarSrc(member)}
                                          onError={(e) => {
                                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                                          }}
                                          alt={member.streamerName}
                                          className={`${raidSlotAvatarClass} rounded-full object-cover border ${
                                            isLocked
                                              ? "border-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.35)]"
                                              : "border-gray-700"
                                          } bg-gray-950 shrink-0`}
                                        />
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <div
                                          className={`${raidSlotNameClass} font-black text-white truncate`}
                                        >
                                          {member.streamerName}
                                        </div>
                                        <div
                                          className={`flex items-center gap-1.5 mt-1 flex-wrap ${raidSlotInfoClass}`}
                                        >
                                          <span
                                            style={getJobBadgeStyle(
                                              member.jobClass
                                            )}
                                            className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap"
                                          >
                                            {member.jobClass}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="min-w-0 flex-1">
                                      <div
                                        className={`${raidSlotNameClass} font-black text-gray-400`}
                                      >
                                        빈 슬롯
                                      </div>
                                    </div>
                                  )}

                                  {member && (
                                    <div
                                      className="relative shrink-0"
                                      data-raid-role-layer="true"
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRaidRoleMenuSlotKey((prev) =>
                                            prev === slotKey ? null : slotKey
                                          );
                                        }}
                                        title={roleTooltip || "역할 지정"}
                                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 transition ${
                                          roleIds.length > 0
                                            ? "border-violet-400/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/15"
                                            : "border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-violet-400/30"
                                        }`}
                                      >
                                        {roleIds.length > 0 ? (
                                          <>
                                            {visibleRoleIds.map((roleId) => (
                                              <span
                                                key={roleId}
                                                className="inline-flex"
                                              >
                                                {renderRaidRoleIcon(
                                                  roleId,
                                                  "w-3.5 h-3.5"
                                                )}
                                              </span>
                                            ))}
                                            {hiddenRoleCount > 0 && (
                                              <span className="text-[10px] font-black text-violet-100">
                                                +{hiddenRoleCount}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black">
                                              역할
                                            </span>
                                          </>
                                        )}
                                      </button>

                                      {isRoleMenuOpen && (
                                        <div
                                          data-raid-role-panel="true"
                                          className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-2 shadow-2xl"
                                        >
                                          <div className="px-2 pb-2 text-[10px] font-black text-gray-400">
                                            역할 배지 설정
                                          </div>
                                          <div className="space-y-1">
                                            {RAID_ROLE_OPTIONS.map((role) => {
                                              const isActive = roleIds.includes(
                                                role.id
                                              );
                                              return (
                                                <button
                                                  key={role.id}
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleRaidRole(
                                                      member.id,
                                                      role.id
                                                    );
                                                  }}
                                                  className={`w-full flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                                    isActive
                                                      ? `${role.chipClass} shadow-[0_0_12px_rgba(255,255,255,0.06)]`
                                                      : "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800"
                                                  }`}
                                                >
                                                  <span className="flex items-center gap-2 min-w-0">
                                                    {renderRaidRoleIcon(
                                                      role.id,
                                                      "w-3.5 h-3.5"
                                                    )}
                                                    <span className="truncate">
                                                      {role.label}
                                                    </span>
                                                  </span>
                                                  {isActive && (
                                                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {member && !isLocked && (
                                    <button
                                      type="button"
                                      data-no-screenshot="true"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveRaidMember(
                                          groupIndex,
                                          slotIndex
                                        );
                                      }}
                                      className={`${
                                        isUltraDenseRaidLayout
                                          ? "w-6 h-6"
                                          : "w-7 h-7"
                                      } rounded-full border border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-red-400/40 hover:bg-red-500/10 flex items-center justify-center transition shrink-0`}
                                      aria-label="슬롯에서 제거"
                                    >
                                      <X
                                        className={`${
                                          isUltraDenseRaidLayout
                                            ? "w-3 h-3"
                                            : "w-3.5 h-3.5"
                                        }`}
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    if (!isAdminAuth)
      return (
        <div className="max-w-md mx-auto mt-10 bg-gray-800 rounded-xl p-8 text-center shadow-xl border border-gray-700">
          <Lock className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-6">관리자 로그인</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="text"
              value={adminNicknameInput}
              onChange={(e) => setAdminNicknameInput(e.target.value)}
              placeholder="관리자 닉네임을 입력하세요 (예: 스태프A)"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-center border border-gray-600 focus:border-green-500 outline-none"
              required
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-center border border-gray-600 focus:border-green-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition flex items-center justify-center shadow-lg"
            >
              {isAdminLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "안전하게 접속하기"
              )}
            </button>
          </form>
        </div>
      );

    const handleCleanGhostData = async () => {
      if (
        !user ||
        !window.confirm(
          "경기 기록이 전혀 없는 '유령 선수'들을 찾아 명단에서 모두 삭제하시겠습니까?"
        )
      )
        return;
      setIsCleaningGhosts(true);
      try {
        let deletedCount = 0;
        for (const p of players) {
          const hasMatch = matches.some((m) =>
            m.results?.some((r) => r.playerName === p.name)
          );
          if (!hasMatch) {
            await deleteDoc(
              doc(db, "artifacts", appId, "public", "data", "players", p.id)
            );
            deletedCount++;
          }
        }
        await updateLastModifiedTime();
        if (deletedCount > 0) {
          showToast(
            `총 ${deletedCount}명의 유령 데이터를 성공적으로 청소했습니다!`
          );
        } else {
          showToast("삭제할 유령 데이터가 없습니다. (모두 정상입니다)");
        }
      } catch (error) {
        showToast("유령 데이터 청소 중 오류가 발생했습니다.", "error");
      } finally {
        setIsCleaningGhosts(false);
      }
    };

    const handleDeletePlayer = async (playerId, playerName) => {
      if (
        !user ||
        !window.confirm(
          `정말 [${playerName}] 선수를 명단에서 강제 삭제하시겠습니까?\n\n(주의: 이 선수가 참여한 경기 기록이 남아있다면 데이터가 꼬일 수 있으니, 경기 기록이 없는 '유령 선수'만 삭제해주세요!)`
        )
      )
        return;
      try {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "players", playerId)
        );
        await updateLastModifiedTime();
        showToast(`[${playerName}] 선수가 명단에서 영구 삭제되었습니다.`);
      } catch (error) {
        showToast("선수 삭제 중 오류가 발생했습니다.", "error");
      }
    };

    const handleSubmitMatch = async (e) => {
      e.preventDefault();
      if (!gameName.trim())
        return showToast("게임 이름을 입력해주세요.", "error");

      let finalResults = [];
      if (matchMode === "individual") {
        finalResults = individualResults
          .filter((r) => r.playerName.trim() !== "")
          .map((r) => ({
            playerName: r.playerName.trim(),
            rank: r.rank,
            scoreChange: r.scoreChange,
            ...(hasFunding
              ? {
                  fundingRatio: Number(r.fundingRatio) || 0,
                  fundingAmount: Number(r.fundingAmount) || 0,
                }
              : {}),
          }));
      } else {
        teamResults.forEach((team) => {
          team.players.forEach((pName) => {
            if (pName.trim() !== "") {
              finalResults.push({
                playerName: pName.trim(),
                rank: team.rank,
                scoreChange: team.scoreChange,
                ...(hasFunding
                  ? {
                      fundingRatio: Number(team.fundingRatio) || 0,
                      fundingAmount: Number(team.fundingAmount) || 0,
                    }
                  : {}),
              });
            }
          });
        });
      }

      if (finalResults.length === 0)
        return showToast(
          "최소 1명 이상의 유효한 참가자를 입력해주세요.",
          "error"
        );

      setIsSubmitting(true);
      try {
        await addDoc(
          collection(db, "artifacts", appId, "public", "data", "matches"),
          {
            date: matchDate,
            gameName,
            createdAt: new Date().toISOString(),
            matchType: matchMode,
            hasFunding,
            totalFunding: hasFunding ? Number(totalFunding) || 0 : 0,
            results: finalResults,
          }
        );

        for (const r of finalResults) {
          const pName = r.playerName.trim();
          const p = players.find((p) => p.name === pName);
          if (p)
            await updateDoc(
              doc(db, "artifacts", appId, "public", "data", "players", p.id),
              { points: p.points + r.scoreChange }
            );
          else
            await addDoc(
              collection(db, "artifacts", appId, "public", "data", "players"),
              {
                name: pName,
                points: 0 + r.scoreChange,
                createdAt: new Date().toISOString(),
              }
            );
        }

        setGameName("");
        setHasFunding(false);
        setTotalFunding("");
        setIndividualResults([
          {
            playerName: "",
            rank: 1,
            scoreChange: 100,
            fundingRatio: "",
            fundingAmount: "",
          },
          {
            playerName: "",
            rank: 2,
            scoreChange: 50,
            fundingRatio: "",
            fundingAmount: "",
          },
        ]);
        setTeamResults([
          {
            id: 1,
            rank: 1,
            scoreChange: 100,
            players: ["", ""],
            fundingRatio: "",
            fundingAmount: "",
          },
          {
            id: 2,
            rank: 2,
            scoreChange: -50,
            players: ["", ""],
            fundingRatio: "",
            fundingAmount: "",
          },
        ]);
        await updateLastModifiedTime();
        showToast("결과 저장 성공!");
        navigateTo("tier");
      } catch (error) {
        showToast("오류 발생", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* 상단 관리자 접속 현황 */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-green-400" /> 현재 활동
              중인 관리자 ({activeAdmins.length}명)
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeAdmins.map((admin) => (
                <span
                  key={admin.id}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                    admin.name === currentAdminName
                      ? "bg-green-900/50 text-green-400 border border-green-500/50"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 mr-2 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                  {admin.name}{" "}
                  {admin.name === currentAdminName && (
                    <span className="ml-1 opacity-60 text-xs">(나)</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleAdminLogout}
            className="text-sm font-bold flex items-center text-red-400 hover:text-white bg-red-900/30 hover:bg-red-600 px-4 py-2 rounded-lg transition shrink-0 border border-red-800/50"
          >
            <Unlock className="w-4 h-4 mr-1.5" /> 로그아웃
          </button>
        </div>

        {/* ★ 관리자 탭 분리 메뉴 ★ */}
        <div className="flex gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-700">
          <button
            onClick={() => setAdminInnerTab("main")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg flex justify-center items-center transition-all ${
              adminInnerTab === "main"
                ? "bg-gray-700 text-white shadow-md border border-gray-600"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" /> 메인 설정
          </button>
          <button
            onClick={() => setAdminInnerTab("etc")}
            className={`flex-1 py-3 text-sm font-bold rounded-lg flex justify-center items-center transition-all ${
              adminInnerTab === "etc"
                ? "bg-gray-700 text-white shadow-md border border-gray-600"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Layers className="w-4 h-4 mr-2" /> 기타 설정 (공지 등)
          </button>
        </div>

        {/* =========================================================
            [메인 설정] 탭 컨텐츠
            ========================================================= */}
        {adminInnerTab === "main" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <PlusCircle className="w-6 h-6 mr-2 text-green-400" /> 새 경기
                  결과 등록
                </h2>
              </div>

              <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
                <button
                  type="button"
                  onClick={() => setMatchMode("individual")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${
                    matchMode === "individual"
                      ? "bg-gray-700 text-white shadow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" /> 개인전
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode("team")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${
                    matchMode === "team"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" /> 팀전
                </button>
              </div>

              <form onSubmit={handleSubmitMatch} className="space-y-6">
                <div className="bg-gray-900 border border-yellow-700/50 rounded-lg p-4 flex flex-col gap-4">
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={hasFunding}
                      onChange={(e) => setHasFunding(e.target.checked)}
                      className="w-5 h-5 accent-yellow-500 rounded bg-gray-800 border-gray-600 cursor-pointer"
                    />
                    <span className="text-yellow-400 font-bold flex items-center text-base select-none">
                      <Coins className="w-5 h-5 mr-2" /> 펀딩/상금 결산 추가하기
                    </span>
                  </label>
                  {hasFunding && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <span className="text-sm text-gray-300 font-bold whitespace-nowrap">
                        총 모인 별풍선 개수:
                      </span>
                      <div className="flex items-center w-full sm:w-auto">
                        <input
                          type="number"
                          placeholder="예: 100000"
                          value={totalFunding}
                          onChange={(e) => setTotalFunding(e.target.value)}
                          className="w-full sm:w-48 bg-gray-900 border border-gray-600 text-yellow-400 font-black rounded-l-lg px-4 py-2 focus:border-yellow-500 outline-none text-right"
                        />
                        <span className="bg-gray-700 border border-l-0 border-gray-600 text-gray-300 px-4 py-2 rounded-r-lg font-bold">
                          개
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="게임 이름"
                    className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2"
                    required
                  />
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2"
                    required
                  />
                </div>

                {matchMode === "individual" && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">
                    <p className="text-xs font-bold text-gray-500 mb-2">
                      개인별 순위와 점수를 입력합니다.
                    </p>
                    {individualResults.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50"
                      >
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={r.rank}
                            onChange={(e) => {
                              const n = [...individualResults];
                              n[idx].rank = Number(e.target.value);
                              setIndividualResults(n);
                            }}
                            className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={r.playerName}
                            onChange={(e) => {
                              const n = [...individualResults];
                              n[idx].playerName = e.target.value;
                              setIndividualResults(n);
                            }}
                            placeholder="참가자 이름"
                            className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600"
                          />
                          <input
                            type="number"
                            value={r.scoreChange}
                            onChange={(e) => {
                              const n = [...individualResults];
                              n[idx].scoreChange = Number(e.target.value);
                              setIndividualResults(n);
                            }}
                            placeholder="점수"
                            className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (individualResults.length > 1)
                                setIndividualResults(
                                  individualResults.filter((_, i) => i !== idx)
                                );
                            }}
                            className="p-2 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        {hasFunding && (
                          <div className="flex gap-2 items-center sm:pl-[72px]">
                            <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                              💰 상금:
                            </span>
                            <input
                              type="number"
                              placeholder="비율(%)"
                              value={r.fundingRatio || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const n = [...individualResults];
                                n[idx].fundingRatio = val;
                                n[idx].fundingAmount =
                                  val && totalFunding
                                    ? Math.floor(
                                        (Number(totalFunding) * Number(val)) /
                                          100
                                      )
                                    : "";
                                setIndividualResults(n);
                              }}
                              className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none"
                            />
                            <span className="text-gray-500 text-xs font-bold">
                              % ➔
                            </span>
                            <input
                              type="number"
                              placeholder="별풍선(직접수정 가능)"
                              value={r.fundingAmount || ""}
                              onChange={(e) => {
                                const n = [...individualResults];
                                n[idx].fundingAmount = e.target.value;
                                n[idx].fundingRatio = "";
                                setIndividualResults(n);
                              }}
                              className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none"
                            />
                            <span className="text-gray-500 text-xs font-bold mr-8">
                              개
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setIndividualResults([
                          ...individualResults,
                          {
                            playerName: "",
                            rank: individualResults.length + 1,
                            scoreChange: 0,
                            fundingRatio: "",
                            fundingAmount: "",
                          },
                        ])
                      }
                      className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition"
                    >
                      참가자 추가
                    </button>
                  </div>
                )}

                {matchMode === "team" && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-indigo-400 mb-2">
                      팀 단위로 순위와 점수를 한 번만 입력하고, 팀원 이름을
                      추가하세요.
                    </p>
                    {teamResults.map((team, tIdx) => (
                      <div
                        key={team.id}
                        className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden flex flex-col"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 mb-1">
                              순위
                            </span>
                            <input
                              type="number"
                              value={team.rank}
                              onChange={(e) => {
                                const n = [...teamResults];
                                n[tIdx].rank = Number(e.target.value);
                                setTeamResults(n);
                              }}
                              className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1"
                            />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="text-[10px] text-gray-500 mb-1">
                              팀 전체 획득/감소 점수
                            </span>
                            <input
                              type="number"
                              value={team.scoreChange}
                              onChange={(e) => {
                                const n = [...teamResults];
                                n[tIdx].scoreChange = Number(e.target.value);
                                setTeamResults(n);
                              }}
                              placeholder="점수"
                              className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1"
                            />
                          </div>
                          <div className="flex flex-col justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (teamResults.length > 2)
                                  setTeamResults(
                                    teamResults.filter((_, i) => i !== tIdx)
                                  );
                              }}
                              className="p-2 text-gray-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {hasFunding && (
                          <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 mb-2">
                            <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                              💰 팀상금:
                            </span>
                            <input
                              type="number"
                              placeholder="비율(%)"
                              value={team.fundingRatio || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const n = [...teamResults];
                                n[tIdx].fundingRatio = val;
                                n[tIdx].fundingAmount =
                                  val && totalFunding
                                    ? Math.floor(
                                        (Number(totalFunding) * Number(val)) /
                                          100
                                      )
                                    : "";
                                setTeamResults(n);
                              }}
                              className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none"
                            />
                            <span className="text-gray-500 text-xs font-bold">
                              % ➔
                            </span>
                            <input
                              type="number"
                              placeholder="팀에 분배될 별풍선(수동수정 가능)"
                              value={team.fundingAmount || ""}
                              onChange={(e) => {
                                const n = [...teamResults];
                                n[tIdx].fundingAmount = e.target.value;
                                n[tIdx].fundingRatio = "";
                                setTeamResults(n);
                              }}
                              className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none"
                            />
                            <span className="text-gray-500 text-xs font-bold">
                              개
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {team.players.map((pName, pIdx) => (
                            <div key={pIdx} className="flex gap-1">
                              <input
                                type="text"
                                value={pName}
                                onChange={(e) => {
                                  const n = [...teamResults];
                                  n[tIdx].players[pIdx] = e.target.value;
                                  setTeamResults(n);
                                }}
                                placeholder="팀원 이름"
                                className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (team.players.length > 1) {
                                    const n = [...teamResults];
                                    n[tIdx].players.splice(pIdx, 1);
                                    setTeamResults(n);
                                  }
                                }}
                                className="text-gray-500 hover:text-red-400 px-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const n = [...teamResults];
                            n[tIdx].players.push("");
                            setTeamResults(n);
                          }}
                          className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50"
                        >
                          + 팀원 추가
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setTeamResults([
                          ...teamResults,
                          {
                            id: Date.now(),
                            rank: teamResults.length + 1,
                            scoreChange: 0,
                            players: ["", ""],
                            fundingRatio: "",
                            fundingAmount: "",
                          },
                        ])
                      }
                      className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm"
                    >
                      새로운 팀 라인 추가
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "결과 DB에 저장 및 갱신"
                  )}
                </button>
              </form>
            </div>

            <div className="bg-gradient-to-b from-blue-900/20 to-gray-800 rounded-xl p-6 border border-blue-800/40 shadow-lg">
              <h2 className="text-xl font-bold text-blue-300 mb-2 flex items-center">
                <Shield className="w-5 h-5 mr-2" /> WOW 왁타버스 길드 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                와우 서버에서 플레이 중인 버튜버 캐릭터를 등록하고, 방송을 보며
                실시간으로 레벨을 갱신해주세요.
              </p>

              <form
                onSubmit={handleAddWowMember}
                className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={wowStreamerName}
                    onChange={(e) => setWowStreamerName(e.target.value)}
                    placeholder="스트리머명 (예: 단답벌레)"
                    className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={wowNickname}
                    onChange={(e) => setWowNickname(e.target.value)}
                    placeholder="와우 닉네임"
                    className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    value={wowJobClass}
                    onChange={(e) => setWowJobClass(e.target.value)}
                    placeholder="직업 (예: 전사)"
                    className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={wowLevel}
                      onChange={(e) => setWowLevel(e.target.value)}
                      placeholder="레벨"
                      min="1"
                      max="70"
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isWowSubmitting}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded font-bold transition whitespace-nowrap"
                    >
                      {isWowSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "등록"
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={wowAdminSearchTerm}
                    onChange={(e) => setWowAdminSearchTerm(e.target.value)}
                    placeholder="스트리머명, 닉네임, 직업으로 검색..."
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div className="relative w-full sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    value={wowAdminSortOption}
                    onChange={(e) => setWowAdminSortOption(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm appearance-none focus:border-blue-500 outline-none transition"
                  >
                    <option value="levelDesc">레벨 높은 순 ▼</option>
                    <option value="levelAsc">레벨 낮은 순 ▲</option>
                    <option value="nameAsc">이름 가나다순 정렬</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {wowRoster
                  .filter(
                    (member) =>
                      member.streamerName
                        .toLowerCase()
                        .includes(wowAdminSearchTerm.toLowerCase()) ||
                      member.wowNickname
                        .toLowerCase()
                        .includes(wowAdminSearchTerm.toLowerCase()) ||
                      member.jobClass
                        .toLowerCase()
                        .includes(wowAdminSearchTerm.toLowerCase())
                  )
                  .sort((a, b) => {
                    if (wowAdminSortOption === "levelDesc")
                      return b.level - a.level;
                    if (wowAdminSortOption === "levelAsc")
                      return a.level - b.level;
                    if (wowAdminSortOption === "nameAsc")
                      return a.streamerName.localeCompare(b.streamerName);
                    return 0;
                  })
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center bg-gray-800 border border-gray-700 p-3 rounded-lg hover:border-blue-500/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center gap-0.5 w-fit">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            {member.isWowPartner ? (
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[2px] shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                                <img
                                  src={getWowAvatarSrc(member)}
                                  onError={(e) => {
                                    e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                                  }}
                                  alt="avatar"
                                  className="w-full h-full rounded-full object-cover border-[1.5px] border-gray-900 bg-gray-900"
                                />
                              </div>
                            ) : (
                              <img
                                src={getWowAvatarSrc(member)}
                                onError={(e) => {
                                  e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                                }}
                                alt="avatar"
                                className="w-full h-full rounded-full bg-gray-900 object-cover border border-gray-600"
                              />
                            )}
                            {member.isWowPartner && (
                              <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-0.5 shadow-lg border border-yellow-500/50 z-10">
                                <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              </div>
                            )}
                          </div>
                          {member.isWowPartner && (
                            <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-widest select-none whitespace-nowrap">
                              와트너
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {member.streamerName}
                            </span>
                            <span
                              style={getJobBadgeStyle(member.jobClass)}
                              className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap"
                            >
                              {member.jobClass}
                            </span>
                          </div>
                          <div className="text-xs text-blue-400">
                            {member.wowNickname}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-2 mr-2">
                          <button
                            onClick={() =>
                              handleToggleWowPartner(
                                member.id,
                                member.isWowPartner
                              )
                            }
                            className={`px-3 py-1 rounded text-xs font-bold transition flex items-center border ${
                              member.isWowPartner
                                ? "bg-yellow-900/50 text-yellow-400 border-yellow-500/50 hover:bg-yellow-800"
                                : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white"
                            }`}
                          >
                            {member.isWowPartner
                              ? "👑 와트너 해제"
                              : "🎬 와트너 임명"}
                          </button>
                          {member.level >= 40 && (
                            <button
                              onClick={() =>
                                handleToggleWowApply(
                                  member.id,
                                  member.isApplied
                                )
                              }
                              className={`px-3 py-1 rounded text-xs font-bold transition flex items-center border ${
                                member.isApplied
                                  ? "bg-green-900/50 text-green-400 border-green-500/50 hover:bg-green-800"
                                  : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white"
                              }`}
                            >
                              {member.isApplied
                                ? "✅ 참가 신청 ON"
                                : "📝 참가 신청 OFF"}
                            </button>
                          )}
                          {member.level >= 40 && (
                            <button
                              onClick={() =>
                                handleToggleBuskingParticipant(
                                  member.id,
                                  member.isBuskingParticipant,
                                  member.level
                                )
                              }
                              className={`px-3 py-1 rounded text-xs font-bold transition flex items-center border ${
                                member.isBuskingParticipant
                                  ? "bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-800"
                                  : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600 hover:text-white"
                              }`}
                            >
                              {member.isBuskingParticipant
                                ? "🎤 버스킹 참가 ON"
                                : "🎤 버스킹 참가 OFF"}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
                          <button
                            onClick={() =>
                              handleUpdateWowLevel(member.id, member.level - 1)
                            }
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-black text-yellow-400">
                            Lv {member.level}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateWowLevel(member.id, member.level + 1)
                            }
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteWowMember(member.id)}
                          className="text-gray-500 hover:text-red-400 transition p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                {wowRoster.length === 0 && (
                  <p className="text-center text-gray-500 py-6">
                    검색된 길드원이 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-b from-fuchsia-900/20 to-gray-800 rounded-xl p-6 border border-fuchsia-800/40 shadow-lg">
              <h2 className="text-xl font-bold text-fuchsia-200 mb-2 flex items-center">
                <Megaphone className="w-5 h-5 mr-2 text-fuchsia-300" /> 와우
                버스킹 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6 break-keep">
                40레벨 이상 길드원 중에서 이번 주 버스킹 참가자를 지정하고,
                공지사항 링크를 관리할 수 있습니다.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                  <p className="text-xs text-gray-400 mb-2">참가 가능 인원</p>
                  <p className="text-2xl font-black text-white">
                    {buskingEligibleMembers.length}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                  <p className="text-xs text-gray-400 mb-2">선정된 참가자</p>
                  <p className="text-2xl font-black text-fuchsia-300">
                    {buskingParticipants.length}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                  <p className="text-xs text-gray-400 mb-2">공지사항 링크</p>
                  <p
                    className={`text-lg font-black ${
                      buskingSettings.noticeUrl
                        ? "text-emerald-300"
                        : "text-gray-300"
                    }`}
                  >
                    {buskingSettings.noticeUrl ? "등록됨" : "없음"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 mb-6">
                <p className="text-sm font-bold text-white mb-3">
                  와우 버스킹 공지사항 링크
                </p>
                <div className="flex flex-col lg:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={buskingNoticeLinkInput}
                    onChange={(e) => setBuskingNoticeLinkInput(e.target.value)}
                    className="flex-1 bg-gray-800 text-sm text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-fuchsia-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBuskingNoticeUrl}
                      disabled={isBuskingAdminSaving}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                        isBuskingAdminSaving
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                      }`}
                    >
                      저장
                    </button>
                    <button
                      onClick={handleDeleteBuskingNoticeUrl}
                      disabled={isBuskingAdminSaving}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap ${
                        isBuskingAdminSaving
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-gray-700 hover:bg-gray-600 text-white border border-gray-500"
                      }`}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {buskingEligibleMembers.length > 0 ? (
                  buskingEligibleMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getWowAvatarSrc(member)}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                          }}
                          alt={member.streamerName}
                          className="w-11 h-11 rounded-full bg-gray-800 object-cover border border-gray-600"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">
                            {member.streamerName}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {member.jobClass} · Lv.{member.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                        <button
                          onClick={() =>
                            handleToggleBuskingParticipant(
                              member.id,
                              member.isBuskingParticipant,
                              member.level
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                            member.isBuskingParticipant
                              ? "bg-fuchsia-900/50 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-800"
                              : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                          }`}
                        >
                          {member.isBuskingParticipant ? "참가 ON" : "참가 OFF"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-6">
                    40레벨 이상 WOW 길드원이 아직 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Tv className="w-5 h-5 mr-2 text-fuchsia-300" /> WOW 버스킹
                방송국 주소 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                버스킹 참가자 카드의 방송국 가기 버튼에 연결될 주소를
                입력해주세요. 비워두면 SOOP 검색으로 연결됩니다.
              </p>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {[...wowRoster]
                  .sort((a, b) =>
                    a.streamerName.localeCompare(b.streamerName, "ko")
                  )
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex flex-col justify-center w-32 flex-shrink-0">
                        <span
                          className="font-bold text-white truncate"
                          title={member.streamerName}
                        >
                          {member.streamerName}
                        </span>
                        <span className="text-[11px] text-gray-500 truncate">
                          {member.jobClass} · Lv.{member.level}
                        </span>
                      </div>
                      <div className="flex flex-1 gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={
                            wowBroadcastUrlInputs[member.id] !== undefined
                              ? wowBroadcastUrlInputs[member.id]
                              : member.broadcastUrl || ""
                          }
                          onChange={(e) =>
                            setWowBroadcastUrlInputs({
                              ...wowBroadcastUrlInputs,
                              [member.id]: e.target.value,
                            })
                          }
                          className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-fuchsia-500 outline-none"
                        />
                        <button
                          onClick={() =>
                            handleUpdateWowBroadcastUrl(
                              member.id,
                              wowBroadcastUrlInputs[member.id]
                            )
                          }
                          className="px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ))}
                {wowRoster.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    등록된 길드원이 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* ★ WOW 길드원 프로필 이미지 관리 ★ */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-400" /> WOW 길드원
                프로필 이미지 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 와우 캐릭터
                혹은 버튜버 사진을 변경할 수 있습니다. <br />
                (빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[...wowRoster]
                  .sort((a, b) => a.streamerName.localeCompare(b.streamerName))
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3 w-32 flex-shrink-0">
                        <img
                          src={getWowAvatarSrc(member)}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
                          }}
                          alt="avatar"
                          className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0"
                        />
                        <span
                          className="font-bold text-white w-16 truncate"
                          title={member.streamerName}
                        >
                          {member.streamerName}
                        </span>
                      </div>
                      <div className="flex flex-1 gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={
                            wowImageInputs[member.id] !== undefined
                              ? wowImageInputs[member.id]
                              : member.imageUrl || ""
                          }
                          onChange={(e) =>
                            setWowImageInputs({
                              ...wowImageInputs,
                              [member.id]: e.target.value,
                            })
                          }
                          className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-blue-500 outline-none"
                        />
                        <button
                          onClick={() =>
                            handleUpdateWowImage(
                              member.id,
                              wowImageInputs[member.id]
                            )
                          }
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ))}
                {wowRoster.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    등록된 길드원이 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-400" /> 종겜 리그
                참가자 이미지 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 종겜 리그
                참가자의 사진을 변경할 수 있습니다. <br />
                (빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[...players]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3 w-32 flex-shrink-0 relative group/player">
                        <img
                          src={getAvatarSrc(player.name)}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`;
                          }}
                          alt="avatar"
                          className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0"
                        />
                        <div className="flex flex-col">
                          <span
                            className="font-bold text-white truncate w-16"
                            title={player.name}
                          >
                            {player.name}
                          </span>
                          {/* ★ 관리자 강제 삭제 버튼 추가 ★ */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePlayer(player.id, player.name)
                            }
                            className="text-[10px] text-red-400 hover:text-red-300 flex items-center mt-0.5 opacity-60 hover:opacity-100 transition w-max"
                          >
                            <Trash2 className="w-3 h-3 mr-0.5" /> 삭제
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-1 gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={
                            imageInputs[player.id] !== undefined
                              ? imageInputs[player.id]
                              : player.imageUrl || ""
                          }
                          onChange={(e) =>
                            setImageInputs({
                              ...imageInputs,
                              [player.id]: e.target.value,
                            })
                          }
                          className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-green-500 outline-none"
                        />
                        <button
                          onClick={() =>
                            handleUpdateImage(player.id, imageInputs[player.id])
                          }
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ))}
                {players.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    등록된 참가자가 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Tv className="w-5 h-5 mr-2 text-indigo-400" /> 종겜 리그 참가자
                방송국 주소 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                스트리머의 실제 방송국 주소(유튜브, 치지직, SOOP 등)를
                입력해주세요. <br />
                (빈칸으로 두시면 선수의 이름으로 자동 검색하여 SOOP으로
                연결됩니다.)
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[...players]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg"
                    >
                      <div className="flex flex-col justify-center w-28 flex-shrink-0">
                        <span
                          className="font-bold text-white truncate"
                          title={player.name}
                        >
                          {player.name}
                        </span>
                        {/* ★ 관리자 강제 삭제 버튼 추가 ★ */}
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePlayer(player.id, player.name)
                          }
                          className="text-[10px] text-red-400 hover:text-red-300 flex items-center mt-0.5 opacity-60 hover:opacity-100 transition w-max"
                        >
                          <Trash2 className="w-3 h-3 mr-0.5" /> 삭제
                        </button>
                      </div>
                      <div className="flex flex-1 gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={
                            broadcastUrlInputs[player.id] !== undefined
                              ? broadcastUrlInputs[player.id]
                              : player.broadcastUrl || ""
                          }
                          onChange={(e) =>
                            setBroadcastUrlInputs({
                              ...broadcastUrlInputs,
                              [player.id]: e.target.value,
                            })
                          }
                          className="flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                        />
                        <button
                          onClick={() =>
                            handleUpdateBroadcastUrl(
                              player.id,
                              broadcastUrlInputs[player.id]
                            )
                          }
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ))}
                {players.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    등록된 참가자가 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Swords className="w-5 h-5 mr-2 text-red-400" /> 등록된 경기
                관리 (수정 및 삭제)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                경기를 수정하거나 삭제하면 해당 경기로 증감된 참가자들의 점수가
                자동으로 재계산/복구됩니다.
              </p>

              <div className="space-y-3">
                {matches.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    등록된 경기가 없습니다.
                  </p>
                ) : (
                  matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-lg"
                    >
                      <div>
                        <span className="font-bold text-white mr-3">
                          {match.gameName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {match.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditMatch(match)}
                          className="flex items-center text-sm bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition"
                        >
                          <Edit className="w-4 h-4 mr-1" /> 수정
                        </button>
                        <button
                          onClick={() => setMatchToDelete(match)}
                          className="flex items-center text-sm bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> 삭제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ★ 유령 데이터 자동 청소기 구역 ★ */}
            <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-300 mb-2 flex items-center">
                <Search className="w-5 h-5 mr-2" /> 👻 유령 데이터(빈 껍데기)
                자동 청소
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                과거의 오류나 수정으로 인해 경기 기록은 없는데 티어표나 선수
                명단에 이름만 남아있는{" "}
                <strong className="text-white">
                  유령 선수들을 한 번에 찾아내어 완전 삭제
                </strong>
                합니다.
              </p>
              <button
                type="button"
                onClick={handleCleanGhostData}
                disabled={isCleaningGhosts}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"
              >
                {isCleaningGhosts ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "🔍 유령 데이터 찾아서 영구 삭제하기"
                )}
              </button>
            </div>

            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-300 mb-2">
                🚨 데이터베이스 완벽 초기화
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                기존에 쌓인 테스트용 데이터를 싹 지우고, 참가자가{" "}
                <strong className="text-white">0명인 완전 초기 상태</strong>로
                리셋합니다. (실전 오픈용)
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> 모든 데이터 지우고
                백지상태로 시작하기
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            [기타 설정] 탭 컨텐츠 (팝업 관리)
            ========================================================= */}
        {adminInnerTab === "etc" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                <Megaphone className="w-6 h-6 mr-2 text-indigo-400" /> 사이트
                팝업(공지사항) 띄우기
              </h2>
              <p className="text-sm text-gray-400 mb-6 break-keep">
                사이트 방문자들이 접속했을 때 가운데에 나타나는 팝업창을
                작성합니다.
                <br />
                유저가{" "}
                <strong className="text-white">[오늘 하루 보지 않기]</strong>를
                누르더라도, 여기서 내용을 새로 수정하여 저장하면 다시 유저들에게
                나타납니다!
              </p>

              <form onSubmit={handleSavePopup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-300 ml-1">
                    팝업 제목
                  </label>
                  <input
                    type="text"
                    value={popupTitleInput}
                    onChange={(e) => setPopupTitleInput(e.target.value)}
                    placeholder="예: 📢 왁타버스 새로운 내전 이벤트 안내!"
                    className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-300 ml-1">
                    팝업 상세 내용
                  </label>
                  <textarea
                    value={popupContentInput}
                    onChange={(e) => setPopupContentInput(e.target.value)}
                    placeholder="공지하실 내용을 입력해주세요. (엔터키를 치면 줄바꿈이 그대로 적용됩니다.)"
                    className="w-full h-48 bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 outline-none resize-none custom-scrollbar"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"
                  >
                    <Megaphone className="w-5 h-5 mr-2" /> 새 내용으로 팝업
                    띄우기
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePopup}
                    className="flex-1 py-3 bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white font-bold rounded-lg flex justify-center items-center border border-red-800/50 transition"
                  >
                    <Trash2 className="w-5 h-5 mr-2" /> 팝업 내리기
                  </button>
                </div>
              </form>

              {/* 팝업 미리보기 상태창 */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-gray-400" /> 현재 팝업
                  송출 상태
                </h3>
                {sitePopup && sitePopup.isActive ? (
                  <div className="bg-gradient-to-b from-gray-900 to-gray-800 p-5 rounded-lg border border-indigo-500/30 shadow-inner">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-black tracking-wider">
                        송출 중 (ON)
                      </span>
                      <span className="text-xs text-gray-500">
                        최종 수정:{" "}
                        {new Date(sitePopup.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">
                      {sitePopup.title}
                    </h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {sitePopup.content}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-900 p-5 rounded-lg border border-gray-700 flex flex-col items-center justify-center py-10">
                    <CheckSquare className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-gray-400 font-medium">
                      현재 유저들에게 노출 중인 팝업이 없습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && !activeTab)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> 데이터 로딩 중...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans pb-20">
      {/* =========================================================
          ★ 유저 친화적인 사이트 공지사항(팝업) 모달 ★
          ========================================================= */}
      {showSitePopup && sitePopup && sitePopup.isActive && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
            {/* 팝업 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/80">
              <h3 className="text-lg font-black text-white flex items-center">
                <Megaphone className="w-5 h-5 mr-2 text-indigo-400" /> 공지사항
              </h3>
              <button
                onClick={() => setShowSitePopup(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 팝업 내용 */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-900/50">
              <h2 className="text-xl font-bold text-white mb-4 leading-tight">
                {sitePopup.title}
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-keep">
                {sitePopup.content}
              </p>
            </div>

            {/* 팝업 하단 (오늘 하루 보지 않기 + 닫기) */}
            <div className="p-3 border-t border-gray-700 bg-gray-800 flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer group px-2">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const todayStr = new Date().toISOString().split("T")[0];
                      localStorage.setItem(
                        "wak_popup_hidden_today",
                        `${todayStr}_${sitePopup.updatedAt}`
                      );
                      setShowSitePopup(false);
                    }
                  }}
                  className="w-4 h-4 accent-indigo-500 rounded bg-gray-700 border-gray-600 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 select-none transition-colors">
                  오늘 하루 보지 않기
                </span>
              </label>
              <button
                onClick={() => setShowSitePopup(false)}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-[300] px-6 py-3 rounded-lg shadow-2xl text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {matchToEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-10 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full border border-blue-500/50 shadow-2xl relative my-auto">
            <button
              onClick={() => setMatchToEdit(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center mb-6">
              <Edit className="w-6 h-6 mr-2 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">경기 기록 수정</h3>
            </div>

            <form onSubmit={handleSaveEditedMatch} className="space-y-6">
              <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditMatchMode("individual")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${
                    editMatchMode === "individual"
                      ? "bg-gray-700 text-white shadow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <User className="w-4 h-4 mr-2" /> 개인전
                </button>
                <button
                  type="button"
                  onClick={() => setEditMatchMode("team")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${
                    editMatchMode === "team"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" /> 팀전
                </button>
              </div>

              <div className="bg-gray-900 border border-yellow-700/50 rounded-lg p-4 flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={editHasFunding}
                    onChange={(e) => setEditHasFunding(e.target.checked)}
                    className="w-5 h-5 accent-yellow-500 rounded bg-gray-800 border-gray-600 cursor-pointer"
                  />
                  <span className="text-yellow-400 font-bold flex items-center text-base select-none">
                    <Coins className="w-5 h-5 mr-2" /> 펀딩/상금 결산 추가하기
                  </span>
                </label>
                {editHasFunding && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <span className="text-sm text-gray-300 font-bold whitespace-nowrap">
                      총 모인 별풍선 개수:
                    </span>
                    <div className="flex items-center w-full sm:w-auto">
                      <input
                        type="number"
                        placeholder="예: 100000"
                        value={editTotalFunding}
                        onChange={(e) => setEditTotalFunding(e.target.value)}
                        className="w-full sm:w-48 bg-gray-900 border border-gray-600 text-yellow-400 font-black rounded-l-lg px-4 py-2 focus:border-yellow-500 outline-none text-right"
                      />
                      <span className="bg-gray-700 border border-l-0 border-gray-600 text-gray-300 px-4 py-2 rounded-r-lg font-bold">
                        개
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={editGameName}
                  onChange={(e) => setEditGameName(e.target.value)}
                  placeholder="게임 이름"
                  className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2"
                  required
                />
                <input
                  type="date"
                  value={editMatchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2"
                  required
                />
              </div>

              {editMatchMode === "individual" && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 mt-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    개인별 순위와 점수를 수정합니다.
                  </p>
                  {editIndividualResults.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50"
                    >
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={r.rank}
                          onChange={(e) => {
                            const n = [...editIndividualResults];
                            n[idx].rank = Number(e.target.value);
                            setIndividualResults(n);
                          }}
                          className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600"
                        />
                        <input
                          type="text"
                          value={r.playerName}
                          onChange={(e) => {
                            const n = [...editIndividualResults];
                            n[idx].playerName = e.target.value;
                            setIndividualResults(n);
                          }}
                          placeholder="참가자 이름"
                          className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600"
                        />
                        <input
                          type="number"
                          value={r.scoreChange}
                          onChange={(e) => {
                            const n = [...editIndividualResults];
                            n[idx].scoreChange = Number(e.target.value);
                            setIndividualResults(n);
                          }}
                          placeholder="점수"
                          className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editIndividualResults.length > 1)
                              setIndividualResults(
                                editIndividualResults.filter(
                                  (_, i) => i !== idx
                                )
                              );
                          }}
                          className="p-2 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      {editHasFunding && (
                        <div className="flex gap-2 items-center sm:pl-[72px]">
                          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                            💰 상금:
                          </span>
                          <input
                            type="number"
                            placeholder="비율(%)"
                            value={r.fundingRatio || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...editIndividualResults];
                              n[idx].fundingRatio = val;
                              n[idx].fundingAmount =
                                val && editTotalFunding
                                  ? Math.floor(
                                      (Number(editTotalFunding) * Number(val)) /
                                        100
                                    )
                                  : "";
                              setEditIndividualResults(n);
                            }}
                            className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none"
                          />
                          <span className="text-gray-500 text-xs font-bold">
                            % ➔
                          </span>
                          <input
                            type="number"
                            placeholder="별풍선(직접수정 가능)"
                            value={r.fundingAmount || ""}
                            onChange={(e) => {
                              const n = [...editIndividualResults];
                              n[idx].fundingAmount = e.target.value;
                              n[idx].fundingRatio = "";
                              setEditIndividualResults(n);
                            }}
                            className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none"
                          />
                          <span className="text-gray-500 text-xs font-bold mr-8">
                            개
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setEditIndividualResults([
                        ...editIndividualResults,
                        {
                          playerName: "",
                          rank: editIndividualResults.length + 1,
                          scoreChange: 0,
                          fundingRatio: "",
                          fundingAmount: "",
                        },
                      ])
                    }
                    className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition"
                  >
                    참가자 추가
                  </button>
                </div>
              )}

              {editMatchMode === "team" && (
                <div className="space-y-4 mt-4">
                  <p className="text-xs font-bold text-indigo-400 mb-2">
                    팀 기록을 수정합니다.
                  </p>
                  {editTeamResults.map((team, tIdx) => (
                    <div
                      key={team.id}
                      className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden flex flex-col"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                      <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 mb-1">
                            순위
                          </span>
                          <input
                            type="number"
                            value={team.rank}
                            onChange={(e) => {
                              const n = [...editTeamResults];
                              n[tIdx].rank = Number(e.target.value);
                              setEditTeamResults(n);
                            }}
                            className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1"
                          />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] text-gray-500 mb-1">
                            팀 전체 획득/감소 점수
                          </span>
                          <input
                            type="number"
                            value={team.scoreChange}
                            onChange={(e) => {
                              const n = [...editTeamResults];
                              n[tIdx].scoreChange = Number(e.target.value);
                              setTeamResults(n);
                            }}
                            placeholder="점수"
                            className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (editTeamResults.length > 1)
                                setEditTeamResults(
                                  editTeamResults.filter((_, i) => i !== tIdx)
                                );
                            }}
                            className="p-2 text-gray-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {editHasFunding && (
                        <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 mb-2">
                          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                            💰 팀상금:
                          </span>
                          <input
                            type="number"
                            placeholder="비율(%)"
                            value={team.fundingRatio || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const n = [...editTeamResults];
                              n[tIdx].fundingRatio = val;
                              n[tIdx].fundingAmount =
                                val && editTotalFunding
                                  ? Math.floor(
                                      (Number(editTotalFunding) * Number(val)) /
                                        100
                                    )
                                  : "";
                              setEditTeamResults(n);
                            }}
                            className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none"
                          />
                          <span className="text-gray-500 text-xs font-bold">
                            % ➔
                          </span>
                          <input
                            type="number"
                            placeholder="팀에 분배될 별풍선(수동수정 가능)"
                            value={team.fundingAmount || ""}
                            onChange={(e) => {
                              const n = [...editTeamResults];
                              n[tIdx].fundingAmount = e.target.value;
                              n[tIdx].fundingRatio = "";
                              setEditTeamResults(n);
                            }}
                            className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none"
                          />
                          <span className="text-gray-500 text-xs font-bold">
                            개
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {team.players.map((pName, pIdx) => (
                          <div key={pIdx} className="flex gap-1">
                            <input
                              type="text"
                              value={pName}
                              onChange={(e) => {
                                const n = [...editTeamResults];
                                n[tIdx].players[pIdx] = e.target.value;
                                setTeamResults(n);
                              }}
                              placeholder="팀원 이름"
                              className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (team.players.length > 1) {
                                  const n = [...editTeamResults];
                                  n[tIdx].players.splice(pIdx, 1);
                                  setTeamResults(n);
                                }
                              }}
                              className="text-gray-500 hover:text-red-400 px-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const n = [...editTeamResults];
                          n[tIdx].players.push("");
                          setTeamResults(n);
                        }}
                        className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50"
                      >
                        + 팀원 추가
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setTeamResults([
                        ...teamResults,
                        {
                          id: Date.now(),
                          rank: teamResults.length + 1,
                          scoreChange: 0,
                          players: ["", ""],
                          fundingRatio: "",
                          fundingAmount: "",
                        },
                      ])
                    }
                    className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm"
                  >
                    새로운 팀 라인 추가
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMatchToEdit(null)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmit}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg"
                >
                  {isEditingSubmit ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "수정 내용 저장"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {matchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">
                정말 삭제하시겠습니까?
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              <span className="font-bold text-yellow-400">
                [{matchToDelete.gameName}]
              </span>{" "}
              경기를 삭제합니다.
              <br />
              이 경기로 얻거나 잃은 참가자들의 점수가 <br />
              모두 이전으로 되돌아갑니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteMatch}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center"
              >
                {isDeleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "삭제 및 복구"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">
                정말 초기화하시겠습니까?
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              지금까지의{" "}
              <span className="font-bold text-red-400">
                모든 경기 기록과 참가자가 삭제
              </span>
              됩니다.
              <br />
              <br />
              삭제 후 참가자가 아무도 없는 완전한
              <br />
              '백지 상태'로 즉시 전환됩니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium"
              >
                취소
              </button>
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center"
              >
                {isResetting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "초기화 및 실전 시작"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ★ 실수로 누락되었던 개인 프로필 팝업창 코드 완벽 복구 ★ */}
      {selectedPlayer &&
        (() => {
          const stats = getPlayerStats(selectedPlayer);
          const playerInfo = players.find((p) => p.name === selectedPlayer);
          if (!playerInfo) return null;

          const todayStr = new Date().toISOString().split("T")[0];
          const storageData = JSON.parse(
            localStorage.getItem("wak_vleague_hearts_v1") ||
              '{"date": "", "votes": []}'
          );
          const hasVotedToday =
            storageData.date === todayStr &&
            storageData.votes.includes(selectedPlayer);

          const broadcastLink = playerInfo.broadcastUrl?.trim()
            ? playerInfo.broadcastUrl
            : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(
                selectedPlayer
              )}`;

          return (
            <div
              className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
              onClick={() => setSelectedPlayer(null)}
            >
              <div
                className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-900 p-6 flex flex-col items-center relative border-b border-gray-700">
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div className="w-24 h-24 rounded-2xl bg-gray-700 border-4 border-green-500/50 overflow-hidden shadow-lg mb-4">
                    <img
                      src={getAvatarSrc(selectedPlayer)}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedPlayer}`;
                      }}
                      alt={selectedPlayer}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    {selectedPlayer}
                  </h3>
                  <span className="text-green-400 font-bold mt-1 text-lg">
                    {playerInfo.points} pt
                  </span>

                  <div className="flex flex-col items-center mt-5 w-full gap-2">
                    <button
                      onClick={() =>
                        handleCheerPlayer(playerInfo.id, selectedPlayer)
                      }
                      disabled={cheeringPlayerId === playerInfo.id}
                      className={`flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 w-full ${
                        cheeringPlayerId === playerInfo.id
                          ? "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed hover:scale-100 active:scale-100"
                          : hasVotedToday
                          ? "bg-pink-500/10 border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:bg-pink-500/20"
                          : "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                      }`}
                    >
                      {cheeringPlayerId === playerInfo.id ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-400" />{" "}
                          처리 중...
                        </>
                      ) : (
                        <>
                          <Heart
                            className={`w-3.5 h-3.5 mr-1.5 ${
                              hasVotedToday
                                ? "fill-pink-400 text-pink-400"
                                : "fill-transparent text-white"
                            }`}
                          />
                          {hasVotedToday ? "응원 완료!" : "응원하기"}{" "}
                          {(playerInfo.hearts || 0).toLocaleString()}
                        </>
                      )}
                    </button>

                    <a
                      href={broadcastLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all duration-300 transform hover:scale-105 w-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                    >
                      <Tv className="w-5 h-5 mr-2" /> 방송국 가기
                    </a>

                    <p className="text-xs text-gray-500 mt-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 text-center break-keep w-full">
                      💡 스트리머 1명당{" "}
                      <strong className="text-gray-300">하루에 1번만</strong>{" "}
                      응원할 수 있습니다.
                      <br />
                      (다시 누르면 취소됩니다)
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-700 bg-gray-800/50 border-b border-gray-700">
                  <div className="flex flex-col items-center py-4">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      총 참가
                    </span>
                    <span className="text-xl font-bold text-white">
                      {stats.totalMatches}전
                    </span>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      우승 확률(1위)
                    </span>
                    <span className="text-xl font-bold text-yellow-400">
                      {stats.winRate}%
                    </span>
                  </div>
                  <div className="flex flex-col items-center py-4 px-2 text-center">
                    <span className="text-xs text-gray-400 font-medium mb-1">
                      주력 종목
                    </span>
                    <span className="text-sm font-bold text-indigo-300 leading-tight break-keep">
                      {stats.mostPlayedGame}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-1.5" /> 최근 전적 (최대
                    5경기)
                  </h4>
                  {stats.recentMatches.length === 0 ? (
                    <p className="text-center text-gray-500 py-6 text-sm">
                      경기 기록이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700/50"
                        >
                          <div className="flex-1 truncate pr-2">
                            <p className="text-sm font-bold text-white truncate">
                              {m.gameName}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {m.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold ${
                                m.rank === 1
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {m.rank}위
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded w-14 text-center ${
                                m.scoreChange >= 0
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {m.scoreChange > 0 ? "+" : ""}
                              {m.scoreChange}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      <nav className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between sticky top-0 z-50 shadow-md">
        <div
          className="max-w-6xl mx-auto w-full flex justify-between items-center overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <h1
              className="text-lg md:text-xl font-bold text-white cursor-pointer flex items-center whitespace-nowrap"
              onClick={() => navigateTo("home")}
            >
              <Gamepad2 className="w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2 text-green-400" />{" "}
              버츄얼 종겜 리그
            </h1>
            <a
              href="https://www.sooplive.co.kr/station/ecvhao"
              target="_blank"
              rel="noopener noreferrer"
              title="우왁굳 방송국"
              className="flex items-center justify-center px-2 py-0.5 bg-black text-green-400 border border-green-500/50 rounded text-xs font-black tracking-widest hover:bg-green-400 hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(74,222,128,0.3)] hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]"
            >
              WAK
            </a>
            {lastUpdated && (
              <span className="ml-2 md:ml-3 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
                <RefreshCw className="w-3 h-3 mr-1 opacity-70" /> 최근 갱신:{" "}
                {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <span className="ml-1 md:ml-2 text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap">
              <Users className="w-3 h-3 mr-1 opacity-70" /> 오늘 방문자:{" "}
              {todayVisits}
            </span>
          </div>
          <div className="flex space-x-1 md:space-x-2 ml-4 flex-shrink-0">
            <button
              onClick={() => navigateTo("home")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                activeTab === "home"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              홈
            </button>
            <button
              onClick={() => navigateTo("players")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                activeTab === "players"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              선수
            </button>
            <button
              onClick={() => navigateTo("matches")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                activeTab === "matches"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              경기
            </button>
            <button
              onClick={() => navigateTo("stats")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                activeTab === "stats"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              통계
            </button>
            <button
              onClick={() => navigateTo("tier")}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                activeTab === "tier"
                  ? "bg-gray-800 text-green-400"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              티어
            </button>
            <button
              onClick={() => navigateTo("wow")}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center whitespace-nowrap ${
                activeTab === "wow"
                  ? "bg-blue-900/50 text-blue-400 border border-blue-500/50"
                  : "text-blue-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Shield className="w-4 h-4 mr-1" /> WOW
            </button>
            <button
              onClick={() => navigateTo("busking")}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center whitespace-nowrap ${
                activeTab === "busking"
                  ? "bg-fuchsia-900/50 text-fuchsia-300 border border-fuchsia-500/50"
                  : "text-fuchsia-200 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Megaphone className="w-4 h-4 mr-1" /> 와우 버스킹
            </button>
            <button
              onClick={() => navigateTo("admin")}
              className={`px-3 py-1.5 rounded border border-gray-600 flex items-center text-sm font-medium whitespace-nowrap ${
                activeTab === "admin"
                  ? "bg-gray-800 text-green-400 border-green-500"
                  : "text-gray-400 hover:text-white hover:border-gray-400"
              }`}
            >
              {isAdminAuth ? (
                <Unlock className="w-3 h-3 mr-1" />
              ) : (
                <Lock className="w-3 h-3 mr-1" />
              )}{" "}
              관리
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 relative">
        {activeTab === "home" && renderHomeView()}
        {activeTab === "players" && renderPlayersView()}
        {activeTab === "matches" && renderMatchesView()}
        {activeTab === "stats" && renderStatsView()}
        {activeTab === "tier" && renderTierListView()}
        {activeTab === "wow" && renderWowView()}
        {activeTab === "busking" && renderBuskingView()}
        {activeTab === "raid" && renderRaidView()}
        {activeTab === "admin" && renderAdminView()}
      </main>

      {/* =========================================================
          ★ 모바일 전용 퀵 메뉴 플로팅 버튼 (FAB) ★
          ========================================================= */}
      {/* 바탕 어두워지는 레이어 (메뉴 밖을 클릭하면 닫히게 함) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[390] bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* 플로팅 메뉴 컨테이너 */}
      <div className="fixed bottom-6 left-6 z-[400] md:hidden flex flex-col items-start">
        {/* 촤라락 펼쳐지는 세로 탭 리스트 */}
        <div
          className={`flex flex-col gap-2 mb-4 origin-bottom-left transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isMobileMenuOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-0 opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          {[
            { id: "home", label: "홈", icon: Gamepad2 },
            { id: "players", label: "선수", icon: User },
            { id: "matches", label: "경기", icon: Swords },
            { id: "stats", label: "통계", icon: BarChart3 },
            { id: "tier", label: "티어", icon: Trophy },
            { id: "wow", label: "WOW", icon: Shield },
            { id: "busking", label: "와우 버스킹", icon: Megaphone },
            { id: "admin", label: "관리", icon: isAdminAuth ? Unlock : Lock },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigateTo(item.id);
                setIsMobileMenuOpen(false); // 탭 이동 후 메뉴 자동 닫기
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${
                activeTab === item.id
                  ? "bg-gray-800 border-green-500/50 text-green-400 font-black shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                  : "bg-gray-800/90 border-gray-700/50 text-white font-bold hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 동그란 메인 토글 버튼 */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300 transform active:scale-95 ${
            isMobileMenuOpen
              ? "bg-gray-800 border border-gray-600 rotate-90 shadow-none text-gray-400"
              : "bg-green-600 hover:bg-green-500 rotate-0"
          }`}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
