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
  Settings,
  Layers,
  Megaphone,
  CheckSquare,
  SlidersHorizontal,
  Menu,
  ArrowLeft,
  Copy,
  Link2,
  Sparkles,
  Globe,
  Sun,
  Moon
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
  writeBatch
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
  { id: "S+", name: "S+ 티어", color: "bg-red-800", percent: 5, label: "상위 5%" },
  { id: "S", name: "S 티어", color: "bg-red-500", percent: 15, label: "상위 6% ~ 15%" },
  { id: "A+", name: "A+ 티어", color: "bg-orange-600", percent: 30, label: "상위 16% ~ 30%" },
  { id: "A", name: "A 티어", color: "bg-orange-400", percent: 45, label: "상위 31% ~ 45%" },
  { id: "B", name: "B 티어", color: "bg-yellow-500", percent: 65, label: "상위 46% ~ 65%" },
  { id: "C", name: "C 티어", color: "bg-green-500", percent: 85, label: "상위 66% ~ 85%" },
  { id: "D", name: "D 티어", color: "bg-blue-500", percent: 100, label: "하위 15%" },
];

// ★ WOW 고유 직업 색상 사전 정의 ★
const WOW_CLASS_COLORS = {
  "전사": "#C79C6E", "사제": "#FFFFFF", "도적": "#FFF569", "성기사": "#F58CBA",
  "사냥꾼": "#ABD473", "주술사": "#0070DE", "마법사": "#69CCF0", "흑마": "#9482C9",
  "흑마법사": "#9482C9", "드루": "#FF7D0A", "드루이드": "#FF7D0A", "죽음의기사": "#C41E3A", "수도사": "#00FF96", "악마사냥꾼": "#A330C9", "기원사": "#33937F"
};
const fallbackColors = ['#94a3b8', '#cbd5e1', '#64748b']; 

// ★ 직업 뱃지에 파스텔 톤 반투명 효과를 주는 마법의 함수 ★
const getJobBadgeStyle = (jobClass, isLightTheme = false) => {
  const hex = WOW_CLASS_COLORS[jobClass] || "#94a3b8"; 
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  if (isLightTheme) {
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const tonedColor = luminance > 0.72
      ? `rgb(${Math.max(48, Math.round(r * 0.38))}, ${Math.max(48, Math.round(g * 0.38))}, ${Math.max(48, Math.round(b * 0.38))})`
      : `rgb(${Math.max(32, Math.round(r * 0.78))}, ${Math.max(32, Math.round(g * 0.78))}, ${Math.max(32, Math.round(b * 0.78))})`;

    return {
      color: tonedColor,
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.24)`,
    };
  }

  return {
    color: hex,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`
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
  isFixedRaidMember: true,
  imageUrl: "",
  mainSpec: "",
  availableSpecs: [],
  preferredPositions: [],
};
const DEFAULT_FIXED_RAID_MEMBER_OPTION_ID = "__default_fixed_raid_member__";

const RAID_LEVEL_FILTER_OPTIONS = [
  { id: "50+", label: "50+" },
  { id: "50-59", label: "50-59" },
  { id: "60-69", label: "60-69" },
  { id: "70", label: "70" },
];

const WOW_POSITION_OPTIONS = [
  { id: "전체", label: "전체", shortLabel: "전체" },
  { id: "tank", label: "탱커", shortLabel: "탱" },
  { id: "meleeDealer", label: "근거리 딜러", shortLabel: "근딜" },
  { id: "rangedDealer", label: "원거리 딜러", shortLabel: "원딜" },
  { id: "heal", label: "힐러", shortLabel: "힐" },
];

const WOW_POSITION_STYLE_MAP = {
  전체: {
    selectedButtonClass:
      "bg-gray-100 text-gray-950 border-gray-100 shadow-[0_0_14px_rgba(255,255,255,0.14)]",
    unselectedButtonClass:
      "bg-gray-900/80 text-gray-200 border-gray-700 hover:text-white hover:border-gray-500",
    countSelectedClass: "bg-black/10 text-gray-950",
    countUnselectedClass: "bg-black/30 text-gray-300",
    tagClass: "border-gray-500/50 bg-gray-700/70 text-gray-100",
    menuActiveClass: "border-gray-300/70 bg-gray-100 text-gray-950",
    menuInactiveClass:
      "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800",
  },
  tank: {
    selectedButtonClass:
      "bg-sky-500/28 text-sky-50 border-sky-300/70 shadow-[0_0_18px_rgba(56,189,248,0.2)]",
    unselectedButtonClass:
      "bg-sky-500/12 text-sky-100 border-sky-500/30 hover:bg-sky-500/18 hover:border-sky-300/45",
    countSelectedClass: "bg-sky-950/75 text-sky-50",
    countUnselectedClass: "bg-black/20 text-sky-100",
    tagClass: "border-sky-400/40 bg-sky-500/18 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    menuActiveClass: "border-sky-300/70 bg-sky-500/28 text-sky-50",
    menuInactiveClass:
      "border-sky-500/30 bg-sky-500/12 text-sky-100 hover:border-sky-300/45 hover:bg-sky-500/18",
  },
  meleeDealer: {
    selectedButtonClass:
      "bg-rose-500/28 text-rose-50 border-rose-300/70 shadow-[0_0_18px_rgba(244,63,94,0.22)]",
    unselectedButtonClass:
      "bg-rose-500/12 text-rose-100 border-rose-500/30 hover:bg-rose-500/18 hover:border-rose-300/45",
    countSelectedClass: "bg-rose-950/75 text-rose-50",
    countUnselectedClass: "bg-black/20 text-rose-100",
    tagClass: "border-rose-400/40 bg-rose-500/18 text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    menuActiveClass: "border-rose-300/70 bg-rose-500/28 text-rose-50",
    menuInactiveClass:
      "border-rose-500/30 bg-rose-500/12 text-rose-100 hover:border-rose-300/45 hover:bg-rose-500/18",
  },
  rangedDealer: {
    selectedButtonClass:
      "bg-red-500/28 text-red-50 border-red-300/70 shadow-[0_0_18px_rgba(239,68,68,0.22)]",
    unselectedButtonClass:
      "bg-red-500/12 text-red-100 border-red-500/30 hover:bg-red-500/18 hover:border-red-300/45",
    countSelectedClass: "bg-red-950/75 text-red-50",
    countUnselectedClass: "bg-black/20 text-red-100",
    tagClass: "border-red-400/40 bg-red-500/18 text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    menuActiveClass: "border-red-300/70 bg-red-500/28 text-red-50",
    menuInactiveClass:
      "border-red-500/30 bg-red-500/12 text-red-100 hover:border-red-300/45 hover:bg-red-500/18",
  },
  heal: {
    selectedButtonClass:
      "bg-emerald-500/28 text-emerald-50 border-emerald-300/70 shadow-[0_0_18px_rgba(16,185,129,0.22)]",
    unselectedButtonClass:
      "bg-emerald-500/12 text-emerald-100 border-emerald-500/30 hover:bg-emerald-500/18 hover:border-emerald-300/45",
    countSelectedClass: "bg-emerald-950/75 text-emerald-50",
    countUnselectedClass: "bg-black/20 text-emerald-100",
    tagClass: "border-emerald-400/40 bg-emerald-500/18 text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    menuActiveClass: "border-emerald-300/70 bg-emerald-500/28 text-emerald-50",
    menuInactiveClass:
      "border-emerald-500/30 bg-emerald-500/12 text-emerald-100 hover:border-emerald-300/45 hover:bg-emerald-500/18",
  },
};

const LIGHT_WOW_POSITION_STYLE_MAP = {
  전체: {
    selectedButtonClass:
      "bg-slate-900 text-white border-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.16)]",
    unselectedButtonClass:
      "bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50",
    countSelectedClass: "bg-white/20 text-white",
    countUnselectedClass: "bg-slate-100 text-slate-600",
    tagClass: "border-slate-200 bg-slate-50 text-slate-700",
    menuActiveClass: "border-slate-900 bg-slate-900 text-white",
    menuInactiveClass:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  },
  tank: {
    selectedButtonClass:
      "bg-sky-600 text-white border-sky-500 shadow-[0_14px_28px_rgba(2,132,199,0.16)]",
    unselectedButtonClass:
      "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 hover:border-sky-300",
    countSelectedClass: "bg-white/20 text-white",
    countUnselectedClass: "bg-sky-100 text-sky-700",
    tagClass: "border-sky-200 bg-sky-50 text-sky-700",
    menuActiveClass: "border-sky-500 bg-sky-600 text-white",
    menuInactiveClass:
      "border-sky-200 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-50",
  },
  meleeDealer: {
    selectedButtonClass:
      "bg-rose-600 text-white border-rose-500 shadow-[0_14px_28px_rgba(225,29,72,0.16)]",
    unselectedButtonClass:
      "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300",
    countSelectedClass: "bg-white/20 text-white",
    countUnselectedClass: "bg-rose-100 text-rose-700",
    tagClass: "border-rose-200 bg-rose-50 text-rose-700",
    menuActiveClass: "border-rose-500 bg-rose-600 text-white",
    menuInactiveClass:
      "border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50",
  },
  rangedDealer: {
    selectedButtonClass:
      "bg-red-600 text-white border-red-500 shadow-[0_14px_28px_rgba(220,38,38,0.16)]",
    unselectedButtonClass:
      "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300",
    countSelectedClass: "bg-white/20 text-white",
    countUnselectedClass: "bg-red-100 text-red-700",
    tagClass: "border-red-200 bg-red-50 text-red-700",
    menuActiveClass: "border-red-500 bg-red-600 text-white",
    menuInactiveClass:
      "border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50",
  },
  heal: {
    selectedButtonClass:
      "bg-emerald-600 text-white border-emerald-500 shadow-[0_14px_28px_rgba(5,150,105,0.16)]",
    unselectedButtonClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    countSelectedClass: "bg-white/20 text-white",
    countUnselectedClass: "bg-emerald-100 text-emerald-700",
    tagClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    menuActiveClass: "border-emerald-500 bg-emerald-600 text-white",
    menuInactiveClass:
      "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
  },
};

const WOW_POSITION_IDS = WOW_POSITION_OPTIONS.filter((option) => option.id !== "전체").map((option) => option.id);

const normalizePreferredPositions = (value) => {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string" && value
    ? [value]
    : [];

  const expanded = raw.flatMap((positionId) => {
    if (["dealer", "딜", "딜러"].includes(positionId)) {
      return ["meleeDealer", "rangedDealer"];
    }
    if (["meleeDealer", "melee", "근거리 딜러", "근딜"].includes(positionId)) {
      return ["meleeDealer"];
    }
    if (["rangedDealer", "ranged", "원거리 딜러", "원딜"].includes(positionId)) {
      return ["rangedDealer"];
    }
    if (["tank", "탱", "탱커"].includes(positionId)) {
      return ["tank"];
    }
    if (["heal", "힐", "힐러"].includes(positionId)) {
      return ["heal"];
    }
    return [positionId];
  });

  return expanded.filter(
    (positionId, index) =>
      WOW_POSITION_IDS.includes(positionId) && expanded.indexOf(positionId) === index
  );
};

const WOW_JOB_OPTIONS = [
  "전사",
  "도적",
  "마법사",
  "사냥꾼",
  "흑마법사",
  "사제",
  "드루이드",
  "성기사",
  "주술사",
];

const WOW_SPEC_OPTIONS_BY_JOB = {
  전사: ["무기", "분노", "방어"],
  도적: ["암살", "전투", "잠행"],
  마법사: ["냉기", "화염", "비전"],
  사냥꾼: ["야수", "사격", "생존"],
  흑마법사: ["파괴", "악마", "고통"],
  사제: ["신성", "수양", "암흑"],
  드루이드: ["야성", "회복", "조화", "수호"],
  성기사: ["징벌", "보호", "신성"],
  주술사: ["고양", "정기", "복원"],
};

const normalizeWowJobClassKey = (jobClass = "") => {
  const trimmed = `${jobClass || ""}`.trim();
  if (["흑마", "흑마법사"].includes(trimmed)) return "흑마법사";
  if (["드루", "드루이드"].includes(trimmed)) return "드루이드";
  return trimmed;
};

const getWowSpecOptions = (jobClass = "") => (
  WOW_SPEC_OPTIONS_BY_JOB[normalizeWowJobClassKey(jobClass)] || []
);

const normalizeAvailableSpecs = (jobClass = "", value = []) => {
  const validSpecs = getWowSpecOptions(jobClass);
  const raw = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  return raw.filter((spec, index) => validSpecs.includes(spec) && raw.indexOf(spec) === index);
};

const normalizeWowSpecState = (jobClass = "", mainSpec = "", availableSpecs = []) => {
  const validSpecs = getWowSpecOptions(jobClass);
  let normalizedAvailableSpecs = normalizeAvailableSpecs(jobClass, availableSpecs);
  const normalizedMainSpec = validSpecs.includes(mainSpec) ? mainSpec : (normalizedAvailableSpecs[0] || "");
  if (normalizedMainSpec && !normalizedAvailableSpecs.includes(normalizedMainSpec)) {
    normalizedAvailableSpecs = [normalizedMainSpec, ...normalizedAvailableSpecs];
  }
  return { mainSpec: normalizedMainSpec, availableSpecs: normalizedAvailableSpecs };
};

const matchesWowSpecFilters = (jobClass = "", availableSpecs = [], selectedFilters = ["전체"]) => {
  if (!Array.isArray(selectedFilters) || selectedFilters.length === 0 || selectedFilters.includes("전체")) {
    return true;
  }
  const normalizedAvailableSpecs = normalizeAvailableSpecs(jobClass, availableSpecs);
  if (normalizedAvailableSpecs.length === 0) return false;
  return selectedFilters.some((filterId) => normalizedAvailableSpecs.includes(filterId));
};

const getWowSpecTagTitle = (jobClass = "", mainSpec = "", availableSpecs = []) => {
  const normalized = normalizeWowSpecState(jobClass, mainSpec, availableSpecs);
  return normalized.availableSpecs.join(", ");
};

const normalizeFixedRaidMember = (member = {}) => {
  const specState = normalizeWowSpecState(member?.jobClass, member?.mainSpec, member?.availableSpecs);
  return {
    imageUrl: "",
    streamerName: "",
    wowNickname: "",
    jobClass: "",
    ...member,
    level: Number(member?.level) || 60,
    preferredPositions: normalizePreferredPositions(member?.preferredPositions),
    mainSpec: specState.mainSpec,
    availableSpecs: specState.availableSpecs,
  };
};

const getWowPositionMeta = (positionId) =>
  WOW_POSITION_OPTIONS.find((option) => option.id === positionId) || null;
const getWowPositionLabel = (positionId) =>
  getWowPositionMeta(positionId)?.label || "";
const getWowPositionShortLabel = (positionId) =>
  getWowPositionMeta(positionId)?.shortLabel || "";
const getWowPositionStyleMeta = (positionId, isLightTheme = false) => {
  const styleMap = isLightTheme ? LIGHT_WOW_POSITION_STYLE_MAP : WOW_POSITION_STYLE_MAP;
  return styleMap[positionId] || styleMap["전체"];
};
const getWowPositionFilterButtonClasses = (positionId, isSelected, isLightTheme = false) => {
  const styleMeta = getWowPositionStyleMeta(positionId, isLightTheme);
  return isSelected
    ? styleMeta.selectedButtonClass
    : styleMeta.unselectedButtonClass;
};
const getWowPositionCountClasses = (positionId, isSelected, isLightTheme = false) => {
  const styleMeta = getWowPositionStyleMeta(positionId, isLightTheme);
  return isSelected
    ? styleMeta.countSelectedClass
    : styleMeta.countUnselectedClass;
};
const getWowPositionTagClasses = (positionId, isLightTheme = false) =>
  getWowPositionStyleMeta(positionId, isLightTheme).tagClass;
const getWowPositionMenuOptionClasses = (positionId, isActive, isLightTheme = false) => {
  const styleMeta = getWowPositionStyleMeta(positionId, isLightTheme);
  return isActive
    ? styleMeta.menuActiveClass
    : styleMeta.menuInactiveClass;
};

const WOW_SPEC_TAG_CLASS = "border-slate-400/35 bg-slate-500/18 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
const WOW_SPEC_EXTRA_TAG_CLASS = "border-slate-500/28 bg-slate-500/10 text-slate-300";
const LIGHT_WOW_SPEC_TAG_CLASS = "border-slate-200 bg-slate-100 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]";
const LIGHT_WOW_SPEC_EXTRA_TAG_CLASS = "border-slate-200 bg-white text-slate-500";

const matchesPreferredPositionFilters = (preferredPositions = [], selectedFilters = ["전체"]) => {
  if (!Array.isArray(selectedFilters) || selectedFilters.length === 0 || selectedFilters.includes("전체")) {
    return true;
  }

  const normalizedPositions = normalizePreferredPositions(preferredPositions);
  if (normalizedPositions.length === 0) return false;
  return selectedFilters.some((filterId) => normalizedPositions.includes(filterId));
};

const normalizeWowPartnerGeneration = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const isWowPartnerMember = (member = {}) => (
  !!normalizeWowPartnerGeneration(member?.wowPartnerGeneration) || !!member?.isWowPartner
);

const getWowPartnerDisplayLabel = (member = {}) => {
  const generation = normalizeWowPartnerGeneration(member?.wowPartnerGeneration);
  return generation ? `${generation}대 와트너` : "와트너";
};

const normalizeWowMember = (member = {}) => {
  const specState = normalizeWowSpecState(member?.jobClass, member?.mainSpec, member?.availableSpecs);
  const normalizedWowPartner = normalizeWowPartnerGeneration(member?.wowPartnerGeneration);
  return ({
    isApplied: false,
    isWowPartner: false,
    wowPartnerGeneration: null,
    isBuskingParticipant: false,
    isRaidApplied: false,
    ...member,
    isWowPartner: !!normalizedWowPartner || !!member?.isWowPartner,
    wowPartnerGeneration: normalizedWowPartner,
    preferredPositions: normalizePreferredPositions(member?.preferredPositions),
    mainSpec: specState.mainSpec,
    availableSpecs: specState.availableSpecs,
  });
};

const RAID_ROLE_OPTIONS = [
  { id: "raidLeader", label: "공대장", iconKey: "crown", toneClass: "text-amber-300", chipClass: "border-amber-400/30 bg-amber-500/10 text-amber-200" },
  { id: "mainTank", label: "메인탱커", iconKey: "shield", toneClass: "text-sky-300", chipClass: "border-sky-400/30 bg-sky-500/10 text-sky-200" },
  { id: "subTank", label: "서브탱커", iconKey: "swords", toneClass: "text-orange-300", chipClass: "border-orange-400/30 bg-orange-500/10 text-orange-200" },
  { id: "mainHealer", label: "메인힐러", iconKey: "sparkles", toneClass: "text-violet-300", chipClass: "border-violet-400/30 bg-violet-500/10 text-violet-200" },
  { id: "subHealer", label: "서브힐러", iconKey: "heart", toneClass: "text-rose-300", chipClass: "border-rose-400/30 bg-rose-500/10 text-rose-200" },
];

const getRaidRoleMeta = (roleId) => RAID_ROLE_OPTIONS.find((role) => role.id === roleId) || null;

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
  if (!Array.isArray(selectedFilters) || selectedFilters.length === 0 || selectedFilters.includes("50+")) {
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
const APP_THEME_STORAGE_KEY = "wak_vleague_theme_v1";
const DEFAULT_APP_THEME = "dark";

const normalizeAppTheme = (value) => (
  value === "light" ? "light" : DEFAULT_APP_THEME
);


const WOW_RAID_STAT_FIELDS = [
  { id: 'damage', label: '피해량', shortLabel: '피해량' },
  { id: 'damageTaken', label: '받은 피해', shortLabel: '받은 피해' },
  { id: 'healing', label: '치유량', shortLabel: '치유량' },
  { id: 'mitigated', label: '막은 피해', shortLabel: '막은 피해' },
];

const WOW_RAID_DETAIL_TABS = [
  { id: 'participants', label: '참가 인원' },
  ...WOW_RAID_STAT_FIELDS,
];

const getDefaultWowRaidGuestAvatar = (participant) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent((participant?.displayName || participant?.wowNickname || 'guest').trim() || 'guest')}`;
const createWowRaidGuestId = () => `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const createEmptyWowRaidGuestForm = () => ({
  id: createWowRaidGuestId(),
  displayName: '',
  wowNickname: '',
  imageMode: 'default',
  imageUrl: '',
  jobClass: '',
  mainSpec: '',
  availableSpecs: [],
  preferredPositions: [],
});

const getRecommendedPreferredPositionsBySpec = (jobClass = '', mainSpec = '') => {
  const normalizedJob = normalizeWowJobClassKey(jobClass);
  if (!mainSpec) return [];
  if (['방어', '수호', '보호'].includes(mainSpec)) return ['tank'];
  if (['신성', '회복', '복원', '수양'].includes(mainSpec)) return ['heal'];
  if (['마법사', '사냥꾼', '흑마법사'].includes(normalizedJob)) return ['rangedDealer'];
  if (normalizedJob === '사제') return mainSpec === '암흑' ? ['rangedDealer'] : ['heal'];
  if (normalizedJob === '드루이드') {
    if (mainSpec === '조화') return ['rangedDealer'];
    if (mainSpec === '야성') return ['meleeDealer'];
  }
  if (normalizedJob === '주술사') {
    if (mainSpec === '정기') return ['rangedDealer'];
    if (mainSpec === '고양') return ['meleeDealer'];
  }
  if (normalizedJob === '성기사') {
    if (mainSpec === '징벌') return ['meleeDealer'];
  }
  if (normalizedJob === '전사') {
    if (['무기', '분노'].includes(mainSpec)) return ['meleeDealer'];
  }
  if (normalizedJob === '도적') return ['meleeDealer'];
  return [];
};

const createEmptyWowRaidForm = () => ({
  id: null,
  raidName: '',
  imageUrl: '',
  raidDate: '',
  clearTime: '',
  isCleared: true,
  isPublished: false,
  note: '',
  raidGroupNumber: '',
  rosterParticipantIds: [],
  fixedParticipantIds: [],
  guestParticipants: [],
  stats: {
    damage: {},
    damageTaken: {},
    healing: {},
    mitigated: {},
  },
});

const buildWowRaidParticipantKey = (sourceType = 'wow_roster', sourceId = '') => `${sourceType}:${sourceId || ''}`;

const createWowRaidParticipantSnapshot = (member = {}, sourceType = 'wow_roster') => {
  const normalizedMember = sourceType === 'fixed_member' ? normalizeFixedRaidMember(member) : normalizeWowMember(member);
  const snapshotId = buildWowRaidParticipantKey(sourceType, normalizedMember.id);
  return {
    id: snapshotId,
    sourceType,
    sourceId: normalizedMember.id || '',
    streamerName: normalizedMember.streamerName || '',
    wowNickname: normalizedMember.wowNickname || normalizedMember.streamerName || '',
    jobClass: normalizedMember.jobClass || '',
    level: Number(normalizedMember.level) || 0,
    imageUrl: normalizedMember.imageUrl || '',
    preferredPositions: normalizePreferredPositions(normalizedMember.preferredPositions),
    mainSpec: normalizeWowSpecState(normalizedMember.jobClass, normalizedMember.mainSpec, normalizedMember.availableSpecs).mainSpec,
    availableSpecs: normalizeWowSpecState(normalizedMember.jobClass, normalizedMember.mainSpec, normalizedMember.availableSpecs).availableSpecs,
    displayName: '',
  };
};

const normalizeWowRaidGuestParticipant = (participant = {}) => {
  const jobClass = normalizeWowJobClassKey(participant?.jobClass || '');
  const specState = normalizeWowSpecState(jobClass, participant?.mainSpec, participant?.availableSpecs);
  const recommendedPositions = getRecommendedPreferredPositionsBySpec(jobClass, specState.mainSpec);
  return {
    id: participant?.id || createWowRaidGuestId(),
    displayName: participant?.displayName || '',
    wowNickname: participant?.wowNickname || '',
    imageMode: participant?.imageMode === 'custom' ? 'custom' : 'default',
    imageUrl: participant?.imageUrl || '',
    jobClass,
    mainSpec: specState.mainSpec,
    availableSpecs: specState.availableSpecs,
    preferredPositions: normalizePreferredPositions(participant?.preferredPositions).length
      ? normalizePreferredPositions(participant?.preferredPositions)
      : recommendedPositions,
  };
};

const createWowRaidGuestParticipantSnapshot = (participant = {}) => {
  const normalizedGuest = normalizeWowRaidGuestParticipant(participant);
  const snapshotId = buildWowRaidParticipantKey('guest', normalizedGuest.id);
  return {
    id: snapshotId,
    sourceType: 'guest',
    sourceId: normalizedGuest.id,
    streamerName: normalizedGuest.displayName || normalizedGuest.wowNickname || '일반인',
    wowNickname: normalizedGuest.wowNickname || normalizedGuest.displayName || '일반인',
    jobClass: normalizedGuest.jobClass || '',
    level: 60,
    imageUrl: normalizedGuest.imageMode === 'custom' && normalizedGuest.imageUrl ? normalizedGuest.imageUrl : getDefaultWowRaidGuestAvatar(normalizedGuest),
    preferredPositions: normalizePreferredPositions(normalizedGuest.preferredPositions),
    mainSpec: normalizedGuest.mainSpec,
    availableSpecs: normalizedGuest.availableSpecs,
    displayName: normalizedGuest.displayName || '',
    imageMode: normalizedGuest.imageMode,
    isGuestParticipant: true,
  };
};

const normalizeWowRaidStatsMap = (value = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value).reduce((acc, [participantId, statValue]) => {
    const safeValue = Number(statValue) || 0;
    if (participantId) acc[participantId] = safeValue;
    return acc;
  }, {});
};

const normalizeWowRaidDocument = (raid = {}) => ({
  id: raid.id,
  raidName: raid.raidName || '',
  imageUrl: raid.imageUrl || '',
  raidDate: raid.raidDate || '',
  clearTime: raid.clearTime || '',
  isCleared: raid.isCleared !== false,
  isPublished: !!raid.isPublished,
  note: raid.note || '',
  raidGroupNumber: `${raid.raidGroupNumber ?? ''}`.replace(/[^0-9]/g, ''),
  rosterParticipantIds: Array.isArray(raid.rosterParticipantIds) ? raid.rosterParticipantIds : [],
  fixedParticipantIds: Array.isArray(raid.fixedParticipantIds) ? raid.fixedParticipantIds : [],
  guestParticipants: Array.isArray(raid.guestParticipants) ? raid.guestParticipants.map(normalizeWowRaidGuestParticipant) : [],
  participants: Array.isArray(raid.participants) ? raid.participants.map((participant) => ({
    ...participant,
    displayName: participant?.displayName || '',
    preferredPositions: normalizePreferredPositions(participant?.preferredPositions),
    ...normalizeWowSpecState(participant?.jobClass, participant?.mainSpec, participant?.availableSpecs),
  })) : [],
  stats: {
    damage: normalizeWowRaidStatsMap(raid?.stats?.damage),
    damageTaken: normalizeWowRaidStatsMap(raid?.stats?.damageTaken),
    healing: normalizeWowRaidStatsMap(raid?.stats?.healing),
    mitigated: normalizeWowRaidStatsMap(raid?.stats?.mitigated),
  },
  createdAt: raid.createdAt || null,
  updatedAt: raid.updatedAt || null,
});

const getRaidConfig = (raidType = DEFAULT_RAID_TYPE) => (
  RAID_TYPE_OPTIONS.find((option) => option.id === raidType) || RAID_TYPE_OPTIONS[RAID_TYPE_OPTIONS.length - 1]
);

const createEmptyRaidLayout = (groupCount, leaderId = GUILD_MASTER_ID) => {
  const layout = Array.from({ length: groupCount }, () => Array(RAID_SLOT_SIZE).fill(null));
  if (leaderId && layout[0]?.[0] !== undefined) layout[0][0] = leaderId;
  return layout;
};

const resizeRaidLayout = (layout, groupCount, leaderId = GUILD_MASTER_ID) => {
  const next = createEmptyRaidLayout(groupCount, leaderId);
  const memberIds = (layout || []).flat().filter((memberId) => memberId && memberId !== leaderId);

  let cursor = 0;
  for (let groupIndex = 0; groupIndex < next.length; groupIndex += 1) {
    for (let slotIndex = 0; slotIndex < next[groupIndex].length; slotIndex += 1) {
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
    for (let slotIndex = 0; slotIndex < layout[groupIndex].length; slotIndex += 1) {
      if (layout[groupIndex][slotIndex] === memberId) {
        return { groupIndex, slotIndex };
      }
    }
  }
  return null;
};

const findNextEmptyRaidSlot = (layout, { skipLockedSlot = false } = {}) => {
  for (let groupIndex = 0; groupIndex < layout.length; groupIndex += 1) {
    for (let slotIndex = 0; slotIndex < layout[groupIndex].length; slotIndex += 1) {
      if (skipLockedSlot && groupIndex === 0 && slotIndex === 0) continue;
      if (!layout[groupIndex][slotIndex]) return { groupIndex, slotIndex };
    }
  }
  return null;
};

const sortBuskingParticipants = (participants) => (
  [...participants].sort((a, b) => {
    const voteGap = (b.buskingVoteCount || 0) - (a.buskingVoteCount || 0);
    if (voteGap !== 0) return voteGap;
    const levelGap = (Number(b.level) || 0) - (Number(a.level) || 0);
    if (levelGap !== 0) return levelGap;
    return (a.streamerName || "").localeCompare(b.streamerName || "", "ko");
  })
);

const computeBuskingVoteSnapshot = (voteCounts = {}) => {
  const normalized = Object.entries(voteCounts || {}).reduce((acc, [memberId, count]) => {
    const safeCount = Number(count) || 0;
    if (safeCount > 0) acc[memberId] = safeCount;
    return acc;
  }, {});

  return {
    voteCounts: normalized,
    totalVotes: Object.values(normalized).reduce((sum, count) => sum + (Number(count) || 0), 0),
  };
};

const applyBuskingVoteCounts = (roster = [], voteCounts = {}) => (
  roster.map((member) => ({
    ...member,
    buskingVoteCount: Number(voteCounts?.[member.id]) || 0,
  }))
);

const getBuskingVoteShardIndex = (seed, shardCount = BUSKING_PUBLIC_SHARD_COUNT) => {
  const normalizedSeed = `${seed || "busking"}`;
  let hash = 0;
  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = ((hash << 5) - hash) + normalizedSeed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % shardCount;
};

const buildBuskingPublicSummary = (roster = [], settings = {}, voteCounts = {}) => {
  const normalizedSettings = {
    isVotingOpen: false,
    roundId: "wow-busking-default",
    startedAt: null,
    endedAt: null,
    noticeUrl: "",
    ...settings,
  };

  const participants = sortBuskingParticipants(
    roster
      .filter((member) => member?.isBuskingParticipant && Number(member?.level) >= 40)
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
    noticeUrl: normalizedSettings.noticeUrl || "",
    participants,
    participantCount: participants.length,
    totalVotes: participants.reduce((sum, member) => sum + (member.buskingVoteCount || 0), 0),
    leaderId: participants[0]?.id || null,
    updatedAt: new Date().toISOString(),
  };
};

const createEmptyTeamMatchResult = (id, rank, scoreChange = 0) => ({
  id,
  rank,
  scoreChange,
  setWins: "",
  players: ["", ""],
  fundingRatio: "",
  fundingAmount: "",
});

const createDefaultTeamMatchResults = () => ([
  createEmptyTeamMatchResult(1, 1, 100),
  createEmptyTeamMatchResult(2, 2, -50),
]);

const normalizeTeamSetWins = (value) => (
  value === "" || value === null || value === undefined
    ? ""
    : Math.max(0, Number(value) || 0)
);

const getNormalizedTeamMatchResults = (match = {}) => {
  if (Array.isArray(match.teamResults) && match.teamResults.length > 0) {
    return [...match.teamResults]
      .map((team, index) => ({
        id: team.id || `team_${index + 1}`,
        rank: Number(team.rank) || index + 1,
        scoreChange: Number(team.scoreChange) || 0,
        setWins: normalizeTeamSetWins(team.setWins),
        players: Array.isArray(team.players) ? team.players.map((playerName) => `${playerName || ""}`.trim()).filter(Boolean) : [],
        fundingRatio: team.fundingRatio ?? "",
        fundingAmount: team.fundingAmount ?? "",
      }))
      .sort((a, b) => a.rank - b.rank);
  }

  const teamsByRank = {};
  (match.results || []).forEach((result, index) => {
    if (!teamsByRank[result.rank]) {
      teamsByRank[result.rank] = {
        id: `fallback_team_${result.rank}_${index}`,
        rank: result.rank,
        scoreChange: Number(result.scoreChange) || 0,
        setWins: "",
        players: [],
        fundingRatio: result.fundingRatio || "",
        fundingAmount: result.fundingAmount || "",
      };
    }
    teamsByRank[result.rank].players.push(`${result.playerName || ""}`.trim());
  });

  return Object.values(teamsByRank).sort((a, b) => a.rank - b.rank);
};

const buildTeamMatchPayload = (teams = [], hasFunding = false) => {
  const normalizedTeams = (teams || [])
    .map((team, index) => {
      const players = Array.isArray(team.players)
        ? team.players.map((playerName) => `${playerName || ""}`.trim()).filter(Boolean)
        : [];

      return {
        id: team.id || `team_${index + 1}`,
        rank: Number(team.rank) || index + 1,
        scoreChange: Number(team.scoreChange) || 0,
        setWins: normalizeTeamSetWins(team.setWins),
        players,
        fundingRatio: hasFunding ? (Number(team.fundingRatio) || 0) : 0,
        fundingAmount: hasFunding ? (Number(team.fundingAmount) || 0) : 0,
      };
    })
    .filter((team) => team.players.length > 0)
    .sort((a, b) => a.rank - b.rank);

  const results = [];
  normalizedTeams.forEach((team) => {
    team.players.forEach((playerName) => {
      results.push({
        playerName,
        rank: team.rank,
        scoreChange: team.scoreChange,
        ...(hasFunding ? { fundingRatio: team.fundingRatio, fundingAmount: team.fundingAmount } : {}),
      });
    });
  });

  return { teamResults: normalizedTeams, results };
};

const getTeamMatchSetScoreLabel = (teams = []) => {
  if (!Array.isArray(teams) || teams.length !== 2) return "";

  const [firstTeam, secondTeam] = [...teams].sort((a, b) => a.rank - b.rank);
  if (
    firstTeam?.setWins === "" || firstTeam?.setWins === null || firstTeam?.setWins === undefined ||
    secondTeam?.setWins === "" || secondTeam?.setWins === null || secondTeam?.setWins === undefined
  ) {
    return "";
  }

  const firstScore = Number(firstTeam.setWins);
  const secondScore = Number(secondTeam.setWins);
  if (!Number.isFinite(firstScore) || !Number.isFinite(secondScore)) return "";

  return `${firstScore}:${secondScore}`;
};

const APP_TAB_IDS = ["home", "players", "matches", "stats", "tier", "wow", "wowraid", "dungeontier", "raid", "admin"];
const WOW_SECTION_TAB_IDS = ["wow", "wowraid", "dungeontier"];
const WOW_NAV_ITEMS = [
  {
    id: "wow",
    label: "WOW 메인",
    description: "길드 명단과 안내",
    icon: Shield,
  },
  {
    id: "wowraid",
    label: "WOW 레이드",
    description: "레이드 기록과 상세 보기",
    icon: Layers,
  },
  {
    id: "dungeontier",
    label: "던전 티어게임",
    description: "플레이한 인던 티어 게임",
    icon: Trophy,
  },
];

const WOW_DUNGEON_TIER_COLLECTION = "wow_dungeon_tier_items";
const WOW_DUNGEON_TIER_LAYOUT_STORAGE_KEY = "wak_wow_dungeon_tier_layout_v1";
const WOW_DUNGEON_TIER_LEVELS = [
  { id: "S", label: "S 티어" },
  { id: "A", label: "A 티어" },
  { id: "B", label: "B 티어" },
  { id: "C", label: "C 티어" },
  { id: "D", label: "D 티어" },
  { id: "F", label: "F 티어" },
];
const WOW_DUNGEON_EXPANSION_OPTIONS = [
  { id: "original", label: "오리지널", shortLabel: "오리" },
  { id: "tbc", label: "불타는 성전", shortLabel: "불성" },
];

const normalizeWowDungeonExpansionType = (value = "") => (
  value === "tbc" ? "tbc" : "original"
);

const getWowDungeonExpansionMeta = (expansionType = "original") => (
  WOW_DUNGEON_EXPANSION_OPTIONS.find((option) => option.id === normalizeWowDungeonExpansionType(expansionType))
  || WOW_DUNGEON_EXPANSION_OPTIONS[0]
);

const getWowDungeonExpansionSortOrder = (expansionType = "original") => (
  normalizeWowDungeonExpansionType(expansionType) === "original" ? 0 : 1
);

const getWowDungeonExpansionTheme = (expansionType = "original", isLightTheme = false) => {
  const normalizedType = normalizeWowDungeonExpansionType(expansionType);

  if (normalizedType === "tbc") {
    return isLightTheme
      ? {
          cardClass: "border-rose-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(255,241,242,0.98)_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
          badgeClass: "border-rose-200 bg-rose-600 text-white",
          frameClass: "border-rose-200 bg-rose-50",
          titleClass: "text-slate-900",
          metaClass: "text-rose-700",
          subtleClass: "text-slate-500",
          buttonClass: "border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
        }
      : {
          cardClass: "border-red-500/25 bg-gradient-to-br from-red-950/40 via-gray-900 to-gray-950 shadow-[0_0_24px_rgba(239,68,68,0.12)]",
          badgeClass: "border-red-400/35 bg-red-500/15 text-red-200",
          frameClass: "border-red-500/25 bg-red-950/30",
          titleClass: "text-white",
          metaClass: "text-red-200",
          subtleClass: "text-gray-400",
          buttonClass: "border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/18",
        };
  }

  return isLightTheme
    ? {
        cardClass: "border-emerald-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(236,253,245,0.98)_100%)] shadow-[0_18px_40px_rgba(15,23,42,0.08)]",
        badgeClass: "border-emerald-200 bg-emerald-600 text-white",
        frameClass: "border-emerald-200 bg-emerald-50",
        titleClass: "text-slate-900",
        metaClass: "text-emerald-700",
        subtleClass: "text-slate-500",
        buttonClass: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
      }
    : {
        cardClass: "border-emerald-500/25 bg-gradient-to-br from-emerald-950/35 via-gray-900 to-gray-950 shadow-[0_0_24px_rgba(16,185,129,0.12)]",
        badgeClass: "border-emerald-400/35 bg-emerald-500/15 text-emerald-200",
        frameClass: "border-emerald-500/25 bg-emerald-950/25",
        titleClass: "text-white",
        metaClass: "text-emerald-200",
        subtleClass: "text-gray-400",
        buttonClass: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/18",
      };
};

const normalizeWowDungeonVideoUrls = (value = [], legacyValue = "") => {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string" && value
    ? [value]
    : [];

  const normalized = raw
    .map((url) => `${url || ""}`.trim())
    .filter((url, index, list) => url && list.indexOf(url) === index);

  if (normalized.length > 0) return normalized;

  const fallbackUrl = `${legacyValue || ""}`.trim();
  return fallbackUrl ? [fallbackUrl] : [];
};

const createWowDungeonTierFormVideoUrls = (value = [], legacyValue = "") => {
  const normalized = normalizeWowDungeonVideoUrls(value, legacyValue);
  return normalized.length > 0 ? normalized : [""];
};

const getWowDungeonTierPrimaryVideoUrl = (item = {}) => (
  normalizeWowDungeonVideoUrls(item?.videoUrls, item?.videoUrl)[0] || ""
);

const getWowDungeonTierVideoEmbedConfig = (videoUrl = "") => {
  const normalizedUrl = `${videoUrl || ""}`.trim();
  const baseConfig = {
    originalUrl: normalizedUrl,
    embedUrl: "",
    sourceLabel: "외부 링크",
    kind: "link",
    canEmbed: false,
    openInNewTabRecommended: false,
    fallbackMessage: "",
  };

  if (!normalizedUrl) {
    return {
      ...baseConfig,
      sourceLabel: "링크 없음",
      fallbackMessage: "재생할 영상 링크가 없습니다.",
    };
  }

  if (/\.(mp4|webm|ogg)(?:$|[?#])/i.test(normalizedUrl)) {
    return {
      ...baseConfig,
      canEmbed: true,
      kind: "native",
      sourceLabel: "DIRECT VIDEO",
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch (error) {
    return {
      ...baseConfig,
      fallbackMessage: "링크 형식이 올바르지 않아 앱 안에서 재생할 수 없습니다.",
    };
  }

  const hostname = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();
  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
  const parentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const createIframeConfig = (overrides = {}) => ({
    ...baseConfig,
    canEmbed: true,
    kind: "iframe",
    sourceLabel: hostname,
    embedUrl: normalizedUrl,
    ...overrides,
  });
  const createExternalOnlyConfig = (overrides = {}) => ({
    ...baseConfig,
    sourceLabel: hostname || "외부 링크",
    openInNewTabRecommended: true,
    fallbackMessage: "앱 안 재생이 제한될 수 있어 새 창에서 여는 방식을 권장합니다.",
    ...overrides,
  });

  if (hostname === "youtu.be" || hostname.endsWith("youtube.com")) {
    let videoId = "";

    if (hostname === "youtu.be") {
      videoId = pathSegments[0] || "";
    } else if (["embed", "shorts", "live"].includes(pathSegments[0])) {
      videoId = pathSegments[1] || "";
    } else {
      videoId = parsedUrl.searchParams.get("v") || "";
    }

    if (videoId) {
      return createIframeConfig({
        sourceLabel: "YouTube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      });
    }
  }

  if (hostname === "clips.twitch.tv") {
    const clipId = pathSegments[0] || "";
    if (clipId) {
      return createIframeConfig({
        sourceLabel: "Twitch Clip",
        embedUrl: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parentHost}&autoplay=true`,
      });
    }
  }

  if (hostname.endsWith("twitch.tv")) {
    if (pathSegments[0] === "videos" && pathSegments[1]) {
      return createIframeConfig({
        sourceLabel: "Twitch",
        embedUrl: `https://player.twitch.tv/?video=v${pathSegments[1]}&parent=${parentHost}&autoplay=true`,
      });
    }

    if (pathSegments[0] === "clip" && pathSegments[1]) {
      return createIframeConfig({
        sourceLabel: "Twitch Clip",
        embedUrl: `https://clips.twitch.tv/embed?clip=${pathSegments[1]}&parent=${parentHost}&autoplay=true`,
      });
    }

    const channelName = pathSegments[0] || "";
    if (channelName && !["directory", "downloads", "search", "settings", "p"].includes(channelName)) {
      return createIframeConfig({
        sourceLabel: "Twitch",
        embedUrl: `https://player.twitch.tv/?channel=${channelName}&parent=${parentHost}&autoplay=true`,
      });
    }
  }

  if (hostname.endsWith("sooplive.co.kr")) {
    return createExternalOnlyConfig({
      sourceLabel: "SOOP",
      fallbackMessage: "SOOP 링크는 보안 정책 때문에 앱 안 재생이 막힐 수 있어 새 창 열기를 권장합니다.",
    });
  }

  if (hostname.endsWith("afreecatv.com")) {
    return createExternalOnlyConfig({
      sourceLabel: "AfreecaTV",
      fallbackMessage: "AfreecaTV 링크는 앱 안 재생이 제한될 수 있어 새 창 열기를 권장합니다.",
    });
  }

  return createIframeConfig({ sourceLabel: hostname || "외부 링크" });
};

const createEmptyWowDungeonTierForm = () => ({
  id: null,
  name: "",
  imageUrl: "",
  expansionType: "original",
  videoUrls: [""],
});

const createEmptyWowDungeonTierPlacements = () => (
  WOW_DUNGEON_TIER_LEVELS.reduce((acc, tier) => {
    acc[tier.id] = [];
    return acc;
  }, {})
);

const normalizeWowDungeonTierItem = (item = {}) => {
  const normalizedVideoUrls = normalizeWowDungeonVideoUrls(item.videoUrls, item.videoUrl);

  return {
    id: item.id || null,
    name: `${item.name || ""}`.trim(),
    imageUrl: `${item.imageUrl || ""}`.trim(),
    expansionType: normalizeWowDungeonExpansionType(item.expansionType),
    videoUrls: normalizedVideoUrls,
    videoUrl: normalizedVideoUrls[0] || "",
    displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : null,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
};

const normalizeWowDungeonTierPlacements = (value = {}, validItemIds = []) => {
  const validIdSet = Array.isArray(validItemIds) && validItemIds.length > 0
    ? new Set(validItemIds)
    : null;
  const seenIds = new Set();

  return WOW_DUNGEON_TIER_LEVELS.reduce((acc, tier) => {
    const rawIds = Array.isArray(value?.[tier.id]) ? value[tier.id] : [];
    acc[tier.id] = rawIds.filter((itemId) => {
      if (typeof itemId !== "string" || !itemId) return false;
      if (seenIds.has(itemId)) return false;
      if (validIdSet && !validIdSet.has(itemId)) return false;
      seenIds.add(itemId);
      return true;
    });
    return acc;
  }, createEmptyWowDungeonTierPlacements());
};

const areWowDungeonTierPlacementsEqual = (left = {}, right = {}) => (
  WOW_DUNGEON_TIER_LEVELS.every((tier) => {
    const leftIds = Array.isArray(left?.[tier.id]) ? left[tier.id] : [];
    const rightIds = Array.isArray(right?.[tier.id]) ? right[tier.id] : [];
    if (leftIds.length !== rightIds.length) return false;
    return leftIds.every((itemId, index) => itemId === rightIds[index]);
  })
);

const readWowDungeonTierPlacementsFromStorage = () => {
  if (typeof window === "undefined") return createEmptyWowDungeonTierPlacements();

  try {
    const rawValue = JSON.parse(localStorage.getItem(WOW_DUNGEON_TIER_LAYOUT_STORAGE_KEY) || "{}");
    return normalizeWowDungeonTierPlacements(rawValue);
  } catch (error) {
    return createEmptyWowDungeonTierPlacements();
  }
};

const findWowDungeonTierPlacementByItemId = (placements = {}, itemId = "") => {
  if (!itemId) return null;

  const matchedTier = WOW_DUNGEON_TIER_LEVELS.find((tier) => {
    const tierIds = Array.isArray(placements?.[tier.id]) ? placements[tier.id] : [];
    return tierIds.includes(itemId);
  });

  return matchedTier?.id || null;
};

const moveWowDungeonTierItemBetweenTiers = (placements = {}, itemId = "", nextTierId = null) => {
  const nextPlacements = WOW_DUNGEON_TIER_LEVELS.reduce((acc, tier) => {
    acc[tier.id] = Array.isArray(placements?.[tier.id]) ? [...placements[tier.id]] : [];
    return acc;
  }, createEmptyWowDungeonTierPlacements());

  WOW_DUNGEON_TIER_LEVELS.forEach((tier) => {
    nextPlacements[tier.id] = nextPlacements[tier.id].filter((currentItemId) => currentItemId !== itemId);
  });

  if (nextTierId && nextPlacements[nextTierId]) {
    nextPlacements[nextTierId].push(itemId);
  }

  return nextPlacements;
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return APP_TAB_IDS.includes(hash) ? hash : "home";
  });
  const [theme, setTheme] = useState(() => {
    try {
      return normalizeAppTheme(localStorage.getItem(APP_THEME_STORAGE_KEY));
    } catch (error) {
      return DEFAULT_APP_THEME;
    }
  });
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [draftPlayers, setDraftPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const publishedMatches = useMemo(() => matches.filter((m) => m.isPublished !== false), [matches]);
  const combinedLeaguePlayers = useMemo(() => {
    const normalizedPlayers = players.map((player) => ({ ...player, _source: "players" }));
    const existingNames = new Set(players.map((player) => (player.name || "").trim()).filter(Boolean));
    const draftOnlyPlayers = draftPlayers
      .filter((player) => !existingNames.has((player.name || "").trim()))
      .map((player) => ({ ...player, points: 0, _source: "draft_players" }));
    return [...normalizedPlayers, ...draftOnlyPlayers];
  }, [players, draftPlayers]);
  
  // ★ WOW 탭 상태 관리 ★
  const [wowRoster, setWowRoster] = useState([]);
  const [wowSortConfig, setWowSortConfig] = useState({ key: 'level', direction: 'desc' });
  const [isWowFaqOpen, setIsWowFaqOpen] = useState(false);

  const [wowSearchInput, setWowSearchInput] = useState("");
  const [showWowSearchDropdown, setShowWowSearchDropdown] = useState(false);
  const [wowSearchResults, setWowSearchResults] = useState([]);
  const [currentWowSearchIndex, setCurrentWowSearchIndex] = useState(-1);
  const [highlightedWowMemberId, setHighlightedWowMemberId] = useState(null);
  
  // ★ 직업 필터 상태 관리 ★
  const [selectedJobFilter, setSelectedJobFilter] = useState("전체");
  const [selectedWowSpecFilters, setSelectedWowSpecFilters] = useState(["전체"]);
  const [selectedWowPositionFilters, setSelectedWowPositionFilters] = useState(["전체"]);
  const [showWowRaidApplicantsOnly, setShowWowRaidApplicantsOnly] = useState(false);
  const [fixedRaidMembers, setFixedRaidMembers] = useState([]);
  const [raidPublicSettings, setRaidPublicSettings] = useState({ activeFixedRaidMemberOptionId: DEFAULT_FIXED_RAID_MEMBER_OPTION_ID });
  const [selectedFixedRaidMemberOptionId, setSelectedFixedRaidMemberOptionId] = useState(DEFAULT_FIXED_RAID_MEMBER_OPTION_ID);
  const [fixedRaidMemberForm, setFixedRaidMemberForm] = useState({ streamerName: "", jobClass: "", level: "60", imageUrl: "", preferredPositions: [], mainSpec: "", availableSpecs: [] });
  const [isFixedRaidMemberSaving, setIsFixedRaidMemberSaving] = useState(false);

  const [wowRaids, setWowRaids] = useState([]);
  const [selectedWowRaidId, setSelectedWowRaidId] = useState(null);
  const [wowRaidDetailTab, setWowRaidDetailTab] = useState('participants');
  const [wowRaidGroupFilter, setWowRaidGroupFilter] = useState('all');
  const [wowRaidAdminStatTab, setWowRaidAdminStatTab] = useState('damage');
  const [wowRaidForm, setWowRaidForm] = useState(() => createEmptyWowRaidForm());
  const [isWowRaidSaving, setIsWowRaidSaving] = useState(false);
  const [wowRaidRosterSearchInput, setWowRaidRosterSearchInput] = useState("");
  const [wowRaidFixedSearchInput, setWowRaidFixedSearchInput] = useState("");
  const [wowRaidGuestSearchInput, setWowRaidGuestSearchInput] = useState("");
  const [wowRaidStatSearchInput, setWowRaidStatSearchInput] = useState("");
  const [wowDungeonTierItems, setWowDungeonTierItems] = useState([]);
  const [wowDungeonTierForm, setWowDungeonTierForm] = useState(() => createEmptyWowDungeonTierForm());
  const [isWowDungeonTierSaving, setIsWowDungeonTierSaving] = useState(false);
  const [wowDungeonTierPlacements, setWowDungeonTierPlacements] = useState(() => readWowDungeonTierPlacementsFromStorage());
  const [wowDungeonTierDragItemId, setWowDungeonTierDragItemId] = useState(null);
  const [wowDungeonTierDropTarget, setWowDungeonTierDropTarget] = useState(null);
  const [wowDungeonTierSelectedItemId, setWowDungeonTierSelectedItemId] = useState(null);
  const [wowDungeonTierDetailItemId, setWowDungeonTierDetailItemId] = useState(null);
  const [wowDungeonTierDetailVideoIndex, setWowDungeonTierDetailVideoIndex] = useState(0);

  const [raidType, setRaidType] = useState(DEFAULT_RAID_TYPE);
  const [raidAssignments, setRaidAssignments] = useState(() => createEmptyRaidLayout(getRaidConfig(DEFAULT_RAID_TYPE).groupCount, GUILD_MASTER_ID));
  const [selectedRaidMemberId, setSelectedRaidMemberId] = useState(null);
  const [raidSearchInput, setRaidSearchInput] = useState("");
  const [raidSelectedJobFilters, setRaidSelectedJobFilters] = useState(["전체"]);
  const [raidSelectedLevelFilters, setRaidSelectedLevelFilters] = useState(["50+"]);
  const [raidSelectedSpecFilters, setRaidSelectedSpecFilters] = useState(["전체"]);
  const [raidSelectedPositionFilters, setRaidSelectedPositionFilters] = useState(["전체"]);
  const [isRaidLevelFilterOpen, setIsRaidLevelFilterOpen] = useState(false);
  const [isRaidFilterPanelCollapsed, setIsRaidFilterPanelCollapsed] = useState(true);
  const [selectedRaidTargetSlotKey, setSelectedRaidTargetSlotKey] = useState(null);
  const [isRaidWaitingRoomCollapsed, setIsRaidWaitingRoomCollapsed] = useState(false);
  const [raidRoleAssignments, setRaidRoleAssignments] = useState({});
  const [raidAssignedPreferredPositions, setRaidAssignedPreferredPositions] = useState({});
  const [raidRoleMenuSlotKey, setRaidRoleMenuSlotKey] = useState(null);
  const [raidPositionMenuSlotKey, setRaidPositionMenuSlotKey] = useState(null);
  const [isRaidRoleGuideOpen, setIsRaidRoleGuideOpen] = useState(false);
  const [isRaidFixedMemberMenuOpen, setIsRaidFixedMemberMenuOpen] = useState(false);
  const [raidDragMemberId, setRaidDragMemberId] = useState(null);
  const [raidDragOverSlot, setRaidDragOverSlot] = useState(null);
  const [isRaidCapturing, setIsRaidCapturing] = useState(false);
  const [buskingSettings, setBuskingSettings] = useState({ isVotingOpen: false, roundId: "wow-busking-default", startedAt: null, endedAt: null, noticeUrl: "" });
  const [pendingBuskingVoteId, setPendingBuskingVoteId] = useState(null);
  const [buskingLocalVotes, setBuskingLocalVotes] = useState([]);
  const [buskingPublicRoster, setBuskingPublicRoster] = useState([]);
  const [buskingPublicMeta, setBuskingPublicMeta] = useState({ totalVotes: 0, participantCount: 0, updatedAt: null, leaderId: null });
  const [buskingShardCounts, setBuskingShardCounts] = useState({});
  const [isBuskingAdminSaving, setIsBuskingAdminSaving] = useState(false);
  const [buskingNoticeLinkInput, setBuskingNoticeLinkInput] = useState("");
  const [buskingClientId] = useState(() => {
    try {
      const existing = localStorage.getItem(BUSKING_CLIENT_ID_STORAGE_KEY);
      if (existing) return existing;
      const generated = `busking-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(BUSKING_CLIENT_ID_STORAGE_KEY, generated);
      return generated;
    } catch (error) {
      return `busking-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
  });
  const raidScreenshotRef = useRef(null);

  const fetchBuskingShardSnapshot = async (roundId) => {
    const resolvedRoundId = roundId || "wow-busking-default";
    const shardsRef = collection(db, "artifacts", appId, "public", "data", "busking_rounds", resolvedRoundId, BUSKING_PUBLIC_SHARDS_COLLECTION);
    const shardsSnap = await getDocs(shardsRef);

    const voteCounts = {};
    let totalVotes = 0;
    let latestUpdatedAt = null;

    shardsSnap.forEach((shardDoc) => {
      const shardData = shardDoc.data() || {};
      totalVotes += Number(shardData.totalVotes) || 0;
      if (shardData.updatedAt && (!latestUpdatedAt || new Date(shardData.updatedAt).getTime() > new Date(latestUpdatedAt).getTime())) {
        latestUpdatedAt = shardData.updatedAt;
      }

      const shardCounts = shardData.counts || {};
      Object.entries(shardCounts).forEach(([memberId, count]) => {
        voteCounts[memberId] = (voteCounts[memberId] || 0) + (Number(count) || 0);
      });

      Object.entries(shardData).forEach(([fieldKey, count]) => {
        if (!fieldKey.startsWith("counts.")) return;
        const memberId = fieldKey.slice(7);
        if (!memberId) return;
        voteCounts[memberId] = (voteCounts[memberId] || 0) + (Number(count) || 0);
      });
    });

    return { voteCounts, totalVotes, updatedAt: latestUpdatedAt };
  };

  const persistBuskingPublicSummary = async ({ rosterOverride = null, settingsOverride = null, voteCountsOverride = null } = {}) => {
    const resolvedRoster = Array.isArray(rosterOverride) ? rosterOverride : wowRoster;
    let resolvedSettings = settingsOverride;

    if (!resolvedSettings) {
      const settingsSnap = await getDoc(doc(db, "artifacts", appId, "public", "data", "settings", "busking"));
      resolvedSettings = settingsSnap.exists()
        ? { isVotingOpen: false, roundId: "wow-busking-default", startedAt: null, endedAt: null, noticeUrl: "", ...settingsSnap.data() }
        : { isVotingOpen: false, roundId: "wow-busking-default", startedAt: null, endedAt: null, noticeUrl: "" };
    }

    const resolvedVoteCounts = voteCountsOverride ?? buskingShardCounts;
    const summary = buildBuskingPublicSummary(resolvedRoster, resolvedSettings, resolvedVoteCounts);
    await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", BUSKING_PUBLIC_SUMMARY_DOC_ID), summary);
    return summary;
  };

  const [isLoading, setIsLoading] = useState(true);
  
  // ★ 관리자 인증 상태 관리 ★
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminNicknameInput, setAdminNicknameInput] = useState(() => localStorage.getItem("wak_admin_nickname") || "");
  const [currentAdminName, setCurrentAdminName] = useState(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false); 

  // ★ 관리자 화면 내부 탭 관리 (league: 버종리 설정, wow: 와우 설정, etc: 기타 설정) ★
  const [adminInnerTab, setAdminInnerTab] = useState("league");
  
  const [rawAdminPresence, setRawAdminPresence] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
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
  const [isWowNavMenuOpen, setIsWowNavMenuOpen] = useState(false);
  const [isMobileWowMenuOpen, setIsMobileWowMenuOpen] = useState(false);

  const [expandedFundingMatchId, setExpandedFundingMatchId] = useState(null);
  const [cheeringPlayerId, setCheeringPlayerId] = useState(null);
  const [playerCardSearchInput, setPlayerCardSearchInput] = useState("");
  const [playerCardSort, setPlayerCardSort] = useState({ key: "name", direction: "asc" });

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
  const [wowMainSpec, setWowMainSpec] = useState("");
  const [wowAvailableSpecsSelection, setWowAvailableSpecsSelection] = useState([]);
  const [wowLevel, setWowLevel] = useState("");
  const [isWowSubmitting, setIsWowSubmitting] = useState(false);
  const [wowAdminSearchTerm, setWowAdminSearchTerm] = useState("");
  const [wowAdminSortOption, setWowAdminSortOption] = useState("levelDesc");
  const [wowPartnerGenerationInputs, setWowPartnerGenerationInputs] = useState({});

  const [hasFunding, setHasFunding] = useState(false);
  const [totalFunding, setTotalFunding] = useState("");

  const [individualResults, setIndividualResults] = useState([
    { playerName: "", rank: 1, scoreChange: 100, fundingRatio: "", fundingAmount: "" },
    { playerName: "", rank: 2, scoreChange: 50, fundingRatio: "", fundingAmount: "" },
  ]);
  const [teamResults, setTeamResults] = useState(() => createDefaultTeamMatchResults());

  const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'desc' });
  const [matchToEdit, setMatchToEdit] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [matchSearchInput, setMatchSearchInput] = useState("");
  const [editGameName, setEditGameName] = useState("");
  const [editMatchDate, setEditMatchDate] = useState("");
  const [editMatchMode, setEditMatchMode] = useState("individual");
  const [editHasFunding, setEditHasFunding] = useState(false);
  const [editTotalFunding, setEditTotalFunding] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editIndividualResults, setEditIndividualResults] = useState([]);
  const [editTeamResults, setEditTeamResults] = useState([]);
  const [isEditingSubmit, setIsEditingSubmit] = useState(false);

  const playerStatsMap = useMemo(() => {
    return players.map((p) => {
      let matchCount = 0;
      let winCount = 0;
      publishedMatches.forEach((m) => {
        const res = m.results?.find((r) => r.playerName === p.name);
        if (res) {
          matchCount++;
          if (res.rank === 1) winCount++;
        }
      });
      const avgScore = matchCount > 0 ? (p.points / matchCount) : 0;
      return { ...p, matchCount, winCount, avgScore: Number(avgScore.toFixed(1)) };
    }); 
  }, [players, publishedMatches]);

  const sortedPlayerStats = useMemo(() => {
    let sortableItems = [...playerStatsMap];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    return sortableItems;
  }, [playerStatsMap, sortConfig]);

  const filteredPublishedMatches = useMemo(() => {
    const normalizedKeyword = matchSearchInput.trim().toLowerCase();
    if (!normalizedKeyword) return publishedMatches;

    return publishedMatches.filter((match) => {
      const searchableText = [
        match.gameName,
        ...(match.results || []).map((result) => result.playerName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });
  }, [publishedMatches, matchSearchInput]);

  const filteredPlayersForGallery = useMemo(() => {
    const normalizedKeyword = playerCardSearchInput.trim().toLowerCase();
    let items = [...players];

    if (normalizedKeyword) {
      items = items.filter((player) => {
        const searchableText = [
          player.name,
          player.broadcastUrl,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedKeyword);
      });
    }

    items.sort((a, b) => {
      if (playerCardSort.key === "name") {
        const nameCompare = (a.name || "").localeCompare(b.name || "", "ko");
        if (nameCompare !== 0) return playerCardSort.direction === "asc" ? nameCompare : -nameCompare;
      } else {
        const numericField = playerCardSort.key === "points" ? "points" : "hearts";
        const numericGap = (Number(a[numericField]) || 0) - (Number(b[numericField]) || 0);
        if (numericGap !== 0) return playerCardSort.direction === "asc" ? numericGap : -numericGap;
      }

      return (a.name || "").localeCompare(b.name || "", "ko");
    });

    return items;
  }, [players, playerCardSearchInput, playerCardSort]);

  const wowDungeonTierItemMap = useMemo(() => (
    wowDungeonTierItems.reduce((acc, item) => {
      if (item?.id) acc[item.id] = item;
      return acc;
    }, {})
  ), [wowDungeonTierItems]);

  const wowDungeonTierCardsByTier = useMemo(() => (
    WOW_DUNGEON_TIER_LEVELS.reduce((acc, tier) => {
      acc[tier.id] = (wowDungeonTierPlacements?.[tier.id] || [])
        .map((itemId) => wowDungeonTierItemMap[itemId])
        .filter(Boolean);
      return acc;
    }, {})
  ), [wowDungeonTierPlacements, wowDungeonTierItemMap]);

  const wowDungeonTierPlacedIds = useMemo(() => (
    new Set(
      WOW_DUNGEON_TIER_LEVELS.flatMap((tier) => wowDungeonTierPlacements?.[tier.id] || [])
    )
  ), [wowDungeonTierPlacements]);

  const wowDungeonTierStashItems = useMemo(() => (
    wowDungeonTierItems.filter((item) => item?.id && !wowDungeonTierPlacedIds.has(item.id))
  ), [wowDungeonTierItems, wowDungeonTierPlacedIds]);

  const wowDungeonTierSelectedItem = useMemo(() => (
    wowDungeonTierSelectedItemId ? wowDungeonTierItemMap[wowDungeonTierSelectedItemId] || null : null
  ), [wowDungeonTierSelectedItemId, wowDungeonTierItemMap]);

  const wowDungeonTierFormNormalizedVideoUrls = useMemo(() => (
    normalizeWowDungeonVideoUrls(wowDungeonTierForm.videoUrls)
  ), [wowDungeonTierForm.videoUrls]);

  const wowDungeonTierSelectedTierId = useMemo(() => (
    findWowDungeonTierPlacementByItemId(wowDungeonTierPlacements, wowDungeonTierSelectedItemId)
  ), [wowDungeonTierPlacements, wowDungeonTierSelectedItemId]);

  const wowDungeonTierDetailItem = useMemo(() => (
    wowDungeonTierDetailItemId ? wowDungeonTierItemMap[wowDungeonTierDetailItemId] || null : null
  ), [wowDungeonTierDetailItemId, wowDungeonTierItemMap]);

  const wowDungeonTierDetailTierId = useMemo(() => (
    findWowDungeonTierPlacementByItemId(wowDungeonTierPlacements, wowDungeonTierDetailItemId)
  ), [wowDungeonTierPlacements, wowDungeonTierDetailItemId]);

  const wowDungeonTierDetailVideoUrls = useMemo(() => (
    normalizeWowDungeonVideoUrls(
      wowDungeonTierDetailItem?.videoUrls,
      wowDungeonTierDetailItem?.videoUrl
    )
  ), [wowDungeonTierDetailItem]);

  const wowDungeonTierDetailActiveVideoUrl = useMemo(() => (
    wowDungeonTierDetailVideoUrls[wowDungeonTierDetailVideoIndex] || ""
  ), [wowDungeonTierDetailVideoIndex, wowDungeonTierDetailVideoUrls]);

  const wowDungeonTierDetailVideoEmbedConfig = useMemo(() => (
    getWowDungeonTierVideoEmbedConfig(wowDungeonTierDetailActiveVideoUrl)
  ), [wowDungeonTierDetailActiveVideoUrl]);

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc'; 
    setSortConfig({ key, direction });
  };

  const handlePlayerCardSortChange = (key) => {
    setPlayerCardSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }

      return { key, direction: key === "name" ? "asc" : "desc" };
    });
  };

  const handleToggleTheme = () => {
    setTheme((prev) => prev === "light" ? "dark" : "light");
  };

  const isLightTheme = theme === "light";

  const shellTheme = useMemo(() => ({
    nav: isLightTheme
      ? "bg-white/92 border-b border-slate-200/90 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"
      : "bg-gray-900 border-b border-gray-800 shadow-md",
    navTitle: isLightTheme ? "text-slate-900" : "text-white",
    navTitleIcon: isLightTheme ? "text-green-600" : "text-green-400",
    brandBadge: isLightTheme
      ? "flex items-center justify-center px-2 py-0.5 bg-slate-950 text-emerald-400 border border-emerald-500/40 rounded text-xs font-black tracking-widest transition-all duration-300 shadow-[0_10px_20px_rgba(22,163,74,0.14)] hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
      : "flex items-center justify-center px-2 py-0.5 bg-black text-green-400 border border-green-500/50 rounded text-xs font-black tracking-widest hover:bg-green-400 hover:text-black transition-all duration-300 shadow-[0_0_10px_rgba(74,222,128,0.3)] hover:shadow-[0_0_15px_rgba(74,222,128,0.6)]",
    metaChip: isLightTheme
      ? "text-[10px] md:text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center whitespace-nowrap"
      : "text-[10px] md:text-xs font-medium text-white/90 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm flex items-center whitespace-nowrap",
    popupOverlay: isLightTheme
      ? "fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm animate-in fade-in duration-300"
      : "fixed inset-0 z-[500] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-300",
    popupPanel: isLightTheme
      ? "bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col"
      : "bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden flex flex-col",
    popupHeader: isLightTheme
      ? "flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50/95"
      : "flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/80",
    popupHeaderTitle: isLightTheme
      ? "text-lg font-black text-slate-900 flex items-center"
      : "text-lg font-black text-white flex items-center",
    popupCloseButton: isLightTheme
      ? "p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      : "p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors",
    popupBody: isLightTheme
      ? "p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white"
      : "p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-gray-900/50",
    popupBodyTitle: isLightTheme
      ? "text-xl font-bold text-slate-900 mb-4 leading-tight"
      : "text-xl font-bold text-white mb-4 leading-tight",
    popupBodyText: isLightTheme
      ? "text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-keep"
      : "text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-keep",
    popupFooter: isLightTheme
      ? "p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center"
      : "p-3 border-t border-gray-700 bg-gray-800 flex justify-between items-center",
    popupCheckbox: isLightTheme
      ? "w-4 h-4 accent-indigo-600 rounded bg-white border-slate-300 cursor-pointer"
      : "w-4 h-4 accent-indigo-500 rounded bg-gray-700 border-gray-600 cursor-pointer",
    popupFooterLabel: isLightTheme
      ? "text-xs font-medium text-slate-500 group-hover:text-slate-800 select-none transition-colors"
      : "text-xs font-medium text-gray-400 group-hover:text-gray-200 select-none transition-colors",
    popupFooterButton: isLightTheme
      ? "px-5 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors"
      : "px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors",
    toastBase: isLightTheme
      ? "fixed bottom-6 right-6 z-[300] px-6 py-3 rounded-xl border shadow-[0_18px_40px_rgba(15,23,42,0.18)] text-sm font-semibold"
      : "fixed bottom-6 right-6 z-[300] px-6 py-3 rounded-lg shadow-2xl text-white",
    toastSuccess: isLightTheme ? "bg-white text-emerald-700 border-emerald-200" : "bg-green-600",
    toastError: isLightTheme ? "bg-white text-rose-700 border-rose-200" : "bg-red-600",
    mobileOverlay: isLightTheme
      ? "fixed inset-0 z-[390] bg-slate-950/20 backdrop-blur-sm md:hidden transition-opacity"
      : "fixed inset-0 z-[390] bg-black/40 backdrop-blur-sm md:hidden transition-opacity",
    mobileMenuActive: isLightTheme
      ? "bg-white border-green-500/30 text-green-700 font-black shadow-[0_12px_28px_rgba(22,163,74,0.14)]"
      : "bg-gray-800 border-green-500/50 text-green-400 font-black shadow-[0_0_10px_rgba(74,222,128,0.2)]",
    mobileMenuInactive: isLightTheme
      ? "bg-white/95 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-[0_12px_24px_rgba(15,23,42,0.10)]"
      : "bg-gray-800/90 border-gray-700/50 text-white font-bold hover:bg-gray-700",
    mobileThemeButton: isLightTheme
      ? "bg-white border-slate-200 text-slate-900 font-black shadow-[0_12px_24px_rgba(15,23,42,0.10)] hover:bg-slate-50"
      : "bg-gray-800/90 border-gray-700/50 text-yellow-300 font-bold hover:bg-gray-700",
    mobileFabOpen: isLightTheme
      ? "bg-white border border-slate-200 rotate-90 shadow-[0_12px_24px_rgba(15,23,42,0.14)] text-slate-500"
      : "bg-gray-800 border border-gray-600 rotate-90 shadow-none text-gray-400",
    mobileFabClosed: isLightTheme
      ? "bg-green-600 hover:bg-green-500 rotate-0 text-white shadow-[0_14px_28px_rgba(22,163,74,0.32)]"
      : "bg-green-600 hover:bg-green-500 rotate-0 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]",
  }), [isLightTheme]);

  const isWowSectionActive = WOW_SECTION_TAB_IDS.includes(activeTab);

  const getDesktopNavButtonClasses = (tabId, tone = "default", options = {}) => {
    const isActive = typeof options.isActive === "boolean" ? options.isActive : activeTab === tabId;

    if (isLightTheme) {
      if (tone === "wow") {
        return `px-2.5 py-1.5 rounded-lg text-sm font-medium flex items-center whitespace-nowrap border transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
            : "text-blue-700 border-transparent hover:border-blue-200 hover:bg-white"
        }`;
      }

      if (tone === "wowraid") {
        return `px-2.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors ${
          isActive
            ? "bg-violet-50 text-violet-700 border-violet-200 shadow-sm"
            : "text-violet-700 border-transparent hover:border-violet-200 hover:bg-white"
        }`;
      }

      if (tone === "admin") {
        return `px-2.5 py-1.5 rounded-lg border flex items-center text-sm font-medium whitespace-nowrap transition-colors ${
          isActive
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
            : "text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 hover:bg-white"
        }`;
      }

      return `px-2.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
          : "text-slate-600 border-transparent hover:border-slate-200 hover:bg-white hover:text-slate-900"
      }`;
    }

    if (tone === "wow") {
      return `px-2.5 py-1.5 rounded text-sm font-medium flex items-center whitespace-nowrap ${
        isActive ? "bg-blue-900/50 text-blue-400 border border-blue-500/50" : "text-blue-300 hover:text-white hover:bg-gray-800"
      }`;
    }

    if (tone === "wowraid") {
      return `px-2.5 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
        isActive ? "bg-violet-900/50 text-violet-300 border border-violet-500/50" : "text-violet-300 hover:text-white hover:bg-gray-800"
      }`;
    }

    if (tone === "admin") {
      return `px-2.5 py-1.5 rounded border border-gray-600 flex items-center text-sm font-medium whitespace-nowrap ${
        isActive ? "bg-gray-800 text-green-400 border-green-500" : "text-gray-400 hover:text-white hover:border-gray-400"
      }`;
    }

    return `px-2.5 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
      isActive ? "bg-gray-800 text-green-400" : "text-gray-300 hover:text-white"
    }`;
  };

  const getWowNavMenuItemClasses = (tabId) => {
    const isActive = activeTab === tabId;

    if (isLightTheme) {
      return `w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        isActive
          ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
          : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
      }`;
    }

    return `w-full flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
      isActive
        ? "border-blue-500/40 bg-blue-900/40 text-blue-100"
        : "border-transparent text-gray-200 hover:border-gray-700 hover:bg-gray-800"
    }`;
  };

  const getMobileWowMenuItemClasses = (tabId) => {
    const isActive = activeTab === tabId;

    if (isLightTheme) {
      return `flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "bg-blue-50 border-blue-200 text-blue-700 font-black shadow-[0_12px_24px_rgba(37,99,235,0.12)]"
          : "bg-white/95 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 shadow-[0_12px_24px_rgba(15,23,42,0.10)]"
      }`;
    }

    return `flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
      isActive
        ? "bg-blue-900/50 border-blue-500/50 text-blue-200 font-black shadow-[0_0_12px_rgba(59,130,246,0.16)]"
        : "bg-gray-800/90 border-gray-700/50 text-gray-200 font-bold hover:bg-gray-700"
    }`;
  };

  const publicTheme = useMemo(() => ({
    heading: isLightTheme ? "text-slate-900" : "text-white",
    bodyText: isLightTheme ? "text-slate-600" : "text-gray-300",
    mutedText: isLightTheme ? "text-slate-500" : "text-gray-400",
    faintText: isLightTheme ? "text-slate-400" : "text-gray-500",
    surfaceCard: isLightTheme
      ? "bg-white rounded-xl border border-slate-200 shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
      : "bg-gray-800 rounded-xl border border-gray-700",
    surfaceCardSoft: isLightTheme
      ? "bg-slate-50/90 border border-slate-200"
      : "bg-gray-700/30 border border-gray-600",
    searchInput: isLightTheme
      ? "w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      : "w-full rounded-xl border border-gray-700 bg-gray-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20",
    heroHome: isLightTheme
      ? "rounded-2xl p-8 shadow-[0_24px_56px_rgba(15,23,42,0.12)] border border-slate-200 bg-[linear-gradient(135deg,_rgba(236,253,245,0.98)_0%,_rgba(255,255,255,0.98)_46%,_rgba(238,242,255,0.98)_100%)] relative overflow-hidden flex items-center min-h-[240px]"
      : "bg-gradient-to-r from-green-900 to-gray-900 rounded-2xl p-8 shadow-xl border border-green-800/50 relative overflow-hidden flex items-center min-h-[240px]",
    heroPlayers: isLightTheme
      ? "bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(253,242,248,0.94)_35%,_rgba(238,242,255,0.96)_100%)] border border-fuchsia-200/80 rounded-2xl p-8 shadow-[0_24px_60px_rgba(15,23,42,0.10)] relative overflow-hidden"
      : "bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-8 shadow-xl relative overflow-hidden",
    heroTier: isLightTheme
      ? "relative overflow-hidden rounded-2xl border border-amber-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(254,243,199,0.92)_32%,_rgba(241,245,249,1)_100%)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.10)]"
      : "relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-900/20 via-gray-800 to-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.35)]",
    emptyState: isLightTheme ? "text-slate-500" : "text-gray-500",
    tableShell: isLightTheme
      ? "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_18px_42px_rgba(15,23,42,0.08)] mt-8"
      : "bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8",
    tableHeaderWrap: isLightTheme
      ? "p-5 border-b border-slate-200 bg-slate-50"
      : "p-5 border-b border-gray-700 bg-gray-800/50",
    tableHead: isLightTheme
      ? "text-sm text-slate-500 bg-slate-100 uppercase"
      : "text-sm text-gray-400 bg-gray-900 uppercase",
    tableRow: isLightTheme
      ? "border-b border-slate-200 hover:bg-slate-50 transition cursor-pointer"
      : "border-b border-gray-700 hover:bg-gray-700/50 transition cursor-pointer",
    playersSortActive: isLightTheme
      ? "bg-white text-slate-900 border-slate-200 shadow-sm"
      : "bg-purple-500/15 text-purple-200 border-purple-400/40 shadow-[0_0_18px_rgba(168,85,247,0.12)]",
    playersSortInactive: isLightTheme
      ? "bg-transparent text-slate-500 border-transparent hover:bg-white hover:text-slate-900 hover:border-slate-200"
      : "bg-gray-900/80 text-gray-300 border-gray-700 hover:border-purple-500/40 hover:text-white",
  }), [isLightTheme]);

  const wowSpecTagClass = isLightTheme ? LIGHT_WOW_SPEC_TAG_CLASS : WOW_SPEC_TAG_CLASS;
  const wowSpecExtraTagClass = isLightTheme ? LIGHT_WOW_SPEC_EXTRA_TAG_CLASS : WOW_SPEC_EXTRA_TAG_CLASS;

  const wowTheme = useMemo(() => ({
    heading: isLightTheme ? "text-slate-900" : "text-white",
    bodyText: isLightTheme ? "text-slate-600" : "text-gray-300",
    mutedText: isLightTheme ? "text-slate-500" : "text-gray-400",
    faintText: isLightTheme ? "text-slate-400" : "text-gray-500",
    hero: isLightTheme
      ? "bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(219,234,254,0.96)_36%,_rgba(233,213,255,0.96)_78%,_rgba(241,245,249,1)_100%)] rounded-2xl p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] border border-blue-200/80 relative overflow-hidden"
      : "bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-8 shadow-xl border border-blue-500/30 relative overflow-hidden",
    heroTitle: isLightTheme
      ? "text-3xl font-black text-slate-900 mb-3 flex items-center"
      : "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-3 flex items-center drop-shadow-md",
    heroBody: isLightTheme
      ? "text-slate-700 text-lg leading-relaxed max-w-2xl font-medium"
      : "text-blue-100 text-lg leading-relaxed max-w-2xl font-medium shadow-sm",
    noticeCard: isLightTheme
      ? "bg-white rounded-xl border border-amber-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-6 relative overflow-hidden"
      : "bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-6 relative overflow-hidden",
    noticeBar: isLightTheme ? "bg-amber-500" : "bg-yellow-500",
    statCard: isLightTheme
      ? "bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
      : "bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between",
    faqCard: isLightTheme
      ? "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.08)] mt-8 transition-all duration-300"
      : "bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8 transition-all duration-300",
    faqToggle: isLightTheme
      ? "w-full p-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors outline-none"
      : "w-full p-5 flex items-center justify-between bg-gray-800 hover:bg-gray-700/80 transition-colors outline-none",
    faqNote: isLightTheme
      ? "bg-amber-50 p-5 rounded-lg border border-amber-200 mt-4 relative overflow-hidden"
      : "bg-gray-900/60 p-5 rounded-lg border border-gray-700/50 mt-4 relative overflow-hidden",
    panel: isLightTheme
      ? "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.08)] mt-8"
      : "bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-8",
    panelHeader: isLightTheme
      ? "p-5 border-b border-slate-200 bg-slate-50 flex flex-col gap-4 relative"
      : "p-5 border-b border-gray-700 bg-gray-800/50 flex flex-col gap-4 relative",
    searchShell: isLightTheme
      ? "relative flex items-center w-full md:w-auto bg-white rounded-lg border border-slate-300 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] z-20 mt-2 md:mt-0"
      : "relative flex items-center w-full md:w-auto bg-gray-900 rounded-lg border border-gray-600 p-1 shadow-inner z-20 mt-2 md:mt-0",
    searchInput: isLightTheme
      ? "w-full md:w-48 bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 py-1.5"
      : "w-full md:w-48 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 py-1.5",
    dropdown: isLightTheme
      ? "absolute top-full right-0 mt-2 w-full md:w-72 bg-white border border-slate-200 rounded-lg shadow-[0_18px_40px_rgba(15,23,42,0.12)] overflow-hidden custom-scrollbar max-h-60 z-50"
      : "absolute top-full right-0 mt-2 w-full md:w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden custom-scrollbar max-h-60 z-50",
    tableHead: isLightTheme ? "text-sm text-slate-500 bg-slate-100 uppercase" : "text-sm text-gray-400 bg-gray-900 uppercase",
    tableHeadHover: isLightTheme ? "cursor-pointer group select-none hover:bg-slate-200 transition" : "cursor-pointer group select-none hover:bg-gray-800 transition",
    highlightedRow: isLightTheme
      ? "bg-violet-100/80 border-violet-300 shadow-[inset_0_0_16px_rgba(124,58,237,0.10)]"
      : "bg-purple-800/40 border-purple-500 shadow-[inset_0_0_15px_rgba(168,85,247,0.3)]",
    qualifiedRow: isLightTheme ? "bg-white hover:bg-slate-50 border-slate-200" : "bg-yellow-900/10 hover:bg-yellow-900/20 border-gray-700",
    defaultRow: isLightTheme ? "hover:bg-slate-50 border-slate-200" : "hover:bg-gray-700/50 border-gray-700",
    actionCopyButton: isLightTheme
      ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center whitespace-nowrap shadow-sm"
      : "bg-gray-700/35 text-emerald-300 hover:bg-emerald-600/15 hover:text-emerald-200 border border-transparent hover:border-emerald-500/25 px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center whitespace-nowrap",
    actionRaidButton: isLightTheme
      ? "relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white border border-fuchsia-200 hover:from-fuchsia-500 hover:via-violet-500 hover:to-indigo-500 px-3.5 py-1.5 rounded-lg text-sm font-black transition-all duration-200 flex items-center shadow-[0_18px_36px_rgba(124,58,237,0.24)] whitespace-nowrap"
      : "relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white border border-fuchsia-300/25 hover:from-fuchsia-500 hover:via-violet-500 hover:to-indigo-500 px-3.5 py-1.5 rounded-lg text-sm font-black transition-all duration-200 flex items-center shadow-[0_0_28px_rgba(168,85,247,0.28)] hover:shadow-[0_0_36px_rgba(168,85,247,0.38)] whitespace-nowrap",
    actionExternalLink: isLightTheme
      ? "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 hover:border-sky-300 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center whitespace-nowrap shadow-sm"
      : "bg-cyan-600/5 text-cyan-300 border border-cyan-500/45 hover:bg-cyan-500/20 hover:border-cyan-300 hover:text-white px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center whitespace-nowrap",
    filterInactive: isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500",
    filterActive: isLightTheme ? "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-[0_12px_28px_rgba(8,145,178,0.10)]" : "bg-cyan-500/15 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.12)]",
    emptyPanel: isLightTheme ? "bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "bg-gray-800 rounded-2xl border border-gray-700 p-10 text-center text-gray-400",
    faqExpandedPanel: isLightTheme ? "p-6 pt-2 border-t border-slate-200 bg-slate-50 animate-in fade-in slide-in-from-top-2" : "p-6 pt-2 border-t border-gray-700/50 bg-gray-800/50 animate-in fade-in slide-in-from-top-2",
    faqExpandedContent: isLightTheme ? "space-y-6 text-slate-600 leading-relaxed text-sm md:text-base" : "space-y-6 text-gray-300 leading-relaxed text-sm md:text-base",
    raidDetailHero: isLightTheme
      ? "bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(224,231,255,0.96)_34%,_rgba(241,245,249,1)_100%)] rounded-2xl border border-violet-200 overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
      : "bg-gradient-to-r from-violet-900/35 via-indigo-900/35 to-slate-900 rounded-2xl border border-violet-500/20 overflow-hidden shadow-xl",
    raidDetailImagePanel: isLightTheme ? "h-full min-h-[240px] bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200" : "h-full min-h-[240px] bg-gray-900/60 border-b lg:border-b-0 lg:border-r border-white/5",
    raidStatCard: isLightTheme ? "rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]" : "rounded-xl border border-gray-700 bg-gray-900/60 p-4",
    raidTabActive: isLightTheme ? "bg-violet-600 text-white border-violet-500 shadow-[0_14px_28px_rgba(124,58,237,0.16)]" : "bg-violet-600 text-white border-violet-400 shadow-[0_0_0_1px_rgba(196,181,253,0.18)]",
    raidTabInactive: isLightTheme ? "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900" : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white",
    raidParticipantCard: isLightTheme ? "bg-white rounded-xl border border-slate-200 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-lg",
    raidRankingCard: isLightTheme ? "bg-white rounded-xl border border-slate-200 p-5 shadow-sm" : "bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-5 shadow-lg",
    raidTableShell: isLightTheme ? "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg",
    raidTableHead: isLightTheme ? "bg-slate-100 text-slate-600" : "bg-gray-900/90 text-gray-300",
    raidTableRow: isLightTheme ? "border-t border-slate-200 hover:bg-slate-50" : "border-t border-gray-700/80 hover:bg-gray-700/20",
    backButton: isLightTheme ? "inline-flex items-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition shadow-sm" : "inline-flex items-center px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white font-bold hover:bg-gray-700 transition",
  }), [isLightTheme]);

  const raidTheme = useMemo(() => ({
    backButton: isLightTheme
      ? "inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-blue-300 hover:bg-slate-50 transition w-fit shadow-sm"
      : "inline-flex items-center px-4 py-2 rounded-xl border border-gray-700 bg-gray-800/80 text-gray-200 hover:text-white hover:border-blue-500/50 hover:bg-gray-800 transition w-fit",
    pinkButton: isLightTheme
      ? "inline-flex items-center px-3.5 py-2 rounded-xl border border-fuchsia-200 bg-white text-fuchsia-700 hover:bg-fuchsia-50 transition shadow-sm"
      : "inline-flex items-center px-3.5 py-2 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20 transition",
    blueButton: isLightTheme
      ? "inline-flex items-center px-3.5 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition shadow-sm"
      : "inline-flex items-center px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 transition",
    resetButton: isLightTheme
      ? "inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
      : "inline-flex items-center px-3.5 py-2 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition",
    screenshotIdle: isLightTheme
      ? "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
    screenshotBusy: isLightTheme
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-wait shadow-sm"
      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100 cursor-wait",
    hero: isLightTheme
      ? "relative overflow-hidden rounded-3xl border border-fuchsia-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(245,208,254,0.9)_28%,_rgba(219,234,254,0.92)_72%,_rgba(241,245,249,1)_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
      : "relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-r from-[#1b1331] via-[#141a33] to-[#10203a] p-6 shadow-[0_20px_60px_rgba(76,29,149,0.18)]",
    heroMetricCard: isLightTheme ? "rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]" : "rounded-2xl border border-white/10 bg-white/5 p-4",
    panel: isLightTheme ? "raid-light-surface rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] overflow-hidden" : "rounded-2xl border border-gray-700 bg-gray-800/90 shadow-xl overflow-hidden",
    panelHeader: isLightTheme ? "px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" : "px-5 py-4 border-b border-gray-700 bg-gray-900/60 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
    optionActive: isLightTheme ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 shadow-[0_14px_28px_rgba(192,38,211,0.10)]" : "border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_18px_rgba(168,85,247,0.18)]",
    optionInactive: isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500",
    miniPanelButton: isLightTheme ? "w-full rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-fuchsia-300 hover:bg-slate-50 transition px-2 py-3 flex flex-col items-center gap-1.5 shadow-sm" : "w-full rounded-xl border border-gray-700 bg-gray-900/80 text-gray-200 hover:text-white hover:border-fuchsia-500/40 hover:bg-gray-900 transition px-2 py-3 flex flex-col items-center gap-1.5",
    miniPanelCount: isLightTheme ? "w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center shadow-sm" : "w-full rounded-xl border border-gray-700 bg-gray-900/60 px-2 py-2 text-center",
    searchShell: isLightTheme ? "relative flex items-center flex-1 bg-white rounded-xl border border-slate-300 px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]" : "relative flex items-center flex-1 bg-gray-900 rounded-xl border border-gray-700 px-1.5 py-1 shadow-inner",
    searchInput: isLightTheme ? "w-full bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 py-1" : "w-full bg-transparent text-sm text-white focus:outline-none placeholder-gray-500 py-1",
    filterToggleActive: isLightTheme ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" : "border-fuchsia-400/40 bg-fuchsia-500/12 text-fuchsia-100",
    filterToggleInactive: isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500",
    levelFilterToggleActive: isLightTheme ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 shadow-[0_12px_28px_rgba(192,38,211,0.10)]" : "border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-100",
    levelFilterToggleInactive: isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500",
    levelFilterSummary: isLightTheme ? "px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600" : "px-1.5 py-0.5 rounded-full bg-black/25 text-[10px] text-gray-100",
    levelFilterOptionActive: isLightTheme ? "border-blue-200 bg-blue-50 text-blue-700 shadow-[0_12px_28px_rgba(37,99,235,0.10)]" : "border-blue-400/40 bg-blue-500/15 text-blue-100 shadow-[0_0_12px_rgba(59,130,246,0.14)]",
    levelFilterOptionInactive: isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : "border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500",
    slotFilled: isLightTheme ? "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50" : "border-gray-700 bg-gray-800/90 hover:border-blue-400/50 hover:bg-gray-800",
    slotEmpty: isLightTheme ? "border-dashed border-slate-300 bg-slate-50 hover:border-fuchsia-300 hover:bg-white" : "border-dashed border-gray-700 bg-gray-900/60 hover:border-fuchsia-500/40 hover:bg-gray-900",
    floatingPanel: isLightTheme ? "absolute right-0 top-[calc(100%+10px)] z-30 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]" : "absolute right-0 top-[calc(100%+10px)] z-30 w-40 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-2 shadow-2xl",
    rolePanel: isLightTheme ? "absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)]" : "absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-2 shadow-2xl",
    removeButton: isLightTheme ? "rounded-full border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition shrink-0 shadow-sm" : "rounded-full border border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-red-400/40 hover:bg-red-500/10 flex items-center justify-center transition shrink-0",
  }), [isLightTheme]);

  const adminTheme = useMemo(() => ({
    heading: isLightTheme ? "text-slate-900" : "text-white",
    bodyText: isLightTheme ? "text-slate-600" : "text-gray-300",
    mutedText: isLightTheme ? "text-slate-500" : "text-gray-400",
    sectionDivider: isLightTheme ? "border-slate-200" : "border-gray-700",
    loginCard: isLightTheme ? "max-w-md mx-auto mt-10 bg-white rounded-xl p-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.12)] border border-slate-200" : "max-w-md mx-auto mt-10 bg-gray-800 rounded-xl p-8 text-center shadow-xl border border-gray-700",
    loginTitle: isLightTheme ? "text-2xl font-bold text-slate-900 mb-6" : "text-2xl font-bold text-white mb-6",
    loginInput: isLightTheme ? "w-full bg-white text-slate-900 rounded-lg px-4 py-3 text-center border border-slate-300 focus:border-emerald-500 outline-none shadow-sm" : "w-full bg-gray-900 text-white rounded-lg px-4 py-3 text-center border border-gray-600 focus:border-green-500 outline-none",
    loginButton: isLightTheme ? "w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center justify-center shadow-[0_14px_30px_rgba(22,163,74,0.18)]" : "w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition flex items-center justify-center shadow-lg",
    shell: isLightTheme ? "max-w-3xl mx-auto space-y-8" : "max-w-3xl mx-auto space-y-8",
    activityCard: isLightTheme ? "bg-white rounded-xl p-5 border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4" : "bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4",
    tabBar: isLightTheme ? "flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.08)]" : "flex gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-700",
    tabActive: isLightTheme ? "bg-slate-900 text-white shadow-md border border-slate-900" : "bg-gray-700 text-white shadow-md border border-gray-600",
    tabInactive: isLightTheme ? "text-slate-500 hover:text-slate-900 hover:bg-slate-50" : "text-gray-400 hover:text-white hover:bg-gray-800",
    sectionCard: isLightTheme ? "bg-white rounded-xl p-6 border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg",
    rowCard: isLightTheme ? "flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-lg" : "flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-900 border border-gray-700 p-3 rounded-lg",
    compactInput: isLightTheme ? "flex-1 bg-white text-sm text-slate-900 px-3 py-1.5 rounded border border-slate-300 focus:border-indigo-500 outline-none" : "flex-1 bg-gray-800 text-sm text-white px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 outline-none",
    input: isLightTheme ? "w-full bg-white text-slate-900 rounded-lg px-4 py-3 border border-slate-300 focus:border-indigo-500 outline-none shadow-sm" : "w-full bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 outline-none",
    textarea: isLightTheme ? "w-full h-48 bg-white text-slate-900 rounded-lg px-4 py-3 border border-slate-300 focus:border-indigo-500 outline-none resize-none custom-scrollbar shadow-sm" : "w-full h-48 bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 outline-none resize-none custom-scrollbar",
    neutralButton: isLightTheme ? "px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded transition whitespace-nowrap border border-slate-200 shadow-sm" : "px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded transition whitespace-nowrap",
    ghostButton: isLightTheme ? "flex items-center text-sm bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:text-blue-800 px-3 py-1.5 rounded transition shadow-sm" : "flex items-center text-sm bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition",
    dangerButton: isLightTheme ? "flex items-center text-sm bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 hover:text-rose-800 px-3 py-1.5 rounded transition shadow-sm" : "flex items-center text-sm bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition",
    warningPanel: isLightTheme ? "bg-amber-50 border border-amber-200 rounded-xl p-6" : "bg-purple-900/30 border border-purple-700/50 rounded-xl p-6",
    dangerPanel: isLightTheme ? "bg-rose-50 border border-rose-200 rounded-xl p-6" : "bg-red-900/30 border border-red-700/50 rounded-xl p-6",
  }), [isLightTheme]);

  const globalThemeStyles = useMemo(() => (
    `
      [data-theme="light"] {
        --app-selection-bg: rgba(79, 70, 229, 0.16);
        --app-selection-color: #0f172a;
        --app-scrollbar-thumb: rgba(100, 116, 139, 0.36);
        --app-scrollbar-thumb-hover: rgba(79, 70, 229, 0.46);
        --app-scrollbar-track: rgba(241, 245, 249, 0.95);
        --app-focus-ring: rgba(79, 70, 229, 0.34);
      }

      [data-theme="dark"] {
        --app-selection-bg: rgba(74, 222, 128, 0.22);
        --app-selection-color: #f8fafc;
        --app-scrollbar-thumb: rgba(71, 85, 105, 0.72);
        --app-scrollbar-thumb-hover: rgba(34, 197, 94, 0.48);
        --app-scrollbar-track: rgba(15, 23, 42, 0.88);
        --app-focus-ring: rgba(74, 222, 128, 0.34);
      }

      [data-theme] ::selection {
        background: var(--app-selection-bg);
        color: var(--app-selection-color);
      }

      [data-theme] .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: var(--app-scrollbar-thumb) var(--app-scrollbar-track);
      }

      [data-theme] .custom-scrollbar::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      [data-theme] .custom-scrollbar::-webkit-scrollbar-track {
        background: var(--app-scrollbar-track);
        border-radius: 9999px;
      }

      [data-theme] .custom-scrollbar::-webkit-scrollbar-thumb {
        background: var(--app-scrollbar-thumb);
        border-radius: 9999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      [data-theme] .custom-scrollbar:hover::-webkit-scrollbar-thumb {
        background: var(--app-scrollbar-thumb-hover);
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      [data-theme] button,
      [data-theme] a,
      [data-theme] input,
      [data-theme] textarea,
      [data-theme] select {
        transition-property: background-color, color, border-color, box-shadow, opacity, transform;
        transition-duration: 180ms;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }

      [data-theme] button:focus-visible,
      [data-theme] a:focus-visible,
      [data-theme] input:focus-visible,
      [data-theme] textarea:focus-visible,
      [data-theme] select:focus-visible {
        outline: 2px solid var(--app-focus-ring);
        outline-offset: 2px;
      }

      [data-theme] input[type="date"],
      [data-theme] input[type="time"] {
        color-scheme: ${isLightTheme ? "light" : "dark"};
      }

      @media (max-width: 768px) {
        [data-theme] .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
      }
    `
  ), [isLightTheme]);

  const sortedWowRoster = useMemo(() => {
    let filteredItems = wowRoster;
    if (showWowRaidApplicantsOnly) {
      filteredItems = filteredItems.filter((member) => member.isRaidApplied);
    }
    if (selectedJobFilter !== "전체") {
      filteredItems = filteredItems.filter((member) => member.jobClass === selectedJobFilter);
    }
    if (!selectedWowSpecFilters.includes("전체")) {
      filteredItems = filteredItems.filter((member) => matchesWowSpecFilters(member.jobClass, member.availableSpecs, selectedWowSpecFilters));
    }
    if (!selectedWowPositionFilters.includes("전체")) {
      filteredItems = filteredItems.filter((member) => matchesPreferredPositionFilters(member.preferredPositions, selectedWowPositionFilters));
    }

    const sortableItems = [...filteredItems];
    sortableItems.sort((a, b) => {
      if (a[wowSortConfig.key] < b[wowSortConfig.key]) return wowSortConfig.direction === 'asc' ? -1 : 1;
      if (a[wowSortConfig.key] > b[wowSortConfig.key]) return wowSortConfig.direction === 'asc' ? 1 : -1;
      return a.streamerName.localeCompare(b.streamerName, 'ko');
    });
    return sortableItems;
  }, [wowRoster, wowSortConfig, selectedJobFilter, selectedWowSpecFilters, selectedWowPositionFilters, showWowRaidApplicantsOnly]);

  const requestWowSort = (key) => {
    let direction = 'desc'; 
    if (wowSortConfig && wowSortConfig.key === key && wowSortConfig.direction === 'desc') direction = 'asc'; 
    setWowSortConfig({ key, direction });
  };

  const wowJobStats = useMemo(() => {
    const stats = { "전체": wowRoster.length };
    wowRoster.forEach((member) => {
      stats[member.jobClass] = (stats[member.jobClass] || 0) + 1;
    });
    const sortedJobs = Object.keys(stats)
      .filter((key) => key !== "전체")
      .sort((a, b) => stats[b] - stats[a]);
    return { stats, sortedJobs: ["전체", ...sortedJobs] };
  }, [wowRoster]);

  const wowAvailableSpecOptions = useMemo(() => (
    selectedJobFilter === "전체" ? [] : getWowSpecOptions(selectedJobFilter)
  ), [selectedJobFilter]);

  const wowPositionStats = useMemo(() => {
    const stats = { 전체: wowRoster.length, tank: 0, meleeDealer: 0, rangedDealer: 0, heal: 0 };
    wowRoster.forEach((member) => {
      normalizePreferredPositions(member.preferredPositions).forEach((positionId) => {
        stats[positionId] = (stats[positionId] || 0) + 1;
      });
    });
    return { stats, orderedIds: WOW_POSITION_OPTIONS.map((option) => option.id) };
  }, [wowRoster]);

  useEffect(() => {
    setWowPartnerGenerationInputs((prev) => {
      const validMemberIds = new Set(wowRoster.map((member) => member.id));
      const next = {};
      Object.entries(prev).forEach(([memberId, value]) => {
        if (validMemberIds.has(memberId)) next[memberId] = value;
      });
      return next;
    });
  }, [wowRoster]);

  useEffect(() => {
    if (selectedJobFilter === "전체") {
      if (!selectedWowSpecFilters.includes("전체")) setSelectedWowSpecFilters(["전체"]);
      return;
    }
    if (selectedWowSpecFilters.includes("전체")) return;
    const filtered = selectedWowSpecFilters.filter((specId) => wowAvailableSpecOptions.includes(specId));
    if (filtered.length !== selectedWowSpecFilters.length) {
      setSelectedWowSpecFilters(filtered.length ? filtered : ["전체"]);
    }
  }, [selectedJobFilter, wowAvailableSpecOptions, selectedWowSpecFilters]);

  const raidAvailableSpecOptions = useMemo(() => {
    const selectedJobs = raidSelectedJobFilters.includes("전체") ? [] : raidSelectedJobFilters;
    return [...new Set(selectedJobs.flatMap((jobClass) => getWowSpecOptions(jobClass)))];
  }, [raidSelectedJobFilters]);

  useEffect(() => {
    if (raidSelectedJobFilters.includes("전체") || raidSelectedJobFilters.length === 0) {
      if (!raidSelectedSpecFilters.includes("전체")) setRaidSelectedSpecFilters(["전체"]);
      return;
    }
    if (raidSelectedSpecFilters.includes("전체")) return;
    const filtered = raidSelectedSpecFilters.filter((specId) => raidAvailableSpecOptions.includes(specId));
    if (filtered.length !== raidSelectedSpecFilters.length) {
      setRaidSelectedSpecFilters(filtered.length ? filtered : ["전체"]);
    }
  }, [raidSelectedJobFilters, raidAvailableSpecOptions, raidSelectedSpecFilters]);

  const raidConfig = useMemo(() => getRaidConfig(raidType), [raidType]);

  const sortedFixedRaidMembers = useMemo(() => (
    [...fixedRaidMembers].sort((a, b) => (a.streamerName || "").localeCompare(b.streamerName || "", "ko"))
  ), [fixedRaidMembers]);

  const matchesWowRaidSearch = (target, keyword) => {
    const normalizedKeyword = (keyword || "").trim().toLowerCase();
    if (!normalizedKeyword) return true;
    const searchable = [
      target?.streamerName,
      target?.displayName,
      target?.wowNickname,
      target?.jobClass,
      target?.mainSpec,
      ...(Array.isArray(target?.availableSpecs) ? target.availableSpecs : []),
      ...(Array.isArray(target?.preferredPositions) ? target.preferredPositions : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchable.includes(normalizedKeyword);
  };

  const wowRaidPublishedList = useMemo(() => (
    wowRaids.filter((raid) => raid.isPublished).sort((a, b) => {
      const createdA = new Date(a.createdAt || a.raidDate || 0).getTime();
      const createdB = new Date(b.createdAt || b.raidDate || 0).getTime();
      if (createdA !== createdB) return createdA - createdB;
      const groupA = Number(a.raidGroupNumber || 9999);
      const groupB = Number(b.raidGroupNumber || 9999);
      if (groupA !== groupB) return groupA - groupB;
      return (a.raidName || '').localeCompare(b.raidName || '', 'ko');
    })
  ), [wowRaids]);

  const filteredWowRaidPublishedList = useMemo(() => (
    wowRaidPublishedList.filter((raid) => {
      const groupNum = Number(raid.raidGroupNumber || 0);
      if (wowRaidGroupFilter === 'all') return true;
      if (wowRaidGroupFilter === '1') return groupNum === 1;
      if (wowRaidGroupFilter === '2') return groupNum === 2;
      if (wowRaidGroupFilter === 'other') return groupNum !== 1 && groupNum !== 2;
      return true;
    })
  ), [wowRaidPublishedList, wowRaidGroupFilter]);

  const selectedWowRaid = useMemo(() => {
    const source = wowRaids.find((raid) => raid.id === selectedWowRaidId) || wowRaidPublishedList.find((raid) => raid.id === selectedWowRaidId);
    return source || null;
  }, [wowRaids, wowRaidPublishedList, selectedWowRaidId]);

  const wowRaidFormParticipants = useMemo(() => {
    const rosterSnapshots = wowRaidForm.rosterParticipantIds
      .map((memberId) => wowRoster.find((member) => member.id === memberId))
      .filter(Boolean)
      .map((member) => createWowRaidParticipantSnapshot(member, 'wow_roster'));

    const fixedSnapshots = wowRaidForm.fixedParticipantIds
      .map((memberId) => fixedRaidMembers.find((member) => member.id === memberId))
      .filter(Boolean)
      .map((member) => createWowRaidParticipantSnapshot(member, 'fixed_member'));

    const guestSnapshots = (wowRaidForm.guestParticipants || []).map((participant) => createWowRaidGuestParticipantSnapshot(participant));

    return [...rosterSnapshots, ...fixedSnapshots, ...guestSnapshots].sort((a, b) => (a.streamerName || '').localeCompare(b.streamerName || '', 'ko'));
  }, [wowRaidForm.rosterParticipantIds, wowRaidForm.fixedParticipantIds, wowRaidForm.guestParticipants, wowRoster, fixedRaidMembers]);

  const filteredWowRaidRosterCandidates = useMemo(() => (
    [...wowRoster]
      .sort((a, b) => (a.streamerName || '').localeCompare(b.streamerName || '', 'ko'))
      .filter((member) => matchesWowRaidSearch(member, wowRaidRosterSearchInput))
  ), [wowRoster, wowRaidRosterSearchInput]);

  const filteredWowRaidFixedCandidates = useMemo(() => (
    sortedFixedRaidMembers.filter((member) => matchesWowRaidSearch(member, wowRaidFixedSearchInput))
  ), [sortedFixedRaidMembers, wowRaidFixedSearchInput]);

  const filteredWowRaidGuestParticipants = useMemo(() => (
    (wowRaidForm.guestParticipants || []).filter((participant) => matchesWowRaidSearch({
      streamerName: participant.displayName,
      displayName: participant.displayName,
      wowNickname: participant.wowNickname,
      jobClass: participant.jobClass,
      mainSpec: participant.mainSpec,
      availableSpecs: participant.availableSpecs,
      preferredPositions: participant.preferredPositions,
    }, wowRaidGuestSearchInput))
  ), [wowRaidForm.guestParticipants, wowRaidGuestSearchInput]);

  const filteredWowRaidStatParticipants = useMemo(() => (
    wowRaidFormParticipants.filter((participant) => matchesWowRaidSearch(participant, wowRaidStatSearchInput))
  ), [wowRaidFormParticipants, wowRaidStatSearchInput]);

  useEffect(() => {
    if (selectedWowRaidId && !wowRaids.some((raid) => raid.id === selectedWowRaidId) && !wowRaidPublishedList.some((raid) => raid.id === selectedWowRaidId)) {
      setSelectedWowRaidId(null);
      setWowRaidDetailTab('participants');
    }
  }, [selectedWowRaidId, wowRaids, wowRaidPublishedList]);

  const currentFixedRaidMember = useMemo(() => {
    if (selectedFixedRaidMemberOptionId === DEFAULT_FIXED_RAID_MEMBER_OPTION_ID) {
      return GUILD_MASTER_MEMBER;
    }

    const matchedMember = fixedRaidMembers.find((member) => member.id === selectedFixedRaidMemberOptionId);
    if (!matchedMember) {
      return GUILD_MASTER_MEMBER;
    }

    return {
      ...matchedMember,
      id: GUILD_MASTER_ID,
      wowNickname: matchedMember.wowNickname || matchedMember.streamerName || "고정 길드원",
      isGuildMaster: false,
      isFixedRaidMember: true,
    };
  }, [fixedRaidMembers, selectedFixedRaidMemberOptionId]);

  const raidMemberMap = useMemo(() => {
    const mappedRoster = wowRoster.reduce((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
    mappedRoster[GUILD_MASTER_ID] = currentFixedRaidMember;
    return mappedRoster;
  }, [wowRoster, currentFixedRaidMember]);

  const raidAssignedPositions = useMemo(() => {
    const positions = {};
    raidAssignments.forEach((group, groupIndex) => {
      group.forEach((memberId, slotIndex) => {
        if (memberId) positions[memberId] = { groupIndex, slotIndex };
      });
    });
    return positions;
  }, [raidAssignments]);

  const raidAssignedMembers = useMemo(() => (
    raidAssignments
      .flat()
      .filter(Boolean)
      .map((memberId) => raidMemberMap[memberId])
      .filter(Boolean)
  ), [raidAssignments, raidMemberMap]);

  const raidSelectedMember = selectedRaidMemberId ? raidMemberMap[selectedRaidMemberId] : null;

  const raidEligibleRoster = useMemo(() => (
    wowRoster.filter((member) => member.isRaidApplied && matchesRaidLevelFilter(member.level, raidSelectedLevelFilters))
  ), [wowRoster, raidSelectedLevelFilters]);

  const raidJobStats = useMemo(() => {
    const stats = { "전체": raidEligibleRoster.length };
    raidEligibleRoster.forEach((member) => {
      stats[member.jobClass] = (stats[member.jobClass] || 0) + 1;
    });
    const sortedJobs = Object.keys(stats)
      .filter((key) => key !== "전체")
      .sort((a, b) => stats[b] - stats[a]);
    return { stats, sortedJobs: ["전체", ...sortedJobs] };
  }, [raidEligibleRoster]);

  const raidPositionStats = useMemo(() => {
    const stats = { 전체: raidEligibleRoster.length, tank: 0, meleeDealer: 0, rangedDealer: 0, heal: 0 };
    raidEligibleRoster.forEach((member) => {
      normalizePreferredPositions(member.preferredPositions).forEach((positionId) => {
        stats[positionId] = (stats[positionId] || 0) + 1;
      });
    });
    return { stats, orderedIds: WOW_POSITION_OPTIONS.map((option) => option.id) };
  }, [raidEligibleRoster]);

  const raidAvailableMembers = useMemo(() => {
    let items = raidEligibleRoster.filter((member) => !raidAssignedPositions[member.id]);

    const isAllJobsSelected = raidSelectedJobFilters.includes("전체") || raidSelectedJobFilters.length === 0;
    if (!isAllJobsSelected) {
      items = items.filter((member) => raidSelectedJobFilters.includes(member.jobClass));
    }

    const isAllPositionsSelected = raidSelectedPositionFilters.includes("전체") || raidSelectedPositionFilters.length === 0;
    if (!raidSelectedSpecFilters.includes("전체")) {
      items = items.filter((member) => matchesWowSpecFilters(member.jobClass, member.availableSpecs, raidSelectedSpecFilters));
    }

    if (!isAllPositionsSelected) {
      items = items.filter((member) => matchesPreferredPositionFilters(member.preferredPositions, raidSelectedPositionFilters));
    }

    if (raidSearchInput.trim()) {
      const term = raidSearchInput.toLowerCase();
      items = items.filter((member) =>
        (member.streamerName || "").toLowerCase().includes(term) ||
        (member.wowNickname || "").toLowerCase().includes(term) ||
        (member.jobClass || "").toLowerCase().includes(term) ||
        normalizeAvailableSpecs(member.jobClass, member.availableSpecs).some((spec) => spec.toLowerCase().includes(term)) ||
        normalizePreferredPositions(member.preferredPositions).some((positionId) => getWowPositionLabel(positionId).toLowerCase().includes(term) || getWowPositionShortLabel(positionId).toLowerCase().includes(term))
      );
    }

    return [...items].sort((a, b) => {
      if ((Number(b.level) || 0) !== (Number(a.level) || 0)) return (Number(b.level) || 0) - (Number(a.level) || 0);
      return (a.streamerName || "").localeCompare(b.streamerName || "", "ko");
    });
  }, [raidEligibleRoster, raidAssignedPositions, raidSelectedJobFilters, raidSelectedSpecFilters, raidSelectedPositionFilters, raidSearchInput]);


  const buskingEligibleMembers = useMemo(() => (
    applyBuskingVoteCounts(
      [...wowRoster].filter((member) => Number(member.level) >= 40),
      buskingShardCounts
    ).sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.streamerName.localeCompare(b.streamerName, "ko");
    })
  ), [wowRoster, buskingShardCounts]);

  const buskingSourceRoster = useMemo(() => (
    activeTab === "busking" ? buskingPublicRoster : wowRoster
  ), [activeTab, buskingPublicRoster, wowRoster]);

  const buskingParticipants = useMemo(() => (
    sortBuskingParticipants(
      applyBuskingVoteCounts(
        [...buskingSourceRoster].filter((member) => Number(member.level) >= 40 && member.isBuskingParticipant),
        buskingShardCounts
      )
    )
  ), [buskingSourceRoster, buskingShardCounts]);

  const buskingTopMembers = useMemo(() => buskingParticipants.slice(0, 3), [buskingParticipants]);
  const buskingTotalVotes = useMemo(() => (
    Object.values(buskingShardCounts).reduce((sum, count) => sum + (Number(count) || 0), 0)
  ), [buskingShardCounts]);
  const buskingLeader = buskingParticipants[0] || null;

  const raidAssignedPositionStats = useMemo(() => {
    const stats = { tank: 0, meleeDealer: 0, rangedDealer: 0, heal: 0, undecided: 0 };
    raidAssignedMembers.forEach((member) => {
      if (!member?.id || member.isGuildMaster) return;
      const assignedPosition = raidAssignedPreferredPositions[member.id];
      if (assignedPosition && WOW_POSITION_IDS.includes(assignedPosition)) {
        stats[assignedPosition] += 1;
        return;
      }
      stats.undecided += 1;
    });
    return stats;
  }, [raidAssignedMembers, raidAssignedPreferredPositions]);

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
    setRaidAssignments((prev) => resizeRaidLayout(prev, raidConfig.groupCount, GUILD_MASTER_ID));
  }, [raidConfig.groupCount]);

  useEffect(() => {
    const assignedMemberIds = new Set(raidAssignedMembers.map((member) => member?.id).filter(Boolean));
    setRaidRoleAssignments((prev) => {
      let changed = false;
      const next = {};

      Object.entries(prev).forEach(([memberId, roles]) => {
        const safeRoles = Array.isArray(roles) ? roles.filter((roleId) => RAID_ROLE_OPTIONS.some((role) => role.id === roleId)) : [];
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
    setRaidAssignedPreferredPositions((prev) => {
      let changed = false;
      const next = {};

      raidAssignedMembers.forEach((member) => {
        if (!member?.id || member.isGuildMaster) return;
        const preferredPositions = normalizePreferredPositions(member.preferredPositions);
        const currentAssignedPosition = prev[member.id];

        if (currentAssignedPosition && WOW_POSITION_IDS.includes(currentAssignedPosition)) {
          next[member.id] = currentAssignedPosition;
          return;
        }

        if (preferredPositions.length > 0) {
          next[member.id] = preferredPositions[0];
          if (currentAssignedPosition !== preferredPositions[0]) changed = true;
          return;
        }

        if (currentAssignedPosition !== undefined) changed = true;
      });

      if (!changed) {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        if (prevKeys.length !== nextKeys.length) {
          changed = true;
        } else {
          changed = nextKeys.some((key) => prev[key] !== next[key]);
        }
      }

      return changed ? next : prev;
    });
  }, [raidAssignedMembers]);

  useEffect(() => {
    if (!raidRoleMenuSlotKey && !raidPositionMenuSlotKey && !isRaidRoleGuideOpen) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest('[data-raid-floating-layer="true"]')) return;
      setRaidRoleMenuSlotKey(null);
      setRaidPositionMenuSlotKey(null);
      setIsRaidRoleGuideOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [raidRoleMenuSlotKey, raidPositionMenuSlotKey, isRaidRoleGuideOpen]);

  useEffect(() => {
    const currentRoundId = buskingSettings.roundId || "wow-busking-default";
    try {
      const stored = JSON.parse(localStorage.getItem(BUSKING_VOTE_STORAGE_KEY) || "{}");
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

  const handleRaidPositionFilterToggle = (positionId) => {
    if (positionId === "전체") {
      setRaidSelectedPositionFilters(["전체"]);
      return;
    }

    setRaidSelectedPositionFilters((prev) => {
      const current = prev.includes("전체") ? [] : prev;
      const next = current.includes(positionId)
        ? current.filter((item) => item !== positionId)
        : [...current, positionId];

      return next.length ? next : ["전체"];
    });
  };

  const handleRaidSpecFilterToggle = (specId) => {
    if (specId === "전체") {
      setRaidSelectedSpecFilters(["전체"]);
      return;
    }

    setRaidSelectedSpecFilters((prev) => {
      const current = prev.includes("전체") ? [] : prev;
      const next = current.includes(specId)
        ? current.filter((item) => item !== specId)
        : [...current, specId];

      const filteredNext = next.filter((item) => raidAvailableSpecOptions.includes(item));
      return filteredNext.length ? filteredNext : ["전체"];
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

  const handleSelectRaidAssignedPosition = (memberId, positionId) => {
    setRaidAssignedPreferredPositions((prev) => {
      const next = { ...prev };
      if (positionId && WOW_POSITION_IDS.includes(positionId)) {
        next[memberId] = positionId;
      } else {
        delete next[memberId];
      }
      return next;
    });
  };

  const handleToggleFixedRaidMemberPreferredPosition = (positionId) => {
    setFixedRaidMemberForm((prev) => {
      const current = Array.isArray(prev.preferredPositions) ? prev.preferredPositions : [];
      const nextPositions = current.includes(positionId)
        ? current.filter((item) => item !== positionId)
        : [...current, positionId];
      return { ...prev, preferredPositions: nextPositions };
    });
  };

  const resetFixedRaidMemberForm = () => {
    setFixedRaidMemberForm({ streamerName: "", jobClass: "", level: "60", imageUrl: "", preferredPositions: [], mainSpec: "", availableSpecs: [] });
  };

  const handleSaveFixedRaidMember = async (event) => {
    event.preventDefault();
    if (!user) return;

    const streamerName = (fixedRaidMemberForm.streamerName || "").trim();
    const jobClass = (fixedRaidMemberForm.jobClass || "").trim();
    const imageUrl = (fixedRaidMemberForm.imageUrl || "").trim();
    const level = Math.max(1, Math.min(70, Number(fixedRaidMemberForm.level) || 60));
    const preferredPositions = normalizePreferredPositions(fixedRaidMemberForm.preferredPositions);
    const fixedSpecState = normalizeWowSpecState(jobClass, fixedRaidMemberForm.mainSpec, fixedRaidMemberForm.availableSpecs);

    if (!streamerName || !jobClass) {
      showToast("고정 길드원의 이름과 직업을 입력해주세요.", "error");
      return;
    }

    setIsFixedRaidMemberSaving(true);
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "fixed_raid_members"), {
        streamerName,
        wowNickname: streamerName,
        jobClass,
        level,
        imageUrl,
        preferredPositions,
        mainSpec: fixedSpecState.mainSpec,
        availableSpecs: fixedSpecState.availableSpecs,
        createdAt: Date.now(),
      });
      resetFixedRaidMemberForm();
      showToast("고정 길드원을 등록했습니다.");
    } catch (error) {
      showToast("고정 길드원을 등록하지 못했습니다.", "error");
    } finally {
      setIsFixedRaidMemberSaving(false);
    }
  };

  const handleDeleteFixedRaidMember = async (memberId) => {
    if (!user || !window.confirm("이 고정 길드원을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "fixed_raid_members", memberId));
      const shouldResetAppliedMember = selectedFixedRaidMemberOptionId === memberId || raidPublicSettings.activeFixedRaidMemberOptionId === memberId;
      if (shouldResetAppliedMember) {
        await setDoc(
          doc(db, "artifacts", appId, "public", "data", "settings", "raid"),
          {
            activeFixedRaidMemberOptionId: DEFAULT_FIXED_RAID_MEMBER_OPTION_ID,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
        setSelectedFixedRaidMemberOptionId(DEFAULT_FIXED_RAID_MEMBER_OPTION_ID);
        setRaidRoleAssignments((prev) => {
          if (!prev[GUILD_MASTER_ID]) return prev;
          const next = { ...prev };
          delete next[GUILD_MASTER_ID];
          return next;
        });
        setRaidAssignedPreferredPositions((prev) => {
          if (!prev[GUILD_MASTER_ID]) return prev;
          const next = { ...prev };
          delete next[GUILD_MASTER_ID];
          return next;
        });
      }
      showToast("고정 길드원을 삭제했습니다.");
    } catch (error) {
      showToast("고정 길드원을 삭제하지 못했습니다.", "error");
    }
  };

  const handleSelectFixedRaidMemberOption = (optionId) => {
    setSelectedFixedRaidMemberOptionId(optionId);
    setIsRaidFixedMemberMenuOpen(false);
    setSelectedRaidMemberId(null);
    setRaidRoleMenuSlotKey(null);
    setRaidPositionMenuSlotKey(null);
    setRaidRoleAssignments((prev) => {
      if (!prev[GUILD_MASTER_ID]) return prev;
      const next = { ...prev };
      delete next[GUILD_MASTER_ID];
      return next;
    });
    setRaidAssignedPreferredPositions((prev) => {
      if (!prev[GUILD_MASTER_ID]) return prev;
      const next = { ...prev };
      delete next[GUILD_MASTER_ID];
      return next;
    });
    showToast(optionId === DEFAULT_FIXED_RAID_MEMBER_OPTION_ID ? "고정 길드원을 길드장 우왁굳으로 변경했습니다." : "고정 길드원을 변경했습니다.");
  };

  const handleApplyFixedRaidMemberGlobally = async (optionId) => {
    if (!user) return;

    const nextOptionId = optionId || DEFAULT_FIXED_RAID_MEMBER_OPTION_ID;
    try {
      await setDoc(
        doc(db, "artifacts", appId, "public", "data", "settings", "raid"),
        {
          activeFixedRaidMemberOptionId: nextOptionId,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      handleSelectFixedRaidMemberOption(nextOptionId);
      showToast(nextOptionId === DEFAULT_FIXED_RAID_MEMBER_OPTION_ID ? "기본 고정 길드원을 레이드에 적용했습니다." : "고정 길드원을 레이드에 적용했습니다.");
    } catch (error) {
      showToast("고정 길드원을 레이드에 적용하지 못했습니다.", "error");
    }
  };

  const handleJobFilterClick = (job) => {
    setSelectedJobFilter(job);
    setWowSortConfig({ key: 'level', direction: 'desc' });
  };

  const handleWowPositionFilterToggle = (positionId) => {
    if (positionId === "전체") {
      setSelectedWowPositionFilters(["전체"]);
      return;
    }

    setSelectedWowPositionFilters((prev) => {
      const current = prev.includes("전체") ? [] : prev;
      const next = current.includes(positionId)
        ? current.filter((item) => item !== positionId)
        : [...current, positionId];

      return next.length ? next : ["전체"];
    });
  };

  const handleWowSpecFilterToggle = (specId) => {
    if (specId === "전체") {
      setSelectedWowSpecFilters(["전체"]);
      return;
    }
    setSelectedWowSpecFilters((prev) => {
      const current = prev.includes("전체") ? [] : prev;
      const next = current.includes(specId)
        ? current.filter((item) => item !== specId)
        : [...current, specId];
      return next.length ? next : ["전체"];
    });
  };

  useEffect(() => {
    if (!wowSearchInput.trim()) {
      setWowSearchResults([]);
      setCurrentWowSearchIndex(-1);
      return;
    }
    const term = wowSearchInput.toLowerCase();
    const results = sortedWowRoster.filter((member) =>
      member.streamerName.toLowerCase().includes(term) ||
      member.wowNickname.toLowerCase().includes(term) ||
      member.jobClass.toLowerCase().includes(term) ||
      normalizeAvailableSpecs(member.jobClass, member.availableSpecs).some((spec) => spec.toLowerCase().includes(term)) ||
      normalizePreferredPositions(member.preferredPositions).some((positionId) => getWowPositionLabel(positionId).toLowerCase().includes(term) || getWowPositionShortLabel(positionId).toLowerCase().includes(term))
    );
    setWowSearchResults(results);
  }, [wowSearchInput, sortedWowRoster]);

  const scrollToWowMember = (memberId) => {
    const element = document.getElementById(`wow-member-${memberId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const prevIndex = currentWowSearchIndex <= 0 ? wowSearchResults.length - 1 : currentWowSearchIndex - 1;
    setCurrentWowSearchIndex(prevIndex);
    scrollToWowMember(wowSearchResults[prevIndex].id);
    setShowWowSearchDropdown(false);
  };

  const handleWowSearchSelect = (member) => {
    setShowWowSearchDropdown(false);
    const idx = wowSearchResults.findIndex(m => m.id === member.id);
    if (idx !== -1) setCurrentWowSearchIndex(idx);
    scrollToWowMember(member.id);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleWowJobClassChange = (jobClass) => {
    setWowJobClass(jobClass);
    const nextSpecState = normalizeWowSpecState(jobClass, "", []);
    setWowAvailableSpecsSelection(nextSpecState.availableSpecs);
    setWowMainSpec(nextSpecState.mainSpec);
  };

  const handleToggleWowFormAvailableSpec = (specId) => {
    setWowAvailableSpecsSelection((prev) => {
      const nextAvailableSpecs = prev.includes(specId)
        ? prev.filter((item) => item !== specId)
        : [...prev, specId];
      const nextSpecState = normalizeWowSpecState(wowJobClass, wowMainSpec, nextAvailableSpecs);
      setWowMainSpec(nextSpecState.mainSpec);
      return nextSpecState.availableSpecs;
    });
  };

  const handleSelectWowMainSpecLocal = (specId) => {
    const nextAvailableSpecs = wowAvailableSpecsSelection.includes(specId)
      ? wowAvailableSpecsSelection
      : [...wowAvailableSpecsSelection, specId];
    const nextSpecState = normalizeWowSpecState(wowJobClass, specId, nextAvailableSpecs);
    setWowAvailableSpecsSelection(nextSpecState.availableSpecs);
    setWowMainSpec(nextSpecState.mainSpec);
  };

  const handleFixedRaidMemberJobClassChange = (jobClass) => {
    setFixedRaidMemberForm((prev) => ({
      ...prev,
      jobClass,
      mainSpec: "",
      availableSpecs: [],
    }));
  };

  const handleToggleFixedRaidMemberAvailableSpec = (specId) => {
    setFixedRaidMemberForm((prev) => {
      const nextAvailableSpecs = prev.availableSpecs.includes(specId)
        ? prev.availableSpecs.filter((item) => item !== specId)
        : [...prev.availableSpecs, specId];
      const nextSpecState = normalizeWowSpecState(prev.jobClass, prev.mainSpec, nextAvailableSpecs);
      return { ...prev, availableSpecs: nextSpecState.availableSpecs, mainSpec: nextSpecState.mainSpec };
    });
  };

  const handleSelectFixedRaidMemberMainSpec = (specId) => {
    setFixedRaidMemberForm((prev) => {
      const nextAvailableSpecs = prev.availableSpecs.includes(specId)
        ? prev.availableSpecs
        : [...prev.availableSpecs, specId];
      const nextSpecState = normalizeWowSpecState(prev.jobClass, specId, nextAvailableSpecs);
      return { ...prev, availableSpecs: nextSpecState.availableSpecs, mainSpec: nextSpecState.mainSpec };
    });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (APP_TAB_IDS.includes(hash)) setActiveTab(hash);
      else setActiveTab("home");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const normalizedTheme = normalizeAppTheme(theme);

    try {
      localStorage.setItem(APP_THEME_STORAGE_KEY, normalizedTheme);
    } catch (error) {}

    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = normalizedTheme;
      document.documentElement.style.colorScheme = normalizedTheme;
      document.body?.setAttribute("data-theme", normalizedTheme);
    }
  }, [theme]);

  const navigateTo = (tabName) => {
    window.location.hash = tabName;
  };

  const handleWowSectionNavigation = (tabId, { closeMobileMenu = false } = {}) => {
    navigateTo(tabId);
    setIsWowNavMenuOpen(false);

    if (closeMobileMenu) {
      setIsMobileWowMenuOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    setIsWowNavMenuOpen(false);
    setIsMobileWowMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (isMobileMenuOpen) return;
    setIsMobileWowMenuOpen(false);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isWowNavMenuOpen && !isMobileWowMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest('[data-wow-nav-layer="true"]')) return;
      setIsWowNavMenuOpen(false);
      setIsMobileWowMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isWowNavMenuOpen, isMobileWowMenuOpen]);

  useEffect(() => {
    if (activeTab !== "matches" || !selectedMatchId) return;
    const timer = setTimeout(() => {
      const target = document.getElementById(`match-card-${selectedMatchId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [activeTab, selectedMatchId, publishedMatches]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
          try { await signInWithCustomToken(auth, __initial_auth_token); } 
          catch (tokenError) { await signInAnonymously(auth); }
        } else { await signInAnonymously(auth); }
      } catch (error) { console.error(error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const playersRef = collection(db, "artifacts", appId, "public", "data", "players");
    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const draftPlayersRef = collection(db, "artifacts", appId, "public", "data", "draft_players");
    const unsubDraftPlayers = onSnapshot(draftPlayersRef, (snapshot) => {
      setDraftPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const matchesRef = collection(db, "artifacts", appId, "public", "data", "matches");
    const unsubMatches = onSnapshot(matchesRef, (snapshot) => {
        const matchesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        matchesData.sort((a, b) => {
          const dateA = new Date(a.date).getTime(), dateB = new Date(b.date).getTime();
          if (dateA === dateB) return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setMatches(matchesData);
        setIsLoading(false);
      },
      (error) => { console.error(error); setIsLoading(false); }
    );

    const metaRef = doc(db, "artifacts", appId, "public", "data", "metadata", "app_info");
    const unsubMeta = onSnapshot(metaRef, (docSnap) => {
      if (docSnap.exists()) setLastUpdated(docSnap.data().lastUpdated);
    });

    const today = new Date();
    const todayDocId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const visitRef = doc(db, "artifacts", appId, "public", "data", "daily_visits", todayDocId);
    const unsubVisit = onSnapshot(visitRef, (docSnap) => {
      if (docSnap.exists()) setTodayVisits(docSnap.data().count || 0);
    });

    const presenceRef = collection(db, "artifacts", appId, "public", "data", "admin_presence");
    const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
      setRawAdminPresence(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const popupRef = doc(db, "artifacts", appId, "public", "data", "settings", "popup");
    const unsubPopup = onSnapshot(popupRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSitePopup(data);
        if (data.isActive) {
          const hideToken = localStorage.getItem('wak_popup_hidden_today');
          const todayStr = new Date().toISOString().split('T')[0];
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

    return () => { unsubPlayers(); unsubDraftPlayers(); unsubMatches(); unsubMeta(); unsubVisit(); unsubPresence(); unsubPopup(); };
  }, [user]);


  useEffect(() => {
    if (!user) return;
    if (!["wow", "raid", "admin"].includes(activeTab)) return;

    const wowRef = collection(db, "artifacts", appId, "public", "data", "wow_roster");
    const unsubWow = onSnapshot(wowRef, (snapshot) => {
      setWowRoster(snapshot.docs.map((wowDoc) => normalizeWowMember({ id: wowDoc.id, ...wowDoc.data() })));
    });

    return () => unsubWow();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    if (!["raid", "admin"].includes(activeTab)) return;

    const fixedRaidRef = collection(db, "artifacts", appId, "public", "data", "fixed_raid_members");
    const unsubFixedRaidMembers = onSnapshot(fixedRaidRef, (snapshot) => {
      setFixedRaidMembers(snapshot.docs.map((memberDoc) => normalizeFixedRaidMember({ id: memberDoc.id, ...memberDoc.data() })));
    });

    return () => unsubFixedRaidMembers();
  }, [user, activeTab]);


  useEffect(() => {
    if (!user) return;
    if (!["wowraid", "admin"].includes(activeTab)) return;

    const wowRaidRef = collection(db, "artifacts", appId, "public", "data", "wow_raids");
    const unsubWowRaids = onSnapshot(wowRaidRef, (snapshot) => {
      const nextRaids = snapshot.docs
        .map((raidDoc) => normalizeWowRaidDocument({ id: raidDoc.id, ...raidDoc.data() }))
        .sort((a, b) => {
          const dateA = new Date(a.raidDate || a.createdAt || 0).getTime();
          const dateB = new Date(b.raidDate || b.createdAt || 0).getTime();
          if (dateA !== dateB) return dateB - dateA;
          const groupA = Number(a.raidGroupNumber || 9999);
          const groupB = Number(b.raidGroupNumber || 9999);
          if (groupA !== groupB) return groupA - groupB;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
      setWowRaids(nextRaids);
    });

    return () => unsubWowRaids();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;
    if (!["dungeontier", "admin"].includes(activeTab)) return;

    const dungeonTierRef = collection(db, "artifacts", appId, "public", "data", WOW_DUNGEON_TIER_COLLECTION);
    const unsubDungeonTierItems = onSnapshot(dungeonTierRef, (snapshot) => {
      const nextItems = snapshot.docs
        .map((itemDoc) => normalizeWowDungeonTierItem({ id: itemDoc.id, ...itemDoc.data() }))
        .sort((a, b) => {
          const orderA = Number.isFinite(a.displayOrder) ? a.displayOrder : null;
          const orderB = Number.isFinite(b.displayOrder) ? b.displayOrder : null;

          if (orderA !== null && orderB !== null && orderA !== orderB) {
            return orderA - orderB;
          }

          if (orderA !== null && orderB === null) return -1;
          if (orderA === null && orderB !== null) return 1;

          const expansionGap = getWowDungeonExpansionSortOrder(a.expansionType) - getWowDungeonExpansionSortOrder(b.expansionType);
          if (expansionGap !== 0) return expansionGap;

          const nameGap = (a.name || "").localeCompare(b.name || "", "ko");
          if (nameGap !== 0) return nameGap;

          return (a.createdAt || "").localeCompare(b.createdAt || "");
        });

      setWowDungeonTierItems(nextItems);
    });

    return () => unsubDungeonTierItems();
  }, [user, activeTab]);

  useEffect(() => {
    const validItemIds = wowDungeonTierItems.map((item) => item.id).filter(Boolean);
    setWowDungeonTierPlacements((prev) => {
      const normalized = normalizeWowDungeonTierPlacements(prev, validItemIds);
      return areWowDungeonTierPlacementsEqual(prev, normalized) ? prev : normalized;
    });
  }, [wowDungeonTierItems]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        WOW_DUNGEON_TIER_LAYOUT_STORAGE_KEY,
        JSON.stringify(normalizeWowDungeonTierPlacements(wowDungeonTierPlacements))
      );
    } catch (error) {}
  }, [wowDungeonTierPlacements]);

  useEffect(() => {
    if (wowDungeonTierSelectedItemId && !wowDungeonTierItemMap[wowDungeonTierSelectedItemId]) {
      setWowDungeonTierSelectedItemId(null);
    }
  }, [wowDungeonTierSelectedItemId, wowDungeonTierItemMap]);

  useEffect(() => {
    if (wowDungeonTierDetailItemId && !wowDungeonTierItemMap[wowDungeonTierDetailItemId]) {
      setWowDungeonTierDetailItemId(null);
      setWowDungeonTierDetailVideoIndex(0);
    }
  }, [wowDungeonTierDetailItemId, wowDungeonTierItemMap]);

  useEffect(() => {
    if (!wowDungeonTierDetailItemId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setWowDungeonTierDetailItemId(null);
        setWowDungeonTierDetailVideoIndex(0);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setWowDungeonTierDetailVideoIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setWowDungeonTierDetailVideoIndex((prev) => Math.min(prev + 1, wowDungeonTierDetailVideoUrls.length - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [wowDungeonTierDetailItemId, wowDungeonTierDetailVideoUrls.length]);

  useEffect(() => {
    if (!wowDungeonTierDetailItemId) return;

    if (wowDungeonTierDetailVideoUrls.length === 0) {
      setWowDungeonTierDetailItemId(null);
      setWowDungeonTierDetailVideoIndex(0);
      return;
    }

    if (wowDungeonTierDetailVideoIndex >= wowDungeonTierDetailVideoUrls.length) {
      setWowDungeonTierDetailVideoIndex(wowDungeonTierDetailVideoUrls.length - 1);
    }
  }, [wowDungeonTierDetailItemId, wowDungeonTierDetailVideoIndex, wowDungeonTierDetailVideoUrls]);

  useEffect(() => {
    if (!user) return;
    if (!["raid", "admin"].includes(activeTab)) return;

    const raidSettingsRef = doc(db, "artifacts", appId, "public", "data", "settings", "raid");
    const unsubRaidSettings = onSnapshot(raidSettingsRef, (docSnap) => {
      const nextSettings = docSnap.exists()
        ? { activeFixedRaidMemberOptionId: DEFAULT_FIXED_RAID_MEMBER_OPTION_ID, ...docSnap.data() }
        : { activeFixedRaidMemberOptionId: DEFAULT_FIXED_RAID_MEMBER_OPTION_ID };
      setRaidPublicSettings(nextSettings);
    });

    return () => unsubRaidSettings();
  }, [user, activeTab]);

  useEffect(() => {
    setSelectedFixedRaidMemberOptionId(raidPublicSettings.activeFixedRaidMemberOptionId || DEFAULT_FIXED_RAID_MEMBER_OPTION_ID);
  }, [raidPublicSettings.activeFixedRaidMemberOptionId]);

  useEffect(() => {
    if (selectedFixedRaidMemberOptionId === DEFAULT_FIXED_RAID_MEMBER_OPTION_ID) return;
    if (!fixedRaidMembers.some((member) => member.id === selectedFixedRaidMemberOptionId)) {
      setSelectedFixedRaidMemberOptionId(DEFAULT_FIXED_RAID_MEMBER_OPTION_ID);
      setRaidRoleAssignments((prev) => {
        if (!prev[GUILD_MASTER_ID]) return prev;
        const next = { ...prev };
        delete next[GUILD_MASTER_ID];
        return next;
      });
      setRaidAssignedPreferredPositions((prev) => {
        if (!prev[GUILD_MASTER_ID]) return prev;
        const next = { ...prev };
        delete next[GUILD_MASTER_ID];
        return next;
      });
    }
  }, [fixedRaidMembers, selectedFixedRaidMemberOptionId]);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "admin") return;

    const buskingRef = doc(db, "artifacts", appId, "public", "data", "settings", "busking");
    const unsubBusking = onSnapshot(buskingRef, (docSnap) => {
      if (docSnap.exists()) {
        setBuskingSettings({
          isVotingOpen: false,
          roundId: "wow-busking-default",
          startedAt: null,
          endedAt: null,
          noticeUrl: "",
          ...docSnap.data(),
        });
      } else {
        setBuskingSettings({ isVotingOpen: false, roundId: "wow-busking-default", startedAt: null, endedAt: null, noticeUrl: "" });
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
        const summaryRef = doc(db, "artifacts", appId, "public", "data", "settings", BUSKING_PUBLIC_SUMMARY_DOC_ID);
        const settingsRef = doc(db, "artifacts", appId, "public", "data", "settings", "busking");
        const [summarySnap, settingsSnap] = await Promise.all([
          getDoc(summaryRef),
          getDoc(settingsRef),
        ]);

        if (isCancelled) return;

        if (summarySnap.exists()) {
          const summaryData = summarySnap.data();
          const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
          const resolvedSettings = {
            isVotingOpen: !!summaryData.isVotingOpen,
            roundId: summaryData.roundId || "wow-busking-default",
            startedAt: summaryData.startedAt || null,
            endedAt: summaryData.endedAt || null,
            noticeUrl: summaryData.noticeUrl || settingsData.noticeUrl || "",
          };
          const shardSnapshot = await fetchBuskingShardSnapshot(resolvedSettings.roundId);
          if (isCancelled) return;

          const rosterWithVotes = sortBuskingParticipants(applyBuskingVoteCounts(summaryData.participants || [], shardSnapshot.voteCounts));
          setBuskingSettings(resolvedSettings);
          setBuskingShardCounts(shardSnapshot.voteCounts);
          setBuskingPublicRoster(rosterWithVotes.map((member) => ({ ...member, isBuskingParticipant: true })));
          setBuskingPublicMeta({
            totalVotes: shardSnapshot.totalVotes,
            participantCount: Number(summaryData.participantCount) || rosterWithVotes.length,
            updatedAt: shardSnapshot.updatedAt || summaryData.updatedAt || null,
            leaderId: rosterWithVotes[0]?.id || null,
          });
          return;
        }

        const participantsQuery = query(
          collection(db, "artifacts", appId, "public", "data", "wow_roster"),
          where("isBuskingParticipant", "==", true)
        );

        const participantsSnap = await getDocs(participantsQuery);

        if (isCancelled) return;

        const fallbackSettings = settingsSnap.exists()
          ? { isVotingOpen: false, roundId: "wow-busking-default", startedAt: null, endedAt: null, noticeUrl: "", ...settingsSnap.data() }
          : { isVotingOpen: false, roundId: "wow-busking-default", startedAt: null, endedAt: null, noticeUrl: "" };
        const shardSnapshot = await fetchBuskingShardSnapshot(fallbackSettings.roundId);
        if (isCancelled) return;

        const fallbackRoster = participantsSnap.docs.map((wowDoc) => ({ id: wowDoc.id, ...wowDoc.data() }));
        const fallbackSummary = buildBuskingPublicSummary(fallbackRoster, fallbackSettings, shardSnapshot.voteCounts);

        setBuskingSettings(fallbackSettings);
        setBuskingShardCounts(shardSnapshot.voteCounts);
        setBuskingPublicRoster(fallbackSummary.participants.map((member) => ({ ...member, isBuskingParticipant: true })));
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
    intervalId = window.setInterval(fetchBuskingData, BUSKING_PUBLIC_REFRESH_MS);

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
        const shardSnapshot = await fetchBuskingShardSnapshot(buskingSettings.roundId || "wow-busking-default");
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
    intervalId = window.setInterval(refreshShardCounts, BUSKING_PUBLIC_REFRESH_MS);

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
    return rawAdminPresence.filter(admin => (currentTime - admin.lastActive) < 300000);
  }, [rawAdminPresence, currentTime]);

  useEffect(() => {
    if (!isAdminAuth || !currentAdminName || !user) return;
    let lastUpdated = Date.now();
    setDoc(doc(db, "artifacts", appId, "public", "data", "admin_presence", currentAdminName), { lastActive: Date.now(), status: "online" });
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdated > 60000) {
        lastUpdated = now;
        setDoc(doc(db, "artifacts", appId, "public", "data", "admin_presence", currentAdminName), { lastActive: now, status: "online" }, { merge: true }).catch(err => console.error(err));
      }
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isAdminAuth, currentAdminName, user]);

  useEffect(() => {
    const recordVisit = async () => {
      const today = new Date();
      const todayDocId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const storageKey = `wak_visited_${todayDocId}`;
      if (!sessionStorage.getItem(storageKey)) {
        try {
          const visitRef = doc(db, "artifacts", appId, "public", "data", "daily_visits", todayDocId);
          await setDoc(visitRef, { count: increment(1) }, { merge: true });
          sessionStorage.setItem(storageKey, "true"); 
        } catch (error) {}
      }
    };
    if (user) recordVisit();
  }, [user]);

  const getAvatarSrc = (playerName) => {
    const p = players.find((p) => p.name === playerName);
    return p?.imageUrl?.trim() ? p.imageUrl : `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerName}`;
  };

  const getWowAvatarSrc = (member) => {
    return member?.imageUrl?.trim() ? member.imageUrl : `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`;
  };

  const updateLastModifiedTime = async () => {
    try {
      const metaRef = doc(db, "artifacts", appId, "public", "data", "metadata", "app_info");
      await setDoc(metaRef, { lastUpdated: new Date().toISOString() }, { merge: true });
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
    const playerMatches = matches.filter((m) => m.results?.some((r) => r.playerName === playerName));
    if (playerMatches.length === 0) return { type: "none", count: 0 };
    let streakType = "none", count = 0;
    for (const match of playerMatches) {
      const result = match.results.find((r) => r.playerName === playerName);
      if (!result) continue;
      const isWin = result.scoreChange > 0, isLoss = result.scoreChange < 0;
      if (count === 0) {
        if (isWin) { streakType = "win"; count = 1; } 
        else if (isLoss) { streakType = "lose"; count = 1; } 
        else break;
      } else {
        if (streakType === "win" && isWin) count++;
        else if (streakType === "lose" && isLoss) count++;
        else break;
      }
    }
    return { type: streakType, count };
  };

  const getPlayerStats = (playerName) => {
    const playerMatches = matches.filter((m) => m.results?.some((r) => r.playerName === playerName));
    const totalMatches = playerMatches.length;
    const wins = playerMatches.filter((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return r && r.rank === 1;
    }).length;
    const winRate = totalMatches === 0 ? 0 : Math.round((wins / totalMatches) * 100);
    const gameCounts = {};
    playerMatches.forEach((m) => { gameCounts[m.gameName] = (gameCounts[m.gameName] || 0) + 1; });
    let mostPlayedGame = "전적 없음", maxCount = 0;
    for (const [game, count] of Object.entries(gameCounts)) {
      if (count > maxCount) { maxCount = count; mostPlayedGame = game; }
    }
    const recentMatches = playerMatches.map((m) => {
      const r = m.results.find((res) => res.playerName === playerName);
      return { id: m.id, gameName: m.gameName, date: m.date, rank: r.rank, scoreChange: r.scoreChange };
    });
    return { totalMatches, wins, winRate, mostPlayedGame, recentMatches };
  };

  const handleCheerPlayer = async (playerId, playerName) => {
    if (!user) return;
    if (cheeringPlayerId === playerId) return; 

    setCheeringPlayerId(playerId); 
    const today = new Date().toISOString().split('T')[0];
    const storageKey = 'wak_vleague_hearts_v1';
    let storedData = JSON.parse(localStorage.getItem(storageKey) || '{"date": "", "votes": []}');
    if (storedData.date !== today) storedData = { date: today, votes: [] };
    const hasVoted = storedData.votes.includes(playerName);

    try {
      if (hasVoted) {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { hearts: increment(-1) });
        storedData.votes = storedData.votes.filter(name => name !== playerName);
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        showToast(`${playerName}님에 대한 응원을 취소했습니다. 💔`);
      } else {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { hearts: increment(1) });
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
    if (!wowStreamerName.trim() || !wowNickname.trim() || !wowJobClass.trim() || !wowLevel) return showToast("모든 와우 캐릭터 정보를 입력해주세요.", "error");
    const wowSpecState = normalizeWowSpecState(wowJobClass, wowMainSpec, wowAvailableSpecsSelection);
    setIsWowSubmitting(true);
    try {
      await addDoc(collection(db, "artifacts", appId, "public", "data", "wow_roster"), {
        streamerName: wowStreamerName.trim(), 
        wowNickname: wowNickname.trim(), 
        jobClass: wowJobClass.trim(), 
        mainSpec: wowSpecState.mainSpec,
        availableSpecs: wowSpecState.availableSpecs,
        level: Number(wowLevel), 
        isApplied: false, 
        isWowPartner: false,
        wowPartnerGeneration: null,
        isBuskingParticipant: false,
        isRaidApplied: false,
            preferredPositions: [],
        buskingVoteCount: 0,
        broadcastUrl: "",
        createdAt: new Date().toISOString()
      });
      setWowStreamerName(""); setWowNickname(""); setWowJobClass(""); setWowMainSpec(""); setWowAvailableSpecsSelection([]); setWowLevel("");
      showToast("와우 길드원이 성공적으로 등록되었습니다!");
    } catch (error) { showToast("길드원 등록 중 오류 발생", "error"); } finally { setIsWowSubmitting(false); }
  };

  const handleUpdateWowLevel = async (id, newLevel) => {
    if (!user) return;
    if (newLevel < 1) newLevel = 1; if (newLevel > 70) newLevel = 70;
    try { 
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { level: newLevel }); 
      const nextRoster = wowRoster.map((member) => member.id === id ? { ...member, level: newLevel } : member);
      await persistBuskingPublicSummary({ rosterOverride: nextRoster, voteCountsOverride: buskingShardCounts });
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleToggleWowApply = async (id, currentStatus) => {
    if (!user) return;
    try { 
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { isApplied: !currentStatus }); 
      await updateLastModifiedTime();
    } catch (error) {}
  };

  const handleWowPartnerGenerationInputChange = (memberId, value) => {
    const sanitized = `${value || ""}`.replace(/[^0-9]/g, "");
    setWowPartnerGenerationInputs((prev) => ({ ...prev, [memberId]: sanitized }));
  };

  const handleSaveWowPartnerGeneration = async (memberId) => {
    if (!user) return;

    const inputValue = wowPartnerGenerationInputs[memberId];
    const normalizedGeneration = normalizeWowPartnerGeneration(inputValue);
    if (!normalizedGeneration) {
      showToast("와트너 대수는 1 이상의 숫자로 입력해주세요.", "error");
      return;
    }

    const duplicatePartner = wowRoster.find(
      (member) =>
        member.id !== memberId &&
        normalizeWowPartnerGeneration(member.wowPartnerGeneration) === normalizedGeneration
    );

    if (duplicatePartner) {
      showToast(`${normalizedGeneration}대 와트너는 이미 ${duplicatePartner.streamerName}님으로 설정되어 있습니다.`, "error");
      return;
    }

    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), {
        isWowPartner: true,
        wowPartnerGeneration: normalizedGeneration,
      });
      setWowPartnerGenerationInputs((prev) => ({ ...prev, [memberId]: String(normalizedGeneration) }));
      await updateLastModifiedTime();
      showToast(`${normalizedGeneration}대 와트너로 저장했습니다.`);
    } catch (error) {
      showToast("와트너 대수를 저장하지 못했습니다.", "error");
    }
  };

  const handleClearWowPartnerGeneration = async (memberId) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), {
        isWowPartner: false,
        wowPartnerGeneration: null,
      });
      setWowPartnerGenerationInputs((prev) => ({ ...prev, [memberId]: "" }));
      await updateLastModifiedTime();
      showToast("와트너 지정을 해제했습니다.");
    } catch (error) {
      showToast("와트너 지정을 해제하지 못했습니다.", "error");
    }
  };


  const handleToggleWowPreferredPosition = async (memberId, positionId, currentPositions = []) => {
    if (!user) return;
    const normalizedPositions = normalizePreferredPositions(currentPositions);
    const nextPositions = normalizedPositions.includes(positionId)
      ? normalizedPositions.filter((item) => item !== positionId)
      : [...normalizedPositions, positionId];

    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), { preferredPositions: nextPositions });
      await updateLastModifiedTime();
    } catch (error) {
      showToast("선호 포지션을 저장하지 못했습니다.", "error");
    }
  };

  const handleToggleWowAvailableSpec = async (memberId, specId, jobClass, currentAvailableSpecs = [], currentMainSpec = "") => {
    if (!user) return;
    const baseState = normalizeWowSpecState(jobClass, currentMainSpec, currentAvailableSpecs);
    const nextAvailableSpecs = baseState.availableSpecs.includes(specId)
      ? baseState.availableSpecs.filter((item) => item !== specId)
      : [...baseState.availableSpecs, specId];
    const nextSpecState = normalizeWowSpecState(jobClass, baseState.mainSpec, nextAvailableSpecs);

    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), {
        availableSpecs: nextSpecState.availableSpecs,
        mainSpec: nextSpecState.mainSpec,
      });
      await updateLastModifiedTime();
    } catch (error) {
      showToast("특성을 저장하지 못했습니다.", "error");
    }
  };

  const handleSelectWowMainSpec = async (memberId, specId, jobClass, currentAvailableSpecs = []) => {
    if (!user) return;
    const nextAvailableSpecs = currentAvailableSpecs.includes(specId)
      ? currentAvailableSpecs
      : [...currentAvailableSpecs, specId];
    const nextSpecState = normalizeWowSpecState(jobClass, specId, nextAvailableSpecs);

    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), {
        availableSpecs: nextSpecState.availableSpecs,
        mainSpec: nextSpecState.mainSpec,
      });
      await updateLastModifiedTime();
    } catch (error) {
      showToast("주 특성을 저장하지 못했습니다.", "error");
    }
  };


  const handleToggleRaidApply = async (id, currentStatus, level) => {
    if (!user) return;
    if (Number(level) < 50) {
      showToast("50레벨 이상 길드원만 레이드 신청자로 지정할 수 있습니다.", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id), { isRaidApplied: !currentStatus });
      await updateLastModifiedTime();
      showToast(!currentStatus ? "레이드 신청자로 등록했습니다." : "레이드 신청 상태를 해제했습니다.");
    } catch (error) {
      showToast("레이드 신청 상태를 변경하지 못했습니다.", "error");
    }
  };

  const handleToggleBuskingParticipant = async (memberId, currentStatus, memberLevel) => {
    if (!user) return;
    if (Number(memberLevel) < 40) {
      showToast("40레벨 이상 길드원만 버스킹 참가자로 지정할 수 있습니다.", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), { isBuskingParticipant: !currentStatus });
      const nextRoster = wowRoster.map((member) => member.id === memberId ? { ...member, isBuskingParticipant: !currentStatus } : member);
      await persistBuskingPublicSummary({ rosterOverride: nextRoster, voteCountsOverride: buskingShardCounts });
      await updateLastModifiedTime();
      showToast(!currentStatus ? "버스킹 참가자로 등록했습니다." : "버스킹 참가자에서 제외했습니다.");
    } catch (error) {
      showToast("버스킹 참가 상태를 변경하지 못했습니다.", "error");
    }
  };

  const handleUpdateWowBroadcastUrl = async (memberId, url) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), { broadcastUrl: url || "" });
      const nextRoster = wowRoster.map((member) => member.id === memberId ? { ...member, broadcastUrl: url || "" } : member);
      await persistBuskingPublicSummary({ rosterOverride: nextRoster, voteCountsOverride: buskingShardCounts });
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
      await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", "busking"), nextSettings, { merge: true });
      await persistBuskingPublicSummary({ settingsOverride: nextSettings, voteCountsOverride: buskingShardCounts });
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
      await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", "busking"), nextSettings, { merge: true });
      await persistBuskingPublicSummary({ settingsOverride: nextSettings, voteCountsOverride: buskingShardCounts });
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
      batch.set(doc(db, "artifacts", appId, "public", "data", "settings", "busking"), nextSettings, { merge: true });
      const resetSummary = buildBuskingPublicSummary(wowRoster, nextSettings, {});
      batch.set(
        doc(db, "artifacts", appId, "public", "data", "settings", BUSKING_PUBLIC_SUMMARY_DOC_ID),
        resetSummary
      );
      await batch.commit();
      localStorage.setItem(BUSKING_VOTE_STORAGE_KEY, JSON.stringify({ roundId: nextRoundId, votes: [] }));
      setBuskingLocalVotes([]);
      setBuskingShardCounts({});
      setBuskingPublicRoster(resetSummary.participants.map((member) => ({ ...member, isBuskingParticipant: true })));
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
      await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", "busking"), nextSettings, { merge: true });
      setBuskingSettings(nextSettings);
      showToast(nextSettings.noticeUrl ? "와우 버스킹 공지사항 링크를 저장했습니다." : "공지사항 링크를 비웠습니다.");
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
      await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", "busking"), nextSettings, { merge: true });
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
    const shardIndex = getBuskingVoteShardIndex(`${buskingClientId}:${member.id}:${Date.now()}`);

    setPendingBuskingVoteId(member.id);
    try {
      await runTransaction(db, async (transaction) => {
        const settingsRef = doc(db, "artifacts", appId, "public", "data", "settings", "busking");
        const memberRef = doc(db, "artifacts", appId, "public", "data", "wow_roster", member.id);
        const voteRef = doc(db, "artifacts", appId, "public", "data", "busking_rounds", currentRoundId, "votes", voteEntryId);
        const shardRef = doc(db, "artifacts", appId, "public", "data", "busking_rounds", currentRoundId, BUSKING_PUBLIC_SHARDS_COLLECTION, `shard_${shardIndex}`);

        const [settingsSnap, memberSnap, voteSnap] = await Promise.all([
          transaction.get(settingsRef),
          transaction.get(memberRef),
          transaction.get(voteRef),
        ]);

        const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
        if (!settingsData?.isVotingOpen || (settingsData.roundId || "wow-busking-default") !== currentRoundId) {
          throw new Error("VOTING_CLOSED");
        }

        if (!memberSnap.exists()) {
          throw new Error("MEMBER_NOT_FOUND");
        }

        if (voteSnap.exists()) {
          throw new Error("ALREADY_VOTED");
        }

        const memberData = memberSnap.data();
        if (!memberData?.isBuskingParticipant || Number(memberData?.level) < 40) {
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

        transaction.set(shardRef, {
          shardIndex,
          roundId: currentRoundId,
          totalVotes: increment(1),
          updatedAt: new Date().toISOString(),
          counts: {
            [member.id]: increment(1),
          },
        }, { merge: true });
      });

      const nextVotes = [...buskingLocalVotes, member.id];
      localStorage.setItem(BUSKING_VOTE_STORAGE_KEY, JSON.stringify({ roundId: currentRoundId, votes: nextVotes }));
      setBuskingLocalVotes(nextVotes);

      const nextCounts = {
        ...buskingShardCounts,
        [member.id]: (Number(buskingShardCounts[member.id]) || 0) + 1,
      };
      setBuskingShardCounts(nextCounts);

      let optimisticRoster = [];
      setBuskingPublicRoster((prev) => {
        optimisticRoster = sortBuskingParticipants(applyBuskingVoteCounts(prev, nextCounts));
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
        const nextVotes = buskingLocalVotes.includes(member.id) ? buskingLocalVotes : [...buskingLocalVotes, member.id];
        localStorage.setItem(BUSKING_VOTE_STORAGE_KEY, JSON.stringify({ roundId: currentRoundId, votes: nextVotes }));
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
      .filter(m => m.level >= 40 && m.isApplied)
      .map(m => m.streamerName)
      .join(", ");

    if (!applicants) {
      showToast("참가 신청 완료한 길드원이 아직 없습니다.", "error");
      return;
    }

    copyTextToClipboard(applicants, `참가 신청 명단(${applicants.split(', ').length}명) 복사 완료!`);
  };

  const isFixedRaidMemberId = (memberId) => memberId === GUILD_MASTER_ID;

  const assignMemberToRaidSlot = (memberId, targetGroupIndex, targetSlotIndex) => {
    const member = raidMemberMap[memberId];
    if (!member) return;

    setRaidRoleMenuSlotKey(null);

    setRaidAssignments((prev) => {
      const next = cloneRaidLayout(prev);
      const sourceSlot = findRaidSlotByMemberId(next, memberId);
      const targetMemberId = next[targetGroupIndex][targetSlotIndex];

      if (sourceSlot && sourceSlot.groupIndex === targetGroupIndex && sourceSlot.slotIndex === targetSlotIndex) {
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
    setSelectedRaidTargetSlotKey(null);
  };

  const handleRaidSlotClick = (groupIndex, slotIndex) => {
    const currentMemberId = raidAssignments[groupIndex]?.[slotIndex] || null;
    const slotKey = `${groupIndex}-${slotIndex}`;

    if (selectedRaidMemberId) {
      assignMemberToRaidSlot(selectedRaidMemberId, groupIndex, slotIndex);
      return;
    }

    if (currentMemberId) {
      setSelectedRaidTargetSlotKey(null);
      setSelectedRaidMemberId(currentMemberId);
      return;
    }

    setSelectedRaidMemberId(null);
    setSelectedRaidTargetSlotKey((prev) => prev === slotKey ? null : slotKey);
  };

  const handleQuickAddRaidMember = (memberId) => {
    let targetSlot = null;
    if (selectedRaidTargetSlotKey) {
      const [groupIndexText, slotIndexText] = selectedRaidTargetSlotKey.split('-');
      const groupIndex = Number(groupIndexText);
      const slotIndex = Number(slotIndexText);
      if (Number.isInteger(groupIndex) && Number.isInteger(slotIndex) && !raidAssignments[groupIndex]?.[slotIndex]) {
        targetSlot = { groupIndex, slotIndex };
      }
    }

    const emptySlot = targetSlot || findNextEmptyRaidSlot(raidAssignments);
    if (!emptySlot) {
      showToast(`${raidConfig.label} 레이드 자리가 모두 채워졌습니다.`, "error");
      return;
    }

    assignMemberToRaidSlot(memberId, emptySlot.groupIndex, emptySlot.slotIndex);
  };

  const handleRemoveRaidMember = (groupIndex, slotIndex) => {
    const removedMemberId = raidAssignments[groupIndex]?.[slotIndex] || null;

    if (removedMemberId === GUILD_MASTER_ID) {
      showToast("고정 길드원은 제거할 수 없지만 다른 슬롯으로 옮길 수 있습니다.", "error");
      return;
    }

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
    setRaidAssignments(createEmptyRaidLayout(raidConfig.groupCount, GUILD_MASTER_ID));
    setSelectedRaidMemberId(null);
    setSelectedRaidTargetSlotKey(null);
    setRaidDragMemberId(null);
    setRaidDragOverSlot(null);
    setRaidRoleAssignments({});
    setRaidAssignedPreferredPositions({});
    setRaidRoleMenuSlotKey(null);
    setRaidPositionMenuSlotKey(null);
    setIsRaidFixedMemberMenuOpen(false);
    showToast(`${raidConfig.label} 레이드 편성을 초기화했습니다.`);
  };

  const handleCopyRaidLink = () => {
    copyTextToClipboard(`${window.location.origin}${window.location.pathname}#raid`, "공유용 #raid 링크를 복사했습니다.");
  };

  const handleCopyRaidSummary = () => {
    const lines = [`[WOW ${raidConfig.label} 레이드 편성표]`];

    raidAssignments.forEach((group, groupIndex) => {
      lines.push("");
      lines.push(`파티 ${groupIndex + 1}`);

      group.forEach((memberId, slotIndex) => {
        const member = memberId ? raidMemberMap[memberId] : null;
        lines.push(
          `${slotIndex + 1}. ${member ? `${member.streamerName} / ${member.wowNickname} / ${member.jobClass} / Lv.${member.level}` : "빈자리"}`
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
        const existingScript = document.querySelector('script[data-raid-html2canvas="true"]');

        const handleResolve = () => {
          if (window.html2canvas) {
            resolve(window.html2canvas);
          } else {
            reject(new Error("html2canvas를 불러오지 못했습니다."));
          }
        };

        const handleError = () => reject(new Error("스크린샷 라이브러리를 불러오지 못했습니다."));

        if (existingScript) {
          existingScript.addEventListener("load", handleResolve, { once: true });
          existingScript.addEventListener("error", handleError, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
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
          clonedDocument.querySelectorAll('[data-no-screenshot="true"], [data-raid-role-panel="true"]').forEach((element) => {
            element.style.display = "none";
          });

          const captureRoot = clonedDocument.querySelector('[data-raid-screenshot-root="true"]');
          if (captureRoot) {
            captureRoot.style.boxShadow = "none";
            captureRoot.style.borderColor = "rgba(148, 163, 184, 0.28)";
          }
        },
      });

      const downloadLink = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.download = `wow-raid-${raidType}raid-${timestamp}.png`;
      downloadLink.click();
      showToast("레이드 스크린샷 저장이 시작되었습니다.");
    } catch (error) {
      showToast("스크린샷 저장에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setIsRaidCapturing(false);
    }
  };

  const handleRaidDragStart = (event, memberId) => {
    if (!memberId) {
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
    const memberId = event.dataTransfer.getData("text/plain") || raidDragMemberId;
    if (memberId) {
      assignMemberToRaidSlot(memberId, groupIndex, slotIndex);
    }
    clearRaidDragState();
  };

  const handleDeleteWowMember = async (id) => {
    if (!user || !window.confirm("정말 이 길드원을 삭제하시겠습니까?")) return;
    try { await deleteDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", id)); showToast("길드원이 삭제되었습니다."); } catch (error) {}
  };

  const handleResetDatabase = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      for (const m of matches) await deleteDoc(doc(db, "artifacts", appId, "public", "data", "matches", m.id));
      for (const p of players) await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id));
      await updateLastModifiedTime();
      showToast("데이터가 초기화되고 백지상태로 시작됩니다!", "success");
      setShowResetModal(false);
    } catch (error) { showToast("초기화 중 오류가 발생했습니다.", "error"); } finally { setIsResetting(false); navigateTo("tier"); }
  };

  const hashPassword = async (password) => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminNicknameInput.trim()) { showToast("닉네임을 입력해주세요.", "error"); return; }
    if (!passwordInput.trim()) { showToast("비밀번호를 입력해주세요.", "error"); return; }
    if (!user) { showToast("서버와 연결 중입니다. 잠시만 기다려주세요.", "error"); return; }

    setIsAdminLoggingIn(true);
    try {
      const authDocRef = doc(db, "artifacts", appId, "public", "data", "admin_auth", "config");
      const authDocSnap = await getDoc(authDocRef);
      const inputHash = await hashPassword(passwordInput);

      if (!authDocSnap.exists()) {
        if (adminNicknameInput.trim() === "딸기세팅") {
          await setDoc(authDocRef, { hash: inputHash, createdAt: new Date().toISOString() });
          showToast(`🔒 [최초 등록 완료] 이제부터 이 비밀번호로만 접속 가능합니다! 다시 로그인해주세요.`);
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
          showToast(`${adminNicknameInput.trim()}님, 관리자 모드에 접속하셨습니다.`);
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
      try { await deleteDoc(doc(db, "artifacts", appId, "public", "data", "admin_presence", currentAdminName)); } catch (error) {}
    }
    setIsAdminAuth(false); setCurrentAdminName(null); showToast("성공적으로 로그아웃 되었습니다.");
  };

  const handleSavePopup = async (e) => {
    e.preventDefault();
    if (!popupTitleInput.trim() || !popupContentInput.trim()) {
      return showToast("팝업 제목과 내용을 모두 입력해주세요.", "error");
    }
    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", "popup"), {
        title: popupTitleInput.trim(),
        content: popupContentInput.trim(),
        isActive: true,
        updatedAt: Date.now()
      });
      showToast("팝업 공지가 유저들에게 띄워집니다!");
    } catch (error) {
      showToast("팝업 저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDeletePopup = async () => {
    try {
      await setDoc(doc(db, "artifacts", appId, "public", "data", "settings", "popup"), {
        isActive: false,
        updatedAt: Date.now()
      }, { merge: true });
      showToast("팝업 공지가 사이트에서 즉시 내려갔습니다.");
    } catch (error) {
      showToast("팝업 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const handleUpdateImage = async (playerId, url) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { imageUrl: url || "" }); await updateLastModifiedTime(); showToast("종겜 리그 프로필 이미지가 저장되었습니다."); } catch (error) {}
  };

  const handleUpdateLeagueParticipantImage = async (participant, url) => {
    try {
      const collectionName = participant?._source === "draft_players" ? "draft_players" : "players";
      await updateDoc(doc(db, "artifacts", appId, "public", "data", collectionName, participant.id), { imageUrl: url || "" });
      await updateLastModifiedTime();
      showToast("종겜 리그 프로필 이미지가 저장되었습니다.");
    } catch (error) {}
  };

  const handleUpdateBroadcastUrl = async (playerId, url) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId), { broadcastUrl: url || "" }); await updateLastModifiedTime(); showToast("방송국 주소가 저장되었습니다."); } catch (error) {}
  };

  const handleUpdateLeagueParticipantBroadcastUrl = async (participant, url) => {
    try {
      const collectionName = participant?._source === "draft_players" ? "draft_players" : "players";
      await updateDoc(doc(db, "artifacts", appId, "public", "data", collectionName, participant.id), { broadcastUrl: url || "" });
      await updateLastModifiedTime();
      showToast("방송국 주소가 저장되었습니다.");
    } catch (error) {}
  };

  const handleUpdateWowImage = async (memberId, url) => {
    try { await updateDoc(doc(db, "artifacts", appId, "public", "data", "wow_roster", memberId), { imageUrl: url || "" }); await updateLastModifiedTime(); showToast("와우 길드원 프로필 이미지가 저장되었습니다."); } catch (error) {}
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
            (m) => m.id !== matchToDelete.id && m.results?.some((r) => r.playerName === player.name)
          );
          if (hasOtherMatches) {
            await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", player.id), { points: increment(-result.scoreChange) });
          } else {
            await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", player.id));
          }
        }
      }
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "matches", matchToDelete.id));
      await updateLastModifiedTime();
      showToast("경기가 삭제되고 남은 기록이 없는 선수가 명단에서 제외되었습니다.");
      setMatchToDelete(null);
    } catch (error) {} finally { setIsDeleting(false); }
  };

  // ★ 관리자가 수동으로 선수를 영구 삭제하는 기능 ★
  const handleDeletePlayer = async (playerId, playerName) => {
    if (!user || !window.confirm(`정말 [${playerName}] 선수를 명단에서 강제 삭제하시겠습니까?\n\n(주의: 이 선수가 참여한 경기 기록이 남아있다면 데이터가 꼬일 수 있으니, 경기 기록이 없는 '유령 선수'만 삭제해주세요!)`)) return;
    try {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId));
      await updateLastModifiedTime();
      showToast(`[${playerName}] 선수가 명단에서 영구 삭제되었습니다.`);
    } catch (error) {
      showToast("선수 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // ★ 유령 데이터 일괄 청소 버튼 기능 ★
  const handleCleanGhostData = async () => {
    if (!user || !window.confirm("경기 기록이 전혀 없는 '유령 선수'들을 찾아 명단에서 모두 삭제하시겠습니까?")) return;
    setIsCleaningGhosts(true);
    try {
      let deletedCount = 0;
      for (const p of players) {
        const hasMatch = matches.some((m) => m.results?.some((r) => r.playerName === p.name));
        if (!hasMatch) {
          await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id));
          deletedCount++;
        }
      }
      await updateLastModifiedTime();
      if (deletedCount > 0) {
        showToast(`총 ${deletedCount}명의 유령 데이터를 성공적으로 청소했습니다!`);
      } else {
        showToast("삭제할 유령 데이터가 없습니다. (모두 정상입니다)");
      }
    } catch (error) {
      showToast("유령 데이터 청소 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCleaningGhosts(false);
    }
  };

  const ensureDraftPlayersExistForMatchResults = async (results = []) => {
    const uniqueNames = [...new Set((results || []).map((r) => (r.playerName || "").trim()).filter(Boolean))];
    for (const playerName of uniqueNames) {
      const existingPlayer = players.find((p) => p.name === playerName);
      const existingDraft = draftPlayers.find((p) => p.name === playerName);
      if (!existingPlayer && !existingDraft) {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "draft_players"), {
          name: playerName,
          imageUrl: "",
          broadcastUrl: "",
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  const ensurePlayersExistForPublishedMatchResults = async (results = []) => {
    const uniqueNames = [...new Set((results || []).map((r) => (r.playerName || "").trim()).filter(Boolean))];
    for (const playerName of uniqueNames) {
      const existing = players.find((p) => p.name === playerName);
      if (existing) continue;
      const existingDraft = draftPlayers.find((p) => p.name === playerName);
      await addDoc(collection(db, "artifacts", appId, "public", "data", "players"), {
        name: playerName,
        points: 0,
        imageUrl: existingDraft?.imageUrl || "",
        broadcastUrl: existingDraft?.broadcastUrl || "",
        createdAt: new Date().toISOString(),
      });
      if (existingDraft?.id) {
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", "draft_players", existingDraft.id));
      }
    }
  };

  const applyMatchScoreDelta = async (oldResults = [], newResults = []) => {
    const tally = (results) => {
      const map = new Map();
      (results || []).forEach((r) => {
        const name = (r.playerName || "").trim();
        if (!name) return;
        map.set(name, (map.get(name) || 0) + (Number(r.scoreChange) || 0));
      });
      return map;
    };

    const oldMap = tally(oldResults);
    const newMap = tally(newResults);
    const allNames = new Set([...oldMap.keys(), ...newMap.keys()]);

    for (const playerName of allNames) {
      const delta = (newMap.get(playerName) || 0) - (oldMap.get(playerName) || 0);
      if (!delta) continue;

      let player = players.find((p) => p.name === playerName);
      if (!player) {
        const playerQuery = query(collection(db, "artifacts", appId, "public", "data", "players"), where("name", "==", playerName));
        const playerSnapshot = await getDocs(playerQuery);
        if (!playerSnapshot.empty) {
          const playerDoc = playerSnapshot.docs[0];
          player = { id: playerDoc.id, ...playerDoc.data() };
        }
      }

      if (player) {
        await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", player.id), { points: increment(delta) });
      } else if (delta > 0) {
        await addDoc(collection(db, "artifacts", appId, "public", "data", "players"), { name: playerName, points: delta, createdAt: new Date().toISOString() });
      }
    }
  };

  const handleOpenEditMatch = (match) => {
    setMatchToEdit({ ...match, originalMatch: match });
    setEditGameName(match.gameName);
    setEditMatchDate(match.date);
    setEditMatchMode(match.matchType || "individual");
    
    setEditHasFunding(match.hasFunding || false);
    setEditTotalFunding(match.totalFunding || "");
    setEditIsPublished(match.isPublished !== false);

    if (match.matchType === "team") {
      const normalizedTeams = getNormalizedTeamMatchResults(match);
      setEditTeamResults(normalizedTeams.length > 0 ? normalizedTeams : createDefaultTeamMatchResults());
      setEditIndividualResults([{ playerName: "", rank: 1, scoreChange: 100, fundingRatio: "", fundingAmount: "" }, { playerName: "", rank: 2, scoreChange: 50, fundingRatio: "", fundingAmount: "" }]);
    } else {
      setEditIndividualResults([...(match.results || [])].map(r => ({...r, fundingRatio: r.fundingRatio || "", fundingAmount: r.fundingAmount || ""})));
      setEditTeamResults(createDefaultTeamMatchResults());
    }
  };

  const handleSaveEditedMatch = async (e) => {
    e.preventDefault();
    if (!editGameName.trim()) return showToast("게임 이름을 입력해주세요.", "error");

    let finalResults = [];
    let nextTeamResults = [];
    if (editMatchMode === "individual") {
      finalResults = editIndividualResults
        .filter((r) => r.playerName.trim() !== "")
        .map(r => ({
           playerName: r.playerName.trim(),
           rank: r.rank,
           scoreChange: r.scoreChange,
           ...(editHasFunding ? { fundingRatio: Number(r.fundingRatio) || 0, fundingAmount: Number(r.fundingAmount) || 0 } : {})
        }));
    } else {
      const teamPayload = buildTeamMatchPayload(editTeamResults, editHasFunding);
      finalResults = teamPayload.results;
      nextTeamResults = teamPayload.teamResults;
    }

    if (finalResults.length === 0) return showToast("최소 1명 이상의 유효한 참가자를 입력해주세요.", "error");

    setIsEditingSubmit(true);
    try {
      if (editIsPublished) {
        await ensurePlayersExistForPublishedMatchResults(finalResults);
      } else {
        await ensureDraftPlayersExistForMatchResults(finalResults);
      }

      const oldPublishedResults = (matchToEdit.originalMatch.isPublished !== false) ? (matchToEdit.originalMatch.results || []) : [];
      const newPublishedResults = editIsPublished ? finalResults : [];

      await applyMatchScoreDelta(oldPublishedResults, newPublishedResults);

      await updateDoc(doc(db, "artifacts", appId, "public", "data", "matches", matchToEdit.id), {
        gameName: editGameName,
        date: editMatchDate,
        matchType: editMatchMode,
        hasFunding: editHasFunding,
        totalFunding: editHasFunding ? Number(editTotalFunding) || 0 : 0,
        results: finalResults,
        teamResults: editMatchMode === "team" ? nextTeamResults : [],
        isPublished: editIsPublished,
        publishedAt: editIsPublished ? (matchToEdit.originalMatch.publishedAt || new Date().toISOString()) : null,
        updatedAt: new Date().toISOString()
      });

      await updateLastModifiedTime();
      showToast(editIsPublished ? "경기 기록이 저장/공개되었습니다." : "경기 기록이 임시 저장되었습니다.");
      setMatchToEdit(null);
    } catch (error) {
      showToast("수정 중 오류 발생", "error");
    } finally {
      setIsEditingSubmit(false);
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className={publicTheme.heroHome}>
        <div className="relative z-10 w-full md:w-3/4 pr-4">
          <h2 className={`text-2xl md:text-3xl font-bold mb-2 md:whitespace-nowrap tracking-tight ${publicTheme.heading}`}>우왁굳의 버츄얼 종겜 리그에 오신 것을 환영합니다</h2>
          <p className={`mb-6 text-sm md:text-base break-keep ${publicTheme.bodyText}`}>매주 바뀌는 게임과 실시간으로 갱신되는 티어표를 확인하세요.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => navigateTo("tier")} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-500 transition">
              <Trophy className="w-5 h-5 mr-2" /> 티어표 보기
            </button>
            <button onClick={() => navigateTo("matches")} className={`flex items-center px-4 py-2 rounded-lg border shadow-lg transition ${isLightTheme ? "bg-white text-slate-900 border-slate-300 shadow-sm hover:bg-slate-100 hover:shadow-md" : "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"}`}>
              <Swords className="w-5 h-5 mr-2" /> 경기 기록
            </button>
            <button onClick={() => navigateTo("wow")} className={`flex items-center px-4 py-2 text-white rounded-lg border shadow-lg transition ${isLightTheme ? "bg-gradient-to-r from-blue-600 to-violet-600 border-blue-300 hover:from-blue-500 hover:to-violet-500" : "bg-gradient-to-r from-blue-900 to-purple-900 border-blue-700/50 hover:from-blue-800 hover:to-purple-800"}`}>
              <Shield className="w-5 h-5 mr-2" /> 와우 왁타버스 길드
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${isLightTheme ? "bg-white rounded-xl border border-slate-200 shadow-md" : publicTheme.surfaceCard} p-6`}>
          <h3 className={`text-2xl font-bold mb-5 flex items-center ${publicTheme.heading}`}>
            <Gamepad2 className={`w-6 h-6 mr-2 ${isLightTheme ? "text-green-600" : "text-green-400"}`} /> 최근 경기
          </h3>
          {publishedMatches.length > 0 ? (
            <div className="space-y-4">
              {publishedMatches.slice(0, 4).map((match) => {
                const firstPlaceName = match.results?.find((r) => r.rank === 1)?.playerName || "";
                const firstPlaceLabel = match.matchType === "team" && firstPlaceName
                  ? `${firstPlaceName} 팀`
                  : firstPlaceName;

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      setSelectedMatchId(match.id);
                      navigateTo("matches");
                    }}
                    className={`w-full text-left p-4 rounded-lg flex justify-between items-center transition border ${
                      isLightTheme
                        ? "bg-slate-50/90 border-slate-200 shadow-sm hover:bg-white hover:border-emerald-200 hover:shadow-md"
                        : "bg-gray-700/50 border-transparent hover:bg-gray-700 hover:border-green-500/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center">
                        {match.matchType === "team" && <Users className={`w-4 h-4 mr-1.5 ${isLightTheme ? "text-blue-600" : "text-indigo-400"}`} />}
                        <p className={`font-bold text-lg ${publicTheme.heading}`}>{match.gameName}</p>
                      </div>
                      <p className={`text-sm mt-1 ${publicTheme.mutedText}`}>{match.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>
                        1위: {firstPlaceLabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={`${publicTheme.mutedText} text-lg`}>최근 경기가 없습니다.</p>
          )}
        </div>
        <div className={`${isLightTheme ? "bg-white rounded-xl border border-slate-200 shadow-md" : publicTheme.surfaceCard} p-6`}>
          <h3 className={`text-2xl font-bold mb-5 flex items-center ${publicTheme.heading}`}>
            <BarChart3 className={`w-6 h-6 mr-2 ${isLightTheme ? "text-green-600" : "text-green-400"}`} /> TOP 5
          </h3>
          {players.length > 0 ? (
            <div className="space-y-3">
              {[...players].sort((a, b) => b.points - a.points).slice(0, 5).map((player, idx) => (
                  <div key={player.id} onClick={() => setSelectedPlayer(player.name)} className={`flex items-center p-3 rounded-lg cursor-pointer transition group border ${isLightTheme ? "bg-slate-50/90 border-slate-200 shadow-sm hover:bg-white hover:border-emerald-200 hover:shadow-md" : "bg-gray-700/30 border-transparent hover:bg-gray-600/50"}`}>
                    <div className={`w-10 h-10 text-lg rounded-full flex items-center justify-center font-bold mr-4 ${
                      idx === 0 ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]" : 
                      idx === 1 ? "bg-slate-300 text-black shadow-[0_0_10px_rgba(203,213,225,0.5)]" :
                      idx === 2 ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]" :
                      (isLightTheme ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-gray-600 text-white")
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-3">
                      <img src={getAvatarSrc(player.name)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} alt="avatar" className={`w-10 h-10 rounded-full object-cover border transition ${isLightTheme ? "bg-slate-100 border-slate-200 group-hover:border-emerald-300" : "bg-gray-800 border-gray-600 group-hover:border-green-400"}`} />
                      <span className={`font-bold text-lg transition ${isLightTheme ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-green-400"}`}>{player.name}</span>
                    </div>
                    <div className={`font-black text-lg ${isLightTheme ? "text-emerald-700" : "text-green-400"}`}>{player.points} pt</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className={`${publicTheme.mutedText} text-lg`}>참가자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlayersView = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const storageData = JSON.parse(localStorage.getItem('wak_vleague_hearts_v1') || '{"date": "", "votes": []}');
    const votesToday = storageData.date === todayStr ? storageData.votes : [];
    const getPlayerSortButtonClasses = (isActive) => (
      isActive
        ? publicTheme.playersSortActive
        : publicTheme.playersSortInactive
    );

    return (
      <div className="space-y-8">
        <div className={publicTheme.heroPlayers}>
          <div className="absolute -right-4 -top-4 opacity-10">
            <Users className="w-48 h-48 text-purple-500" />
          </div>
          <div className="relative z-10 text-center">
            <h2 className={`text-2xl md:text-3xl font-black mb-3 flex items-center justify-center drop-shadow-md ${publicTheme.heading}`}>
              <Users className="w-8 h-8 mr-3 text-purple-400" /> 참가 선수 갤러리
            </h2>
            <p className={`text-base md:text-lg leading-relaxed max-w-2xl mx-auto break-keep ${publicTheme.bodyText}`}>
              버츄얼 종겜 리그에 참여한 이력이 있는 스트리머들의 프로필을 확인하실 수 있습니다.<br/>
              <span className={`font-medium text-sm md:text-base mt-4 inline-block px-6 py-2 rounded-full shadow-sm backdrop-blur-sm ${isLightTheme ? "text-pink-700 bg-pink-100/80" : "text-purple-200 bg-white/5 border border-white/10"}`}>
                💡 궁금한 스트리머의 프로필을 클릭해보세요!
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className={`flex flex-wrap gap-2 ${isLightTheme ? "rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 shadow-sm" : ""}`}>
            <button
              type="button"
              onClick={() => handlePlayerCardSortChange("name")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${getPlayerSortButtonClasses(playerCardSort.key === "name")}`}
            >
              이름순
              {playerCardSort.key === "name" ? (
                playerCardSort.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              ) : (
                <span className={`text-xs ${isLightTheme ? "text-slate-400" : "text-gray-500"}`}>기본</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handlePlayerCardSortChange("points")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${getPlayerSortButtonClasses(playerCardSort.key === "points")}`}
            >
              포인트수
              {playerCardSort.key === "points" ? (
                playerCardSort.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              ) : (
                <Trophy className={`w-3.5 h-3.5 ${isLightTheme ? "text-slate-400" : "text-gray-500"}`} />
              )}
            </button>
            <button
              type="button"
              onClick={() => handlePlayerCardSortChange("hearts")}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${getPlayerSortButtonClasses(playerCardSort.key === "hearts")}`}
            >
              응원수
              {playerCardSort.key === "hearts" ? (
                playerCardSort.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              ) : (
                <Heart className={`w-3.5 h-3.5 ${isLightTheme ? "text-slate-400" : "text-gray-500"}`} />
              )}
            </button>
          </div>

          <div className="relative w-full xl:w-96">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${publicTheme.mutedText}`} />
            <input
              type="text"
              value={playerCardSearchInput}
              onChange={(e) => setPlayerCardSearchInput(e.target.value)}
              placeholder="선수명으로 검색"
              className={isLightTheme ? "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/15" : "w-full rounded-xl border border-gray-700 bg-gray-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-3.5 xl:gap-4">
          {filteredPlayersForGallery.map((player) => {
            const hasVotedToday = votesToday.includes(player.name);
            const broadcastLink = player.broadcastUrl?.trim()
              ? player.broadcastUrl
              : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(player.name)}`;

            return (
              <div key={player.id} className={`rounded-2xl border overflow-hidden transition-all duration-300 group flex flex-col min-h-[248px] ${isLightTheme ? "bg-white border-slate-200 shadow-[0_18px_36px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-fuchsia-200 hover:shadow-[0_24px_48px_rgba(15,23,42,0.14)]" : "bg-gradient-to-b from-gray-800 to-gray-800/95 border-gray-700 shadow-lg hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]"}`}>
                <div className="p-3.5 md:p-4 flex-1 flex flex-col items-center cursor-pointer" onClick={() => setSelectedPlayer(player.name)}>
                  <div className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-full border-2 mb-3 overflow-hidden group-hover:scale-110 transition-all duration-300 shadow-md ${isLightTheme ? "bg-slate-100 border-slate-200 group-hover:border-fuchsia-300" : "bg-gray-700 border-gray-600 group-hover:border-purple-400"}`}>
                    <img src={getAvatarSrc(player.name)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} alt={player.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className={`font-bold text-sm md:text-[15px] text-center break-all leading-tight transition-colors ${isLightTheme ? "text-slate-900 group-hover:text-fuchsia-700" : "text-white group-hover:text-purple-400"}`}>{player.name}</h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full mt-2 border ${isLightTheme ? "text-green-700 bg-green-100 border-green-200 shadow-sm" : "text-green-400 bg-green-900/20 border-green-800/30"}`}>{player.points} pt</span>
                </div>
                <div className="px-3 pb-3.5 space-y-2 mt-auto">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCheerPlayer(player.id, player.name); }}
                    disabled={cheeringPlayerId === player.id}
                    className={`w-full flex items-center justify-center py-2.5 rounded-xl font-bold text-xs transition-all duration-300 transform active:scale-95 ${
                      cheeringPlayerId === player.id
                        ? (isLightTheme ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" : "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed")
                        : hasVotedToday
                          ? (isLightTheme ? "bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 cursor-pointer" : "bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500/20 cursor-pointer")
                          : (isLightTheme ? "bg-pink-600 hover:bg-pink-500 text-white shadow-[0_14px_30px_rgba(219,39,119,0.18)]" : "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_4px_14px_rgba(236,72,153,0.3)]")
                    }`}
                  >
                    {cheeringPlayerId === player.id ? (
                      <><Loader2 className={`w-3.5 h-3.5 mr-1.5 animate-spin ${isLightTheme ? "text-slate-400" : "text-gray-400"}`} /> 처리 중...</>
                    ) : (
                      <>
                        <Heart className={`w-3.5 h-3.5 mr-1 ${hasVotedToday ? (isLightTheme ? "fill-pink-600 text-pink-600" : "fill-pink-400 text-pink-400") : "fill-transparent text-white"}`} />
                        {hasVotedToday ? "응원완료" : "응원하기"} {(player.hearts || 0).toLocaleString()}
                      </>
                    )}
                  </button>
                  <a
                    href={broadcastLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className={isLightTheme ? "w-full flex items-center justify-center py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 font-bold text-xs transition-colors" : "w-full flex items-center justify-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md"}
                  >
                    📺 방송국 가기
                  </a>
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <div className={`col-span-full py-16 text-center ${publicTheme.emptyState}`}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>아직 등록된 선수가 없습니다.</p>
            </div>
          )}

          {players.length > 0 && filteredPlayersForGallery.length === 0 && (
            <div className={`col-span-full py-16 text-center ${publicTheme.emptyState}`}>
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMatchesView = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className={`text-3xl font-bold flex items-center ${publicTheme.heading}`}>
          <Swords className={`w-8 h-8 mr-3 ${isLightTheme ? "text-green-600" : "text-green-400"}`} /> 경기 기록
        </h2>
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${publicTheme.mutedText}`} />
          <input
            type="text"
            value={matchSearchInput}
            onChange={(e) => setMatchSearchInput(e.target.value)}
            placeholder="게임명 또는 참가 선수 검색"
            className={publicTheme.searchInput}
          />
        </div>
      </div>
      <div className="grid gap-6">
        {filteredPublishedMatches.map((match) => {
          if (match.matchType === "team") {
            const sortedTeams = getNormalizedTeamMatchResults(match);
            const setScoreLabel = getTeamMatchSetScoreLabel(sortedTeams);

            return (
              <div id={`match-card-${match.id}`} key={match.id} className={`rounded-xl p-6 border transition flex flex-col ${isLightTheme ? "bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]" : "bg-gray-800 shadow-md"} ${selectedMatchId === match.id ? (isLightTheme ? "border-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_22px_40px_rgba(16,185,129,0.14)]" : "border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_0_18px_rgba(34,197,94,0.18)]") : (isLightTheme ? "border-slate-200" : "border-gray-700")}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <div className="flex items-center flex-wrap gap-3">
                    <h3 className={`text-2xl font-bold ${publicTheme.heading}`}>{match.gameName}</h3>
                    <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-bold flex items-center shadow-sm border ${isLightTheme ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-indigo-900/50 text-indigo-300 border-indigo-700/50"}`}>
                      <Users className="w-4 h-4 mr-1.5" /> 팀전
                    </span>
                      {setScoreLabel && (
                        <span className={`px-3 py-1 rounded text-sm font-bold shadow-sm border ${isLightTheme ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-sky-900/40 text-sky-200 border-sky-700/50"}`}>
                          세트 결과 {setScoreLabel}
                        </span>
                      )}
                      {match.hasFunding && (
                        <button 
                          onClick={() => setExpandedFundingMatchId(expandedFundingMatchId === match.id ? null : match.id)}
                          className={`px-3 py-1 rounded text-sm font-bold flex items-center transition shadow-sm border ${isLightTheme ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" : "bg-yellow-900/40 text-yellow-400 border-yellow-700/50 hover:bg-yellow-800/60"}`}
                        >
                          <Coins className="w-4 h-4 mr-1.5" /> 펀딩 결산 {expandedFundingMatchId === match.id ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className={`text-base ${publicTheme.mutedText}`}>{match.date}</span>
                </div>

                <div className="flex flex-col gap-4 order-3">
                  {sortedTeams.map((team, idx) => (
                    <div key={idx} className={`p-5 rounded-xl border transition-all duration-200 ${team.rank === 1 ? (isLightTheme ? "bg-white border-yellow-400 shadow-md hover:-translate-y-1 hover:shadow-lg" : "bg-yellow-500/10 border-yellow-500/30") : (isLightTheme ? "bg-white border-slate-200 shadow-sm hover:-translate-y-1 hover:border-slate-300 hover:shadow-md" : "bg-gray-700/30 border-gray-600")}`}>
                      <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isLightTheme ? "border-slate-200" : "border-gray-600/50"}`}>
                        <div className="flex items-center gap-2">
                          {team.rank === 1 && (
                            <Crown className={`w-4 h-4 ${isLightTheme ? "text-yellow-500 fill-yellow-500" : "text-yellow-400"}`} />
                          )}
                          <span className={`text-lg ${team.rank === 1 ? (isLightTheme ? "text-yellow-600 font-black" : "text-yellow-400 font-black") : (isLightTheme ? "text-slate-700 font-bold" : "text-gray-300 font-bold")}`}>{team.rank}위 팀</span>
                          {team.setWins !== "" && team.setWins !== null && team.setWins !== undefined && (
                            <span className={`px-2.5 py-1 rounded text-xs font-black border ${isLightTheme ? "border-sky-200 bg-sky-50 text-sky-700" : "border-sky-500/30 bg-sky-500/10 text-sky-200"}`}>
                              {team.setWins}승
                            </span>
                          )}
                        </div>
                        <span className={`text-sm px-3 py-1 rounded-full border ${team.scoreChange >= 0 ? (isLightTheme ? "border-green-200 bg-green-50 text-green-700 font-black" : "bg-green-500/20 text-green-400 font-bold") : (isLightTheme ? "border-rose-200 bg-rose-50 text-rose-700 font-black" : "bg-red-500/20 text-red-400 font-bold")}`}>
                          {team.scoreChange > 0 ? "+" : ""}{team.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {team.players.map((p) => (
                          <div key={p} onClick={() => setSelectedPlayer(p)} className={`flex items-center px-4 py-2 rounded-full border shadow-sm cursor-pointer transition group ${isLightTheme ? "bg-white border-slate-200 hover:border-emerald-200" : "bg-gray-900 border-gray-700 hover:border-green-400"}`}>
                            <img src={getAvatarSrc(p)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${p}`; }} alt="avatar" className={`w-8 h-8 rounded-full mr-2.5 object-cover border ${isLightTheme ? "bg-slate-100 border-slate-200" : "bg-gray-800 border-gray-600"}`} />
                            <span className={`text-base font-bold ${isLightTheme ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-green-400"}`}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {expandedFundingMatchId === match.id && match.hasFunding && (
                  <div className={`order-2 mt-4 mb-4 p-5 border rounded-xl animate-in fade-in slide-in-from-top-2 ${isLightTheme ? "bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_34px_rgba(15,23,42,0.08)]" : "bg-gradient-to-b from-gray-800 to-gray-900 border-yellow-700/40 shadow-inner"}`}>
                     <div className={`text-center mb-5 pb-4 border-b ${isLightTheme ? "border-amber-100" : "border-gray-700/50"}`}>
                        <span className={`text-sm font-bold ${publicTheme.mutedText}`}>총 펀딩 규모</span>
                        <div className={`text-3xl font-black mt-1 flex items-center justify-center ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>
                          <Star className={`w-6 h-6 mr-2 ${isLightTheme ? "fill-amber-600 text-amber-600" : "fill-yellow-400 text-yellow-400"}`} />
                          {(match.totalFunding || 0).toLocaleString()} 개
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedTeams.map((team, idx) => {
                           const fAmount = Number(team.fundingAmount) || 0;
                           const fRatio = Number(team.fundingRatio) || 0;
                           return (
                             <div key={idx} className={`flex flex-col p-4 rounded-lg border shadow-sm ${isLightTheme ? "bg-white border-amber-100" : "bg-gray-800 border-gray-700"}`}>
                                <div className={`flex justify-between items-center mb-3 pb-3 border-b ${isLightTheme ? "border-slate-100" : "border-gray-700/80"}`}>
                                   <span className={`text-base font-bold ${team.rank===1 ? (isLightTheme ? "text-amber-700" : "text-yellow-400") : (isLightTheme ? "text-slate-700" : "text-gray-300")}`}>{team.rank}위 팀 상금</span>
                                    <div className="text-right">
                                       <span className={`font-black text-xl ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>{Number(fAmount).toLocaleString()}개</span>
                                       {fRatio > 0 && <span className={`text-xs font-bold ml-1.5 ${publicTheme.mutedText}`}>({fRatio}%)</span>}
                                    </div>
                                 </div>
                                 <div className="flex flex-wrap gap-1.5">
                                    {team.players.map(p => (
                                       <span key={p} className={`text-sm font-medium px-2.5 py-1 rounded ${isLightTheme ? "text-slate-700 bg-slate-100" : "text-gray-200 bg-gray-700"}`}>{p}</span>
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
            <div id={`match-card-${match.id}`} key={match.id} className={`rounded-xl p-6 border transition flex flex-col ${isLightTheme ? "bg-white shadow-[0_18px_42px_rgba(15,23,42,0.08)]" : "bg-gray-800 shadow-md"} ${selectedMatchId === match.id ? (isLightTheme ? "border-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_22px_40px_rgba(16,185,129,0.14)]" : "border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.35),0_0_18px_rgba(34,197,94,0.18)]") : (isLightTheme ? "border-slate-200" : "border-gray-700")}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div className="flex items-center flex-wrap gap-3">
                  <h3 className={`text-2xl font-bold ${publicTheme.heading}`}>{match.gameName}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-bold flex items-center shadow-sm border ${isLightTheme ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-gray-700 text-gray-300 border-gray-600"}`}>
                      <User className="w-4 h-4 mr-1.5" /> 개인전
                    </span>
                    {match.hasFunding && (
                      <button 
                        onClick={() => setExpandedFundingMatchId(expandedFundingMatchId === match.id ? null : match.id)}
                        className={`px-3 py-1 rounded text-sm font-bold flex items-center transition shadow-sm border ${isLightTheme ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" : "bg-yellow-900/40 text-yellow-400 border-yellow-700/50 hover:bg-yellow-800/60"}`}
                      >
                        <Coins className="w-4 h-4 mr-1.5" /> 펀딩 결산 {expandedFundingMatchId === match.id ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>}
                      </button>
                    )}
                  </div>
                </div>
                <span className={`text-base ${publicTheme.mutedText}`}>{match.date}</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 order-3">
                {[...(match.results || [])].sort((a, b) => a.rank - b.rank).map((result, idx) => (
                    <div key={idx} onClick={() => setSelectedPlayer(result.playerName)} className={`p-4 rounded-xl border flex flex-col justify-center cursor-pointer transition-all duration-200 group hover:-translate-y-1 ${result.rank === 1 ? (isLightTheme ? "bg-white border-yellow-400 shadow-md hover:shadow-lg" : "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-400") : (isLightTheme ? "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md" : "bg-gray-700/30 border-gray-600 hover:border-green-400 hover:shadow-lg")}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`flex items-center gap-1.5 text-lg ${result.rank === 1 ? (isLightTheme ? "text-yellow-600 font-black" : "text-yellow-400 font-black") : (isLightTheme ? "text-slate-600 font-bold" : "text-gray-300 font-bold")}`}>
                          {result.rank === 1 && (
                            <Crown className={`w-4 h-4 ${isLightTheme ? "text-yellow-500 fill-yellow-500" : "text-yellow-400"}`} />
                          )}
                          <span>{result.rank}위</span>
                        </div>
                        <span className={`text-sm px-3 py-1 rounded-full border ${result.scoreChange >= 0 ? (isLightTheme ? "border-green-200 bg-green-50 text-green-700 font-black" : "bg-green-500/20 text-green-400 font-bold") : (isLightTheme ? "border-rose-200 bg-rose-50 text-rose-700 font-black" : "bg-red-500/20 text-red-400 font-bold")}`}>
                          {result.scoreChange > 0 ? "+" : ""}{result.scoreChange} pt
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img src={getAvatarSrc(result.playerName)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${result.playerName}`; }} alt="avatar" className={`w-10 h-10 rounded-full object-cover border ${isLightTheme ? "bg-slate-100 border-slate-200" : "bg-gray-800 border-gray-600"}`} />
                        <span className={`font-bold truncate text-xl transition ${isLightTheme ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-green-400"}`}>{result.playerName}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {expandedFundingMatchId === match.id && match.hasFunding && (
                <div className={`order-2 mt-4 mb-4 p-5 border rounded-xl animate-in fade-in slide-in-from-top-2 ${isLightTheme ? "bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_34px_rgba(15,23,42,0.08)]" : "bg-gradient-to-b from-gray-800 to-gray-900 border-yellow-700/40 shadow-inner"}`}>
                   <div className={`text-center mb-5 pb-4 border-b ${isLightTheme ? "border-amber-100" : "border-gray-700/50"}`}>
                      <span className={`text-sm font-bold ${publicTheme.mutedText}`}>총 펀딩 규모</span>
                      <div className={`text-3xl font-black mt-1 flex items-center justify-center ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>
                        <Star className={`w-6 h-6 mr-2 ${isLightTheme ? "fill-amber-600 text-amber-600" : "fill-yellow-400 text-yellow-400"}`} />
                        {(match.totalFunding || 0).toLocaleString()} 개
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[...(match.results || [])].sort((a,b) => a.rank - b.rank).map((r, i) => (
                         <div key={i} className={`flex justify-between items-center p-3.5 rounded-lg border shadow-sm transition ${isLightTheme ? "bg-white border-amber-100 hover:border-amber-200" : "bg-gray-800 border-gray-700 hover:border-yellow-500/30"}`}>
                            <div className="flex items-center gap-2">
                               <span className={`text-base font-black w-8 text-center ${r.rank===1 ? (isLightTheme ? "text-amber-700" : "text-yellow-400") : (isLightTheme ? "text-slate-500" : "text-gray-400")}`}>{r.rank}</span>
                               <span className={`font-bold text-lg truncate w-24 ${publicTheme.heading}`}>{r.playerName}</span>
                            </div>
                            <div className="text-right flex flex-col">
                               <span className={`font-black text-lg ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>{Number(r.fundingAmount).toLocaleString()}개</span>
                               {r.fundingRatio > 0 && <span className={`text-[10px] font-bold ${publicTheme.faintText}`}>({r.fundingRatio}%)</span>}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}

            </div>
          );
        })}
        {publishedMatches.length === 0 && <p className={`${publicTheme.mutedText} text-center py-12 text-lg`}>기록이 없습니다.</p>}
        {publishedMatches.length > 0 && filteredPublishedMatches.length === 0 && (
          <p className={`${publicTheme.mutedText} text-center py-12 text-lg`}>검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );

  const renderStatsView = () => {
    const mostWinsPlayer = [...playerStatsMap].sort((a, b) => b.winCount - a.winCount || b.points - a.points)[0];
    const mostPlayedPlayer = [...playerStatsMap].sort((a, b) => b.matchCount - a.matchCount || b.points - a.points)[0];
    const bestAvgPlayer = [...playerStatsMap].filter(p => p.matchCount > 0).sort((a, b) => b.avgScore - a.avgScore)[0];

    const SortIcon = ({ columnKey }) => {
      if (sortConfig.key !== columnKey) return <ChevronDown className={`w-4 h-4 ml-1 opacity-30 group-hover:opacity-100 transition ${publicTheme.mutedText}`} />;
      return sortConfig.direction === 'asc'
        ? <ChevronUp className={`w-4 h-4 ml-1 ${isLightTheme ? "text-emerald-600" : "text-green-400"}`} />
        : <ChevronDown className={`w-4 h-4 ml-1 ${isLightTheme ? "text-emerald-600" : "text-green-400"}`} />;
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className={`text-3xl font-bold flex items-center mb-3 ${publicTheme.heading}`}>
            <TrendingUp className={`w-8 h-8 mr-3 ${isLightTheme ? "text-indigo-600" : "text-indigo-400"}`} /> 종합 통계 대시보드
          </h2>
          <p className={`text-base ${publicTheme.mutedText}`}>매주 새로운 게임, 새로운 참가자들이 만들어내는 치열한 리그의 누적 기록입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`rounded-xl p-6 flex flex-col items-center relative overflow-hidden ${isLightTheme ? "bg-white border border-slate-200 shadow-sm" : "bg-gradient-to-br from-yellow-900/40 to-gray-800 border border-yellow-700/50"}`}>
            <div className="absolute -right-4 -top-4 opacity-10"><Crown className="w-40 h-40 text-yellow-500" /></div>
            <Crown className={`w-10 h-10 mb-3 ${isLightTheme ? "text-amber-600" : "text-yellow-400"}`} />
            <h3 className={`text-lg font-bold mb-1 ${isLightTheme ? "text-slate-700" : "text-gray-300"}`}>👑 종합 우승왕</h3>
            <p className={`text-xs md:text-sm mb-4 text-center break-keep ${isLightTheme ? "text-amber-700/80" : "text-yellow-500/70"}`}>1위를 가장 많이 달성한 유저</p>
            {mostWinsPlayer && mostWinsPlayer.winCount > 0 ? (
              <>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPlayer(mostWinsPlayer.name)}>
                  <img src={getAvatarSrc(mostWinsPlayer.name)} alt="avatar" className={`w-12 h-12 rounded-full object-cover border-2 group-hover:scale-110 transition ${isLightTheme ? "bg-white border-amber-200" : "bg-gray-900 border-yellow-500/50"}`} />
                  <span className={`text-2xl font-black transition ${isLightTheme ? "text-slate-900 group-hover:text-amber-700" : "text-white group-hover:text-yellow-400"}`}>{mostWinsPlayer.name}</span>
                </div>
                <p className={`font-bold mt-4 px-4 py-1.5 rounded-full text-base ${isLightTheme ? "text-amber-700 bg-amber-100" : "text-yellow-400 bg-yellow-900/30"}`}>총 {mostWinsPlayer.winCount}회 우승</p>
              </>
            ) : (<span className={`${publicTheme.faintText} mt-2 text-base`}>기록 없음</span>)}
          </div>

          <div className={`rounded-xl p-6 flex flex-col items-center relative overflow-hidden ${isLightTheme ? "bg-white border border-slate-200 shadow-sm" : "bg-gradient-to-br from-emerald-900/40 to-gray-800 border border-emerald-700/50"}`}>
            <div className="absolute -right-4 -top-4 opacity-10"><Clover className="w-40 h-40 text-emerald-500" /></div>
            <Clover className={`w-10 h-10 mb-3 ${isLightTheme ? "text-emerald-600" : "text-emerald-400"}`} />
            <h3 className={`text-lg font-bold mb-1 ${isLightTheme ? "text-slate-700" : "text-gray-300"}`}>🍀 선택받은 자</h3>
            <p className={`text-xs md:text-sm mb-4 text-center break-keep ${isLightTheme ? "text-emerald-700/80" : "text-emerald-500/70"}`}>경기에 가장 많이 참가한 유저</p>
            {mostPlayedPlayer && mostPlayedPlayer.matchCount > 0 ? (
              <>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPlayer(mostPlayedPlayer.name)}>
                  <img src={getAvatarSrc(mostPlayedPlayer.name)} alt="avatar" className={`w-12 h-12 rounded-full object-cover border-2 group-hover:scale-110 transition ${isLightTheme ? "bg-white border-emerald-200" : "bg-gray-900 border-emerald-500/50"}`} />
                  <span className={`text-2xl font-black transition ${isLightTheme ? "text-slate-900 group-hover:text-emerald-700" : "text-white group-hover:text-emerald-400"}`}>{mostPlayedPlayer.name}</span>
                </div>
                <p className={`font-bold mt-4 px-4 py-1.5 rounded-full text-base ${isLightTheme ? "text-emerald-700 bg-emerald-100" : "text-emerald-400 bg-emerald-900/30"}`}>총 {mostPlayedPlayer.matchCount}회 참가</p>
              </>
            ) : (<span className={`${publicTheme.faintText} mt-2 text-base`}>기록 없음</span>)}
          </div>

          <div className={`rounded-xl p-6 flex flex-col items-center relative overflow-hidden ${isLightTheme ? "bg-white border border-slate-200 shadow-sm" : "bg-gradient-to-br from-cyan-900/40 to-gray-800 border border-cyan-700/50"}`}>
            <div className="absolute -right-4 -top-4 opacity-10"><Gem className="w-40 h-40 text-cyan-500" /></div>
            <Gem className={`w-10 h-10 mb-3 ${isLightTheme ? "text-sky-600" : "text-cyan-400"}`} />
            <h3 className={`text-lg font-bold mb-1 ${isLightTheme ? "text-slate-700" : "text-gray-300"}`}>💎 최고 효율 플레이어</h3>
            <p className={`text-xs md:text-sm mb-4 text-center break-keep ${isLightTheme ? "text-sky-700/80" : "text-cyan-500/70"}`}>경기당 평균 획득 점수가 가장 높은 유저</p>
            {bestAvgPlayer && bestAvgPlayer.matchCount > 0 ? (
              <>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedPlayer(bestAvgPlayer.name)}>
                  <img src={getAvatarSrc(bestAvgPlayer.name)} alt="avatar" className={`w-12 h-12 rounded-full object-cover border-2 group-hover:scale-110 transition ${isLightTheme ? "bg-white border-sky-200" : "bg-gray-900 border-cyan-500/50"}`} />
                  <span className={`text-2xl font-black transition ${isLightTheme ? "text-slate-900 group-hover:text-sky-700" : "text-white group-hover:text-cyan-400"}`}>{bestAvgPlayer.name}</span>
                </div>
                <p className={`font-bold mt-4 px-4 py-1.5 rounded-full text-base ${isLightTheme ? "text-blue-700 bg-blue-100" : "text-cyan-400 bg-cyan-900/30"}`}>평균 {bestAvgPlayer.avgScore} pt</p>
              </>
            ) : (<span className={`${publicTheme.faintText} mt-2 text-base`}>기록 없음</span>)}
          </div>
        </div>

        <div className={publicTheme.tableShell}>
          <div className={publicTheme.tableHeaderWrap}>
            <h3 className={`text-xl font-bold flex items-center ${publicTheme.heading}`}>
              <BarChart3 className={`w-6 h-6 mr-2 ${isLightTheme ? "text-green-600" : "text-green-400"}`} /> 참가자 전체 통계 리스트
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className={isLightTheme ? "bg-slate-100 text-slate-600 uppercase" : publicTheme.tableHead}>
                <tr>
                  <th scope="col" className={`px-6 py-5 rounded-tl-lg ${isLightTheme ? "font-bold tracking-[0.08em]" : ""}`}>순위</th>
                  <th scope="col" className={`px-6 py-5 ${isLightTheme ? "font-bold tracking-[0.08em]" : ""}`}>선수명</th>
                  <th scope="col" className={`px-6 py-5 cursor-pointer group select-none transition ${isLightTheme ? "font-bold tracking-[0.08em] hover:bg-slate-200/80" : "hover:bg-gray-800"}`} onClick={() => requestSort('matchCount')}>
                    <div className="flex items-center justify-center">참가 횟수 <SortIcon columnKey="matchCount" /></div>
                  </th>
                  <th scope="col" className={`px-6 py-5 cursor-pointer group select-none transition ${isLightTheme ? "font-bold tracking-[0.08em] hover:bg-slate-200/80" : "hover:bg-gray-800"}`} onClick={() => requestSort('winCount')}>
                    <div className="flex items-center justify-center">1위 횟수 <SortIcon columnKey="winCount" /></div>
                  </th>
                  <th scope="col" className={`px-6 py-5 cursor-pointer group select-none transition ${isLightTheme ? "font-bold tracking-[0.08em] hover:bg-slate-200/80" : "hover:bg-gray-800"}`} onClick={() => requestSort('avgScore')}>
                    <div className="flex items-center justify-center">평균 획득 점수 <SortIcon columnKey="avgScore" /></div>
                  </th>
                  <th scope="col" className={`px-6 py-5 cursor-pointer group select-none transition rounded-tr-lg ${isLightTheme ? "font-bold tracking-[0.08em] hover:bg-slate-200/80" : "hover:bg-gray-800"}`} onClick={() => requestSort('points')}>
                    <div className="flex items-center justify-end">총 획득 점수 <SortIcon columnKey="points" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayerStats.length > 0 ? (
                  sortedPlayerStats.map((player, idx) => (
                    <tr key={player.id} className={publicTheme.tableRow} onClick={() => setSelectedPlayer(player.name)}>
                      <td className={`px-6 py-5 font-bold text-lg ${publicTheme.mutedText}`}>{idx + 1}</td>
                      <td className={`px-6 py-5 font-bold flex items-center gap-4 text-lg ${publicTheme.heading}`}>
                        <img src={getAvatarSrc(player.name)} alt={player.name} className={`w-8 h-8 rounded-full object-cover border ${isLightTheme ? "bg-slate-100 border-slate-200" : "bg-gray-900 border-gray-600"}`} />
                        {player.name}
                      </td>
                      <td className={`px-6 py-5 text-center text-lg ${isLightTheme ? "text-slate-600" : "text-gray-300"}`}>{player.matchCount}회</td>
                      <td className={`px-6 py-5 text-center text-lg ${isLightTheme ? "text-slate-600" : "text-gray-300"}`}>
                        {player.winCount > 0 ? <span className={`font-bold ${isLightTheme ? "text-amber-600" : "text-yellow-400"}`}>{player.winCount}회</span> : "0회"}
                      </td>
                      <td className={`px-6 py-5 text-center font-medium text-lg ${isLightTheme ? "text-blue-600" : "text-cyan-400"}`}>{player.avgScore} pt</td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm ${isLightTheme ? "bg-emerald-50 text-emerald-700 font-black" : "font-black text-green-400 text-xl"}`}>{player.points} pt</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className={`px-6 py-12 text-center text-lg ${publicTheme.emptyState}`}>아직 등록된 참가자 통계가 없습니다.</td></tr>
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
      "S": Math.ceil(totalPlayers * 0.15),
      "A+": Math.ceil(totalPlayers * 0.30),
      "A": Math.ceil(totalPlayers * 0.45),
      "B": Math.ceil(totalPlayers * 0.65),
      "C": Math.ceil(totalPlayers * 0.85),
      "D": totalPlayers
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
      const playersInTier = rankedPlayers.filter(p => getTierIdByRank(p.rank) === tier.id);
      let startRank = 1;
      if (index > 0) {
         const prevTierId = TIER_SETTINGS[index - 1].id;
         startRank = cutoffs[prevTierId] + 1;
      }
      const endRank = cutoffs[tier.id];
      let rankLabel = "";
      if (totalPlayers > 0) {
         if (startRank > endRank) { rankLabel = "(공석)"; } 
         else if (startRank === endRank) { rankLabel = `(${startRank}위)`; } 
         else { rankLabel = `(${startRank}위 ~ ${endRank}위)`; }
      } else { rankLabel = "(0명)"; }
      return { ...tier, players: playersInTier, rankLabel };
    });

    const tierPointGuide = isLightTheme
      ? [
          { label: "1등", points: "+30pt", accentClass: "border-amber-200 bg-amber-50 text-amber-800 shadow-[0_12px_28px_rgba(217,119,6,0.08)]", valueClass: "text-amber-700" },
          { label: "2등", points: "+20pt", accentClass: "border-slate-200 bg-white text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.06)]", valueClass: "text-slate-700" },
          { label: "3등", points: "+10pt", accentClass: "border-orange-200 bg-orange-50 text-orange-800 shadow-[0_12px_28px_rgba(234,88,12,0.08)]", valueClass: "text-orange-700" },
          { label: "그 외 참가자", points: "+3pt", accentClass: "border-emerald-200 bg-emerald-50 text-emerald-800", valueClass: "text-emerald-700" },
          { label: "최하위", points: "0pt", accentClass: "border-slate-200 bg-slate-50 text-slate-600", valueClass: "text-slate-500" },
        ]
      : [
          { label: "1등", points: "+30pt", accentClass: "border-yellow-400/55 bg-yellow-500/10 text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.08)]", valueClass: "text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]" },
          { label: "2등", points: "+20pt", accentClass: "border-slate-300/55 bg-slate-200/5 text-slate-100 shadow-[0_0_16px_rgba(226,232,240,0.06)]", valueClass: "text-slate-200" },
          { label: "3등", points: "+10pt", accentClass: "border-orange-400/55 bg-orange-500/8 text-orange-100 shadow-[0_0_16px_rgba(251,146,60,0.06)]", valueClass: "text-orange-300" },
          { label: "그 외 참가자", points: "+3pt", accentClass: "border-emerald-400/35 bg-transparent text-emerald-100", valueClass: "text-emerald-300" },
          { label: "최하위", points: "0pt", accentClass: "border-gray-600/35 bg-gray-900/40 text-gray-300", valueClass: "text-gray-400" },
        ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-2xl font-bold flex items-center ${publicTheme.heading}`}>
              <Trophy className={`w-6 h-6 mr-2 ${isLightTheme ? "text-amber-600" : "text-yellow-400"}`} /> 공식 실력 티어표
            </h2>
            <p className={`text-sm mt-1 ${publicTheme.mutedText}`}>상대평가(백분율) 기준에 따라 전체 등수로 티어가 실시간 결정됩니다.</p>
          </div>
        </div>

        <div className={publicTheme.heroTier}>
          <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
            <Star className="w-28 h-28 text-amber-300" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${isLightTheme ? "border-amber-200 bg-white shadow-[0_12px_24px_rgba(217,119,6,0.08)]" : "border-amber-400/30 bg-amber-500/12 shadow-[0_0_18px_rgba(251,191,36,0.12)]"}`}>
                <Trophy className={`h-5 w-5 ${isLightTheme ? "text-amber-600" : "text-amber-300"}`} />
              </div>
              <div className="min-w-0">
                <h3 className={`text-lg font-black ${publicTheme.heading}`}>티어는 이렇게 정해져요</h3>
                <p className={`mt-1 text-sm leading-6 break-keep ${publicTheme.bodyText}`}>
                  경기 결과에 따라 아래 기준으로 포인트가 누적되며, 누적 포인트를 바탕으로 티어가 정해집니다.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {tierPointGuide.map((rule) => (
                <div
                  key={rule.label}
                  className={`rounded-xl border px-4 py-3 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${rule.accentClass}`}
                >
                  <div className="text-xs font-black tracking-[0.08em] uppercase opacity-80">{rule.label}</div>
                  <div className={`mt-1 text-2xl font-black ${rule.valueClass}`}>{rule.points}</div>
                </div>
              ))}
            </div>

            <p className={`mt-4 text-xs leading-5 break-keep ${publicTheme.mutedText}`}>
              해당 기준은 왁굳님의 의견에 따라 언제든지 변경될 수 있습니다.
            </p>
          </div>
        </div>

        <div className={`${isLightTheme ? "bg-slate-100 border-slate-200 shadow-[0_18px_42px_rgba(15,23,42,0.08)]" : "bg-gray-900 border-gray-700"} rounded-xl border overflow-hidden flex flex-col gap-1 p-1`}>
          {categorizedPlayers.map((tier) => {
            const isEmperor = tier.id === "S+";
            return (
            <div key={tier.id} className={`flex flex-col md:flex-row rounded-lg overflow-hidden min-h-[100px] relative border ${isLightTheme ? "bg-white border-slate-200" : "bg-gray-800 border-gray-700"}`}>
              
              {/* ★ S+ 티어가 들어간 왼쪽 박스에만 황금빛 오라 적용 (오른쪽 테두리는 깔끔하게 회색으로 통일) ★ */}
              <div className={`md:w-28 w-full flex-shrink-0 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r shadow-inner relative z-10 overflow-hidden ${
                isEmperor 
                  ? (isLightTheme ? 'border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50 to-white shadow-[0_12px_28px_rgba(217,119,6,0.12)]' : 'border-gray-900 bg-gradient-to-br from-gray-900 via-black to-yellow-900/40 shadow-[0_0_20px_rgba(250,204,21,0.4)]')
                  : (isLightTheme
                      ? (tier.id === "S" ? "border-red-200 bg-red-50" : tier.id === "A+" ? "border-orange-200 bg-orange-50" : tier.id === "A" ? "border-orange-100 bg-orange-50/70" : tier.id === "B" ? "border-amber-200 bg-amber-50" : tier.id === "C" ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50")
                      : `border-gray-900 ${tier.color}`)
              }`}>
                {/* 어둠 속에서 뿜어져 나오는 네온 빛반사 효과 */}
                {isEmperor && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-500/30 via-transparent to-transparent pointer-events-none"></div>
                )}
                {/* 은은하게 빛나는 왕관 */}
                {isEmperor && <Crown className={`absolute top-2 right-2 w-4 h-4 opacity-90 ${isLightTheme ? "text-amber-600" : "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]"}`} />}
                
                {/* S+ 텍스트 자체의 황금빛 그라데이션과 그림자 */}
                <span className={`text-2xl font-extrabold text-shadow relative z-10 ${
                  isEmperor 
                    ? (isLightTheme ? 'text-amber-700' : 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]')
                    : (isLightTheme
                        ? (tier.id === "S" ? "text-red-700" : tier.id === "A+" ? "text-orange-700" : tier.id === "A" ? "text-orange-600" : tier.id === "B" ? "text-amber-700" : tier.id === "C" ? "text-emerald-700" : "text-blue-700")
                        : 'text-white')
                }`}>
                  {tier.id}
                </span>
                <span className={`text-xs font-bold mt-1 text-center relative z-10 ${isEmperor ? (isLightTheme ? "text-amber-700" : 'text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]') : (isLightTheme ? "text-slate-700" : 'text-white/90')}`}>{tier.label}</span>
                <span className={`text-[10px] mt-0.5 text-center relative z-10 ${isEmperor ? (isLightTheme ? "text-amber-600/80" : 'text-yellow-500/80') : (isLightTheme ? "text-slate-500" : 'text-white/70')}`}>{tier.rankLabel}</span>
              </div>
              
              <div className={`flex-1 p-4 flex flex-wrap gap-4 items-center ${isLightTheme ? "bg-white" : "bg-gray-800/80"}`}>
                {tier.players.length > 0 ? (
                  tier.players.map((player) => {
                    return (
                      <div key={player.id} onClick={() => setSelectedPlayer(player.name)} className="group relative flex flex-col items-center cursor-pointer">
                        <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center overflow-hidden shadow-lg transition-transform transform group-hover:scale-110 ${isLightTheme ? "bg-slate-100 border-slate-200 group-hover:border-emerald-300" : "bg-gray-700 border-gray-600 group-hover:border-green-400"}`}>
                          <img src={getAvatarSrc(player.name)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                        <span className={`mt-2 text-sm font-medium px-2 py-0.5 rounded transition-colors ${isLightTheme ? "text-slate-900 bg-slate-100 group-hover:text-emerald-700" : "text-white bg-gray-900/80 group-hover:text-green-400"}`}>{player.name}</span>
                        <span className={`text-xs font-bold mt-0.5 ${isLightTheme ? "text-emerald-700" : "text-green-400"}`}>{player.points} pt</span>
                      </div>
                    );
                  })
                ) : (
                  <span className={`text-sm italic p-2 ${publicTheme.emptyState}`}>해당 티어 플레이어 없음</span>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };


  const resetWowRaidForm = () => {
    setWowRaidForm(createEmptyWowRaidForm());
    setWowRaidAdminStatTab('damage');
    setWowRaidRosterSearchInput('');
    setWowRaidFixedSearchInput('');
    setWowRaidGuestSearchInput('');
    setWowRaidStatSearchInput('');
  };

  const handleWowRaidFormFieldChange = (field, value) => {
    setWowRaidForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleWowRaidParticipant = (sourceType, sourceId) => {
    if (!sourceId) return;
    const key = sourceType === 'fixed_member' ? 'fixedParticipantIds' : 'rosterParticipantIds';
    setWowRaidForm((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const nextIds = current.includes(sourceId)
        ? current.filter((id) => id !== sourceId)
        : [...current, sourceId];
      return { ...prev, [key]: nextIds };
    });
  };

  const handleAddWowRaidGuestParticipant = () => {
    setWowRaidForm((prev) => ({
      ...prev,
      guestParticipants: [...(prev.guestParticipants || []), createEmptyWowRaidGuestForm()],
    }));
  };

  const handleRemoveWowRaidGuestParticipant = (guestId) => {
    setWowRaidForm((prev) => ({
      ...prev,
      guestParticipants: (prev.guestParticipants || []).filter((participant) => participant.id !== guestId),
      stats: WOW_RAID_STAT_FIELDS.reduce((acc, field) => {
        const nextMap = { ...(prev.stats?.[field.id] || {}) };
        delete nextMap[buildWowRaidParticipantKey('guest', guestId)];
        acc[field.id] = nextMap;
        return acc;
      }, {}),
    }));
  };

  const handleWowRaidGuestFieldChange = (guestId, field, value) => {
    setWowRaidForm((prev) => ({
      ...prev,
      guestParticipants: (prev.guestParticipants || []).map((participant) => {
        if (participant.id !== guestId) return participant;
        if (field === 'jobClass') {
          const nextJobClass = normalizeWowJobClassKey(value);
          return {
            ...participant,
            jobClass: nextJobClass,
            mainSpec: '',
            availableSpecs: [],
            preferredPositions: [],
          };
        }
        if (field === 'mainSpec') {
          const nextMainSpec = getWowSpecOptions(participant.jobClass).includes(value) ? value : '';
          return {
            ...participant,
            mainSpec: nextMainSpec,
            availableSpecs: nextMainSpec ? [nextMainSpec] : [],
            preferredPositions: getRecommendedPreferredPositionsBySpec(participant.jobClass, nextMainSpec),
          };
        }
        if (field === 'preferredPositions') {
          return { ...participant, preferredPositions: normalizePreferredPositions(value) };
        }
        if (field === 'imageMode') {
          return { ...participant, imageMode: value === 'custom' ? 'custom' : 'default', imageUrl: value === 'custom' ? participant.imageUrl : '' };
        }
        if (field === 'raidGroupNumber') {
          return participant;
        }
        return { ...participant, [field]: value };
      }),
    }));
  };

  const handleWowRaidStatValueChange = (categoryId, participantId, value) => {
    setWowRaidForm((prev) => {
      const nextStats = { ...prev.stats, [categoryId]: { ...(prev.stats?.[categoryId] || {}) } };
      if (value === '' || Number(value) <= 0) {
        delete nextStats[categoryId][participantId];
      } else {
        nextStats[categoryId][participantId] = Number(value) || 0;
      }
      return { ...prev, stats: nextStats };
    });
  };

  const handleEditWowRaid = (raid) => {
    if (!raid) return;
    setWowRaidForm({
      id: raid.id,
      raidName: raid.raidName || '',
      imageUrl: raid.imageUrl || '',
      raidDate: raid.raidDate || '',
      clearTime: raid.clearTime || '',
      isCleared: raid.isCleared !== false,
      isPublished: !!raid.isPublished,
      note: raid.note || '',
      raidGroupNumber: `${raid.raidGroupNumber ?? ''}`.replace(/[^0-9]/g, ''),
      rosterParticipantIds: Array.isArray(raid.rosterParticipantIds) ? raid.rosterParticipantIds : raid.participants.filter((participant) => participant.sourceType === 'wow_roster').map((participant) => participant.sourceId),
      fixedParticipantIds: Array.isArray(raid.fixedParticipantIds) ? raid.fixedParticipantIds : raid.participants.filter((participant) => participant.sourceType === 'fixed_member').map((participant) => participant.sourceId),
      guestParticipants: Array.isArray(raid.guestParticipants) ? raid.guestParticipants.map(normalizeWowRaidGuestParticipant) : raid.participants.filter((participant) => participant.sourceType === 'guest').map((participant) => normalizeWowRaidGuestParticipant({
        id: participant.sourceId || participant.id,
        displayName: participant.displayName || participant.streamerName,
        wowNickname: participant.wowNickname,
        imageMode: participant.imageUrl && participant.imageUrl !== getDefaultWowRaidGuestAvatar(participant) ? 'custom' : 'default',
        imageUrl: participant.imageUrl && participant.imageUrl !== getDefaultWowRaidGuestAvatar(participant) ? participant.imageUrl : '',
        jobClass: participant.jobClass,
        mainSpec: participant.mainSpec,
        availableSpecs: participant.availableSpecs,
        preferredPositions: participant.preferredPositions,
      })),
      stats: {
        damage: { ...(raid.stats?.damage || {}) },
        damageTaken: { ...(raid.stats?.damageTaken || {}) },
        healing: { ...(raid.stats?.healing || {}) },
        mitigated: { ...(raid.stats?.mitigated || {}) },
      },
    });
    setAdminInnerTab('wow');
  };

  const handleDeleteWowRaid = async (raidId) => {
    if (!raidId) return;
    if (!window.confirm('이 레이드 기록을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wow_raids', raidId));
      showToast('WOW 레이드 기록을 삭제했습니다.');
      if (wowRaidForm.id === raidId) resetWowRaidForm();
      if (selectedWowRaidId === raidId) setSelectedWowRaidId(null);
    } catch (error) {
      console.error(error);
      showToast('WOW 레이드 기록을 삭제하지 못했습니다.', 'error');
    }
  };

  const handleSaveWowRaid = async () => {
    if (!wowRaidForm.raidName.trim()) {
      showToast('레이드 이름을 입력해주세요.', 'error');
      return;
    }
    if (!wowRaidForm.raidDate) {
      showToast('진행 날짜를 입력해주세요.', 'error');
      return;
    }
    if (!`${wowRaidForm.raidGroupNumber || ''}`.replace(/[^0-9]/g, '')) {
      showToast('군 번호를 입력해주세요.', 'error');
      return;
    }
    if (wowRaidFormParticipants.length === 0) {
      showToast('참가자를 한 명 이상 선택해주세요.', 'error');
      return;
    }

    const participantIds = wowRaidFormParticipants.map((participant) => participant.id);
    const nextStats = WOW_RAID_STAT_FIELDS.reduce((acc, field) => {
      const raw = wowRaidForm.stats?.[field.id] || {};
      acc[field.id] = participantIds.reduce((innerAcc, participantId) => {
        const safeValue = Number(raw?.[participantId]) || 0;
        if (safeValue > 0) innerAcc[participantId] = safeValue;
        return innerAcc;
      }, {});
      return acc;
    }, {});

    const payload = {
      raidName: wowRaidForm.raidName.trim(),
      imageUrl: wowRaidForm.imageUrl.trim(),
      raidDate: wowRaidForm.raidDate,
      clearTime: wowRaidForm.clearTime.trim(),
      isCleared: !!wowRaidForm.isCleared,
      isPublished: !!wowRaidForm.isPublished,
      note: wowRaidForm.note.trim(),
      raidGroupNumber: `${wowRaidForm.raidGroupNumber || ''}`.replace(/[^0-9]/g, ''),
      rosterParticipantIds: [...wowRaidForm.rosterParticipantIds],
      fixedParticipantIds: [...wowRaidForm.fixedParticipantIds],
      guestParticipants: (wowRaidForm.guestParticipants || []).map((participant) => normalizeWowRaidGuestParticipant(participant)),
      participants: wowRaidFormParticipants,
      stats: nextStats,
      updatedAt: new Date().toISOString(),
    };

    try {
      setIsWowRaidSaving(true);
      if (wowRaidForm.id) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wow_raids', wowRaidForm.id), payload);
        showToast('WOW 레이드 기록을 수정했습니다.');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wow_raids'), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        showToast('WOW 레이드 기록을 생성했습니다.');
      }
      resetWowRaidForm();
    } catch (error) {
      console.error(error);
      showToast('WOW 레이드 기록을 저장하지 못했습니다.', 'error');
    } finally {
      setIsWowRaidSaving(false);
    }
  };

  const resetWowDungeonTierForm = () => {
    setWowDungeonTierForm(createEmptyWowDungeonTierForm());
  };

  const handleWowDungeonTierFormFieldChange = (field, value) => {
    setWowDungeonTierForm((prev) => ({
      ...prev,
      [field]: field === "expansionType" ? normalizeWowDungeonExpansionType(value) : value,
    }));
  };

  const handleWowDungeonTierVideoUrlChange = (index, value) => {
    setWowDungeonTierForm((prev) => {
      const nextVideoUrls = Array.isArray(prev.videoUrls) && prev.videoUrls.length > 0
        ? [...prev.videoUrls]
        : createWowDungeonTierFormVideoUrls();
      nextVideoUrls[index] = value;
      return {
        ...prev,
        videoUrls: nextVideoUrls,
      };
    });
  };

  const handleAddWowDungeonTierVideoUrlField = () => {
    setWowDungeonTierForm((prev) => ({
      ...prev,
      videoUrls: [
        ...(Array.isArray(prev.videoUrls) && prev.videoUrls.length > 0
          ? prev.videoUrls
          : createWowDungeonTierFormVideoUrls()),
        "",
      ],
    }));
  };

  const handleRemoveWowDungeonTierVideoUrlField = (index) => {
    setWowDungeonTierForm((prev) => {
      const currentVideoUrls = Array.isArray(prev.videoUrls) && prev.videoUrls.length > 0
        ? [...prev.videoUrls]
        : createWowDungeonTierFormVideoUrls();

      if (currentVideoUrls.length <= 1) {
        return {
          ...prev,
          videoUrls: [""],
        };
      }

      const nextVideoUrls = currentVideoUrls.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...prev,
        videoUrls: nextVideoUrls.length > 0 ? nextVideoUrls : [""],
      };
    });
  };

  const handleEditWowDungeonTierItem = (item) => {
    if (!item) return;
    const normalizedItem = normalizeWowDungeonTierItem(item);
    setWowDungeonTierForm({
      id: normalizedItem.id,
      name: normalizedItem.name,
      imageUrl: normalizedItem.imageUrl,
      expansionType: normalizedItem.expansionType,
      videoUrls: createWowDungeonTierFormVideoUrls(normalizedItem.videoUrls, normalizedItem.videoUrl),
    });
    setAdminInnerTab("wow");
  };

  const handleDeleteWowDungeonTierItem = async (itemId) => {
    if (!itemId) return;
    if (!window.confirm("이 던전 카드를 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "artifacts", appId, "public", "data", WOW_DUNGEON_TIER_COLLECTION, itemId));
      await updateLastModifiedTime();
      if (wowDungeonTierForm.id === itemId) resetWowDungeonTierForm();
      if (wowDungeonTierDetailItemId === itemId) {
        setWowDungeonTierDetailItemId(null);
        setWowDungeonTierDetailVideoIndex(0);
      }
      showToast("던전 카드를 삭제했습니다.");
    } catch (error) {
      console.error(error);
      showToast("던전 카드를 삭제하지 못했습니다.", "error");
    }
  };

  const handleSaveWowDungeonTierItem = async () => {
    const normalizedName = `${wowDungeonTierForm.name || ""}`.trim();
    const normalizedImageUrl = `${wowDungeonTierForm.imageUrl || ""}`.trim();
    const rawVideoUrls = Array.isArray(wowDungeonTierForm.videoUrls) ? wowDungeonTierForm.videoUrls : [];
    const trimmedVideoUrls = rawVideoUrls.map((url) => `${url || ""}`.trim());
    const normalizedVideoUrls = trimmedVideoUrls.filter((url, index, list) => url && list.indexOf(url) === index);
    const normalizedExpansionType = normalizeWowDungeonExpansionType(wowDungeonTierForm.expansionType);
    const nextDisplayOrder = wowDungeonTierItems.reduce((maxOrder, item, index) => {
      const fallbackOrder = index + 1;
      const safeOrder = Number.isFinite(item.displayOrder) ? item.displayOrder : fallbackOrder;
      return Math.max(maxOrder, safeOrder);
    }, 0) + 1;
    const hasDuplicateName = wowDungeonTierItems.some((item) => (
      item.id !== wowDungeonTierForm.id
      && (item.name || "").trim().toLowerCase() === normalizedName.toLowerCase()
    ));

    if (!normalizedName) {
      showToast("던전 이름을 입력해주세요.", "error");
      return;
    }

    if (hasDuplicateName) {
      showToast("같은 이름의 던전 카드가 이미 등록되어 있습니다.", "error");
      return;
    }

    if (!normalizedImageUrl) {
      showToast("대표 이미지 URL을 입력해주세요.", "error");
      return;
    }

    if (!/^https?:\/\//i.test(normalizedImageUrl)) {
      showToast("대표 이미지 URL은 http 또는 https로 시작해야 합니다.", "error");
      return;
    }

    const invalidVideoUrl = trimmedVideoUrls.find((url) => url && !/^https?:\/\//i.test(url));
    if (invalidVideoUrl) {
      showToast("영상 URL은 비워두거나 http 또는 https로 시작해야 합니다.", "error");
      return;
    }

    const payload = {
      name: normalizedName,
      imageUrl: normalizedImageUrl,
      expansionType: normalizedExpansionType,
      videoUrls: normalizedVideoUrls,
      videoUrl: normalizedVideoUrls[0] || "",
      updatedAt: new Date().toISOString(),
    };

    try {
      setIsWowDungeonTierSaving(true);

      if (wowDungeonTierForm.id) {
        await updateDoc(
          doc(db, "artifacts", appId, "public", "data", WOW_DUNGEON_TIER_COLLECTION, wowDungeonTierForm.id),
          payload
        );
        showToast("던전 카드를 수정했습니다.");
      } else {
        await addDoc(collection(db, "artifacts", appId, "public", "data", WOW_DUNGEON_TIER_COLLECTION), {
          ...payload,
          displayOrder: nextDisplayOrder,
          createdAt: new Date().toISOString(),
        });
        showToast("던전 카드를 등록했습니다.");
      }

      await updateLastModifiedTime();
      resetWowDungeonTierForm();
    } catch (error) {
      console.error(error);
      showToast("던전 카드를 저장하지 못했습니다.", "error");
    } finally {
      setIsWowDungeonTierSaving(false);
    }
  };

  const handleMoveWowDungeonTierItemOrder = async (itemId, direction) => {
    if (!user || !itemId) return;

    const currentIndex = wowDungeonTierItems.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= wowDungeonTierItems.length) return;

    const reorderedItems = [...wowDungeonTierItems];
    const [movedItem] = reorderedItems.splice(currentIndex, 1);
    reorderedItems.splice(targetIndex, 0, movedItem);

    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      reorderedItems.forEach((item, index) => {
        batch.update(
          doc(db, "artifacts", appId, "public", "data", WOW_DUNGEON_TIER_COLLECTION, item.id),
          {
            displayOrder: index + 1,
            updatedAt: timestamp,
          }
        );
      });

      await batch.commit();
      await updateLastModifiedTime();
      showToast("던전 보관함 카드 순서를 변경했습니다.");
    } catch (error) {
      console.error(error);
      showToast("던전 보관함 카드 순서를 변경하지 못했습니다.", "error");
    }
  };

  const clearWowDungeonTierDragState = () => {
    setWowDungeonTierDragItemId(null);
    setWowDungeonTierDropTarget(null);
  };

  const moveWowDungeonTierItem = (itemId, nextTierId = null) => {
    if (!itemId) return;

    setWowDungeonTierPlacements((prev) => {
      const next = moveWowDungeonTierItemBetweenTiers(prev, itemId, nextTierId);
      return areWowDungeonTierPlacementsEqual(prev, next) ? prev : next;
    });
  };

  const handleSelectWowDungeonTierItem = (itemId) => {
    if (!itemId) return;
    setWowDungeonTierSelectedItemId((prev) => prev === itemId ? null : itemId);
  };

  const handleOpenWowDungeonTierDetail = (itemId, initialVideoIndex = 0) => {
    if (!itemId) return;
    const targetItem = wowDungeonTierItemMap[itemId];
    const videoUrls = normalizeWowDungeonVideoUrls(targetItem?.videoUrls, targetItem?.videoUrl);
    setWowDungeonTierSelectedItemId(itemId);

    if (videoUrls.length === 0) {
      showToast("이 던전에는 재생할 영상이 아직 없습니다.", "error");
      return;
    }

    const safeVideoIndex = Math.min(Math.max(initialVideoIndex, 0), videoUrls.length - 1);
    setWowDungeonTierDetailItemId(itemId);
    setWowDungeonTierDetailVideoIndex(safeVideoIndex);
  };

  const handleCloseWowDungeonTierDetail = () => {
    setWowDungeonTierDetailItemId(null);
    setWowDungeonTierDetailVideoIndex(0);
  };

  const handleMoveWowDungeonTierDetailVideo = (direction) => {
    if (!wowDungeonTierDetailVideoUrls.length) return;
    setWowDungeonTierDetailVideoIndex((prev) => {
      const nextIndex = direction === "prev" ? prev - 1 : prev + 1;
      return Math.min(Math.max(nextIndex, 0), wowDungeonTierDetailVideoUrls.length - 1);
    });
  };

  const handleMoveSelectedWowDungeonTierItem = (nextTierId = null) => {
    if (!wowDungeonTierSelectedItemId) return;
    moveWowDungeonTierItem(wowDungeonTierSelectedItemId, nextTierId);
  };

  const handleResetWowDungeonTierPlacements = () => {
    setWowDungeonTierPlacements(createEmptyWowDungeonTierPlacements());
    setWowDungeonTierSelectedItemId(null);
    clearWowDungeonTierDragState();
    showToast("던전 티어표를 초기화했습니다.");
  };

  const handleWowDungeonTierDragStart = (event, itemId) => {
    if (!itemId) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setWowDungeonTierDragItemId(itemId);
    setWowDungeonTierSelectedItemId(itemId);
  };

  const handleWowDungeonTierDragEnd = () => {
    clearWowDungeonTierDragState();
  };

  const handleWowDungeonTierDropZoneDragOver = (event, zoneId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (wowDungeonTierDropTarget !== zoneId) {
      setWowDungeonTierDropTarget(zoneId);
    }
  };

  const handleWowDungeonTierDropZoneDrop = (event, nextTierId = null) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain") || wowDungeonTierDragItemId;
    if (itemId) {
      moveWowDungeonTierItem(itemId, nextTierId);
      setWowDungeonTierSelectedItemId(itemId);
    }
    clearWowDungeonTierDragState();
  };

  const getWowRaidRankings = (raid, categoryId) => {
    if (!raid) return [];
    const statsMap = raid.stats?.[categoryId] || {};
    return (raid.participants || [])
      .map((participant) => ({ ...participant, value: Number(statsMap?.[participant.id]) || 0 }))
      .sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return (a.streamerName || '').localeCompare(b.streamerName || '', 'ko');
      });
  };

  const renderWowRaidValue = (value) => {
    const safeValue = Number(value);
    if (!Number.isFinite(safeValue) || safeValue === 0) return '-';
    return safeValue.toLocaleString('ko-KR');
  };

  const renderWowRaidView = () => {
    const getWowRaidGroupBadgeClasses = (groupNumber) => {
      const normalizedGroup = `${groupNumber || ''}`;
      if (isLightTheme) {
        if (normalizedGroup === '1') return "bg-amber-500 text-white border-amber-500";
        if (normalizedGroup === '2') return "bg-slate-400 text-white border-slate-400";
        return "bg-slate-700 text-white border-slate-700";
      }
      return "border-amber-300/45 bg-black/50 backdrop-blur-sm text-amber-100";
    };

    const getWowRaidFilterButtonClasses = (isActive) => (
      isActive
        ? (isLightTheme
          ? "bg-white text-slate-900 border-slate-200 shadow-sm"
          : wowTheme.raidTabActive)
        : (isLightTheme
          ? "bg-transparent text-slate-500 border-transparent hover:bg-white hover:text-slate-900 hover:border-slate-200"
          : wowTheme.raidTabInactive)
    );

    if (selectedWowRaid) {
      const currentDetailTab = wowRaidDetailTab || 'participants';
      const currentStatMeta = WOW_RAID_STAT_FIELDS.find((field) => field.id === currentDetailTab) || null;
      const rankings = currentStatMeta ? getWowRaidRankings(selectedWowRaid, currentStatMeta.id) : [];
      const podium = rankings.slice(0, 3);
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => { setSelectedWowRaidId(null); setWowRaidDetailTab('participants'); }} className={wowTheme.backButton}>
              <ArrowLeft className="w-4 h-4 mr-2" /> WOW레이드 목록으로 돌아가기
            </button>
            <div className={`flex items-center gap-2 text-sm ${wowTheme.mutedText}`}>
              <Shield className={`w-4 h-4 ${isLightTheme ? "text-violet-600" : "text-violet-300"}`} /> WOW레이드 상세 리포트
            </div>
          </div>

          <div className={wowTheme.raidDetailHero}>
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
              <div className={wowTheme.raidDetailImagePanel}>
                {selectedWowRaid.imageUrl ? (
                  <img src={selectedWowRaid.imageUrl} alt={selectedWowRaid.raidName} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full min-h-[240px] flex items-center justify-center font-black text-2xl ${isLightTheme ? "bg-gradient-to-br from-violet-100 to-slate-100 text-violet-500" : "bg-gradient-to-br from-violet-900/30 to-slate-900 text-violet-200/70"}`}>WOW RAID</div>
                )}
              </div>
              <div className="p-6 lg:p-8 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-md border text-xs font-black ${isLightTheme ? "border-violet-200 bg-violet-50 text-violet-700" : "border-violet-400/30 bg-violet-500/10 text-violet-200"}`}>{selectedWowRaid.isCleared ? '토벌 완료' : '진행 기록'}</span>
                    {selectedWowRaid.raidGroupNumber && <span className={`px-2.5 py-1 rounded-md border text-xs font-black shadow-sm ${getWowRaidGroupBadgeClasses(selectedWowRaid.raidGroupNumber)}`}>{selectedWowRaid.raidGroupNumber}군</span>}
                    {selectedWowRaid.raidDate && <span className={`px-2.5 py-1 rounded-md border text-xs font-black ${isLightTheme ? "border-slate-200 bg-white text-slate-600" : "border-gray-600 bg-gray-900/70 text-gray-200"}`}>{selectedWowRaid.raidDate}</span>}
                  </div>
                  <h2 className={`text-3xl font-black mb-2 break-keep ${wowTheme.heading}`}>{selectedWowRaid.raidName}</h2>
                  <p className={`break-keep ${wowTheme.bodyText}`}>{selectedWowRaid.note || '레이드의 기록과 통계를 한눈에 확인할 수 있습니다.'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className={wowTheme.raidStatCard}>
                    <div className={`text-xs font-black mb-1 ${wowTheme.mutedText}`}>진행 날짜</div>
                    <div className={`text-lg font-black ${wowTheme.heading}`}>{selectedWowRaid.raidDate || '-'}</div>
                  </div>
                  <div className={wowTheme.raidStatCard}>
                    <div className={`text-xs font-black mb-1 ${wowTheme.mutedText}`}>토벌시간</div>
                    <div className={`text-lg font-black ${isLightTheme ? "text-blue-600" : "text-cyan-200"}`}>{selectedWowRaid.clearTime || '-'}</div>
                  </div>
                  <div className={wowTheme.raidStatCard}>
                    <div className={`text-xs font-black mb-1 ${wowTheme.mutedText}`}>참가 인원</div>
                    <div className={`text-lg font-black ${isLightTheme ? "text-amber-700" : "text-amber-200"}`}>{selectedWowRaid.participants.length}명</div>
                  </div>
                  <div className={wowTheme.raidStatCard}>
                    <div className={`text-xs font-black mb-1 ${wowTheme.mutedText}`}>군 구분</div>
                    <div className={`text-lg font-black ${isLightTheme ? "text-violet-700" : "text-violet-200"}`}>{selectedWowRaid.raidGroupNumber ? `${selectedWowRaid.raidGroupNumber}군` : '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {WOW_RAID_DETAIL_TABS.map((tab) => {
              const isActive = wowRaidDetailTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setWowRaidDetailTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-black border transition ${isActive ? wowTheme.raidTabActive : wowTheme.raidTabInactive}`}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {wowRaidDetailTab === 'participants' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {selectedWowRaid.participants.map((participant) => (
                <div key={participant.id} className={wowTheme.raidParticipantCard}>
                  <div className="flex items-center gap-3">
                    <img src={getWowAvatarSrc(participant)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant.displayName || participant.streamerName}`; }} alt={participant.streamerName} className={`w-14 h-14 rounded-full object-cover ${isLightTheme ? "bg-slate-100 border border-slate-200" : "bg-gray-900 border border-gray-600"}`} />
                    <div className="min-w-0">
                      <div className={`font-black truncate ${wowTheme.heading}`}>{participant.streamerName}</div>
                      <div className={`text-sm truncate ${isLightTheme ? "text-blue-600" : "text-blue-300"}`}>{participant.wowNickname}</div>
                      <div className={`text-xs ${wowTheme.mutedText}`}>Lv.{participant.level}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    <span style={getJobBadgeStyle(participant.jobClass, isLightTheme)} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border whitespace-nowrap">{participant.jobClass}</span>
                    {participant.mainSpec && <span title={getWowSpecTagTitle(participant.jobClass, participant.mainSpec, participant.availableSpecs)} className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border whitespace-nowrap ${wowSpecTagClass}`}>{participant.mainSpec}</span>}
                    {normalizePreferredPositions(participant.preferredPositions).map((positionId) => (
                      <span key={positionId} className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black border whitespace-nowrap ${getWowPositionTagClasses(positionId, isLightTheme)}`}>{getWowPositionShortLabel(positionId)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {podium.length > 0 ? podium.map((participant, index) => (
                  <div key={participant.id} className={wowTheme.raidRankingCard}>
                    <div className={`text-xs font-black mb-2 ${wowTheme.mutedText}`}>TOP {index + 1}</div>
                    <div className="flex items-center gap-3">
                      <img src={getWowAvatarSrc(participant)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant.displayName || participant.streamerName}`; }} alt={participant.streamerName} className={`w-14 h-14 rounded-full object-cover ${isLightTheme ? "border border-slate-200 bg-slate-100" : "border border-gray-600 bg-gray-900"}`} />
                      <div className="min-w-0">
                        <div className={`font-black truncate ${wowTheme.heading}`}>{participant.displayName || participant.streamerName}</div>
                        <div className={`text-sm truncate ${isLightTheme ? "text-blue-600" : "text-blue-300"}`}>{participant.wowNickname}</div>
                        <div className={`text-lg font-black ${isLightTheme ? "text-amber-600" : "text-amber-300"}`}>{renderWowRaidValue(participant.value)}</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className={`md:col-span-3 rounded-xl border p-6 text-center ${isLightTheme ? "bg-white border-slate-200 text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "bg-gray-800 border border-gray-700 text-gray-400"}`}>아직 입력된 {currentStatMeta?.label || '통계'} 데이터가 없습니다.</div>
                )}
              </div>

              <div className={wowTheme.raidTableShell}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[17px]">
                    <thead className={wowTheme.raidTableHead}>
                      <tr>
                        <th className="px-4 py-3 text-left text-[17px] font-black">순위</th>
                        <th className="px-4 py-3 text-left text-[17px] font-black">참가자</th>
                        <th className="px-4 py-3 text-left text-[17px] font-black">와우 닉네임</th>
                        <th className="px-4 py-3 text-left text-[17px] font-black">직업</th>
                        <th className="px-4 py-3 text-left text-[17px] font-black">특성</th>
                        <th className="px-4 py-3 text-right text-[17px] font-black">{currentStatMeta?.label}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.length > 0 ? rankings.map((participant, index) => (
                        <tr key={participant.id} className={wowTheme.raidTableRow}>
                          <td className={`px-4 py-3 font-black text-[17px] ${isLightTheme ? "text-slate-500" : "text-gray-300"}`}>{index + 1}</td>
                          <td className={`px-4 py-3 font-bold text-[17px] ${wowTheme.heading}`}>{participant.streamerName}</td>
                          <td className={`px-4 py-3 text-[17px] ${isLightTheme ? "text-blue-600" : "text-blue-300"}`}>{participant.wowNickname}</td>
                          <td className="px-4 py-3"><span style={getJobBadgeStyle(participant.jobClass, isLightTheme)} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black border whitespace-nowrap">{participant.jobClass}</span></td>
                          <td className="px-4 py-3">{participant.mainSpec ? <span title={getWowSpecTagTitle(participant.jobClass, participant.mainSpec, participant.availableSpecs)} className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black border whitespace-nowrap ${wowSpecTagClass}`}>{participant.mainSpec}</span> : <span className={wowTheme.faintText}>-</span>}</td>
                          <td className={`px-4 py-3 text-right font-black text-[21px] ${isLightTheme ? "text-amber-600" : "text-amber-200"}`}>{renderWowRaidValue(participant.value)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className={`px-4 py-8 text-center text-[17px] ${wowTheme.mutedText}`}>아직 입력된 {currentStatMeta?.label || '통계'} 데이터가 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className={`${wowTheme.raidDetailHero} p-8`}>
          <h2 className={`text-3xl font-black mb-2 flex items-center ${wowTheme.heading}`}><Layers className={`w-8 h-8 mr-3 ${isLightTheme ? "text-violet-600" : "text-violet-300"}`} /> WOW레이드</h2>
          <p className={`text-lg break-keep ${wowTheme.bodyText}`}>진행되었던 WOW 레이드의 참가 인원과 통계를 카드형 리포트로 확인할 수 있습니다.</p>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${isLightTheme ? "rounded-2xl border border-slate-200 bg-slate-50/80 p-1 shadow-sm w-fit" : ""}`}>
          {[
            { id: 'all', label: '전체' },
            { id: '1', label: '1군' },
            { id: '2', label: '2군' },
            { id: 'other', label: '기타' },
          ].map((option) => {
            const active = wowRaidGroupFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setWowRaidGroupFilter(option.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-black transition-all ${getWowRaidFilterButtonClasses(active)}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {filteredWowRaidPublishedList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {filteredWowRaidPublishedList.map((raid) => (
              <button key={raid.id} onClick={() => { setSelectedWowRaidId(raid.id); setWowRaidDetailTab('participants'); }} className={`text-left rounded-2xl overflow-hidden transition-all duration-300 ${isLightTheme ? "bg-white border border-slate-200 shadow-sm hover:border-violet-300 hover:-translate-y-1 hover:shadow-md" : "bg-gray-800 border border-gray-700 shadow-lg hover:border-violet-400/40 hover:-translate-y-0.5"}`}>
                <div className={`relative h-40 overflow-hidden ${isLightTheme ? "bg-slate-100" : "bg-gray-900/60"}`}>
                  {raid.raidGroupNumber && (
                    <span className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md border text-xs font-black shadow-lg ${getWowRaidGroupBadgeClasses(raid.raidGroupNumber)}`}>
                      {raid.raidGroupNumber}군
                    </span>
                  )}
                  {raid.imageUrl ? (
                    <img src={raid.imageUrl} alt={raid.raidName} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center font-black text-2xl ${isLightTheme ? "bg-gradient-to-br from-violet-100 to-slate-100 text-violet-500" : "bg-gradient-to-br from-violet-900/25 to-slate-900 text-violet-200/70"}`}>WOW RAID</div>
                  )}
                </div>
                <div className="p-4">
                  <div className={`text-lg font-black mb-2 break-keep ${wowTheme.heading}`}>{raid.raidName}</div>
                  <div className={`text-sm mb-1 ${wowTheme.mutedText}`}>{raid.raidDate || '-'}</div>
                  <div className={`text-sm font-black ${isLightTheme ? "text-blue-600" : "text-cyan-300"}`}>토벌시간 {raid.clearTime || '-'}</div>
                  {raid.note && <div className={`mt-2 text-xs break-keep leading-relaxed ${wowTheme.mutedText}`}>{raid.note}</div>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className={wowTheme.emptyPanel}>선택한 군에 해당하는 WOW 레이드 기록이 없습니다.</div>
        )}
      </div>
    );
  };

  const renderDungeonTierGameView = () => {
    const originalCount = wowDungeonTierItems.filter((item) => item.expansionType === "original").length;
    const tbcCount = wowDungeonTierItems.filter((item) => item.expansionType === "tbc").length;
    const tierBoardMeta = {
      S: {
        lightBoxClass: "border-red-200 bg-red-50",
        darkBoxClass: "border-gray-900 bg-red-500",
        lightIdTextClass: "text-red-700",
        darkIdTextClass: "text-white",
      },
      A: {
        lightBoxClass: "border-orange-100 bg-orange-50/70",
        darkBoxClass: "border-gray-900 bg-orange-400",
        lightIdTextClass: "text-orange-600",
        darkIdTextClass: "text-white",
      },
      B: {
        lightBoxClass: "border-amber-200 bg-amber-50",
        darkBoxClass: "border-gray-900 bg-yellow-500",
        lightIdTextClass: "text-amber-700",
        darkIdTextClass: "text-white",
      },
      C: {
        lightBoxClass: "border-emerald-200 bg-emerald-50",
        darkBoxClass: "border-gray-900 bg-green-500",
        lightIdTextClass: "text-emerald-700",
        darkIdTextClass: "text-white",
      },
      D: {
        lightBoxClass: "border-blue-200 bg-blue-50",
        darkBoxClass: "border-gray-900 bg-blue-500",
        lightIdTextClass: "text-blue-700",
        darkIdTextClass: "text-white",
      },
      F: {
        lightBoxClass: "border-slate-200 bg-slate-100",
        darkBoxClass: "border-gray-900 bg-slate-600",
        lightIdTextClass: "text-slate-700",
        darkIdTextClass: "text-white",
      },
    };
    const selectedLocationLabel = wowDungeonTierSelectedTierId ? `${wowDungeonTierSelectedTierId} 티어` : "보관함";
    const renderDungeonCard = (item, { currentTierId = null, compact = false } = {}) => {
      const expansionMeta = getWowDungeonExpansionMeta(item.expansionType);
      const expansionTheme = getWowDungeonExpansionTheme(item.expansionType, isLightTheme);
      const isSelected = wowDungeonTierSelectedItemId === item.id;
      const isDragging = wowDungeonTierDragItemId === item.id;
      const itemVideoUrls = normalizeWowDungeonVideoUrls(item.videoUrls, item.videoUrl);
      const videoCount = itemVideoUrls.length;
      const hasVideos = videoCount > 0;

      if (compact) {
        return (
          <div
            key={`${currentTierId || "stash"}-${item.id}`}
            role="button"
            tabIndex={0}
            draggable
            title={`${item.name} · ${expansionMeta.label} · 클릭 선택 · 더블클릭 영상 재생`}
            onClick={() => handleSelectWowDungeonTierItem(item.id)}
            onDoubleClick={() => handleOpenWowDungeonTierDetail(item.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              if (!currentTierId) return;
              setWowDungeonTierSelectedItemId(item.id);
              moveWowDungeonTierItem(item.id, null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleSelectWowDungeonTierItem(item.id);
              }
            }}
            onDragStart={(event) => handleWowDungeonTierDragStart(event, item.id)}
            onDragEnd={handleWowDungeonTierDragEnd}
            className="group relative flex flex-col items-center cursor-grab active:cursor-grabbing"
          >
            <div
              className={`relative w-16 h-16 rounded-lg border-2 flex items-center justify-center overflow-hidden shadow-lg transition-transform transform ${
                isSelected
                  ? (isLightTheme
                    ? "bg-slate-100 border-indigo-400 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white"
                    : "bg-gray-700 border-indigo-300 ring-2 ring-indigo-300/70 ring-offset-2 ring-offset-gray-800")
                  : (isLightTheme
                    ? "bg-slate-100 border-slate-200 group-hover:border-emerald-300"
                    : "bg-gray-700 border-gray-600 group-hover:border-green-400")
              } ${isDragging ? "scale-95 opacity-60" : "group-hover:scale-110"}`}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-xs font-black ${expansionTheme.metaClass}`}>
                  DUN
                </div>
              )}
              <span className={`absolute left-1 top-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-black backdrop-blur-sm ${expansionTheme.badgeClass}`}>
                {expansionMeta.shortLabel}
              </span>
            </div>
            <span className={`mt-2 text-xs leading-[1.15rem] font-medium px-2 py-0.5 rounded text-center break-keep max-w-[92px] transition-colors ${isLightTheme ? "text-slate-900 bg-slate-100 group-hover:text-emerald-700" : "text-white bg-gray-900/80 group-hover:text-green-400"}`}>
              {item.name}
            </span>
            <span className={`text-[11px] font-bold mt-0.5 ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>
              {hasVideos ? `영상 ${videoCount}개` : expansionMeta.label}
            </span>
          </div>
        );
      }

      return (
        <div
          key={`${currentTierId || "stash"}-${item.id}`}
          role="button"
          tabIndex={0}
          draggable
          onClick={() => handleSelectWowDungeonTierItem(item.id)}
          onDoubleClick={() => handleOpenWowDungeonTierDetail(item.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleSelectWowDungeonTierItem(item.id);
            }
          }}
          onDragStart={(event) => handleWowDungeonTierDragStart(event, item.id)}
          onDragEnd={handleWowDungeonTierDragEnd}
          className={`group rounded-3xl border overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing ${
            isSelected
              ? (isLightTheme
                ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white shadow-[0_18px_36px_rgba(79,70,229,0.18)]"
                : "ring-2 ring-indigo-300/70 ring-offset-2 ring-offset-gray-950 shadow-[0_0_28px_rgba(129,140,248,0.18)]")
              : ""
          } ${
            isDragging ? "scale-[0.98] opacity-60" : "hover:-translate-y-1"
          } ${expansionTheme.cardClass}`}
        >
          <div className={`relative aspect-[4/3] border-b overflow-hidden ${expansionTheme.frameClass}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-lg font-black ${expansionTheme.metaClass}`}>
                DUNGEON
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black backdrop-blur-sm ${expansionTheme.badgeClass}`}>
                {expansionMeta.shortLabel}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${isLightTheme ? "border-white/80 bg-white/90 text-slate-700" : "border-white/15 bg-black/40 text-gray-100"}`}>
                {currentTierId ? `${currentTierId} 티어` : "보관함"}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-semibold ${expansionTheme.subtleClass}`}>{expansionMeta.label}</span>
              <span className={`text-[11px] font-bold ${expansionTheme.metaClass}`}>{hasVideos ? `영상 ${videoCount}개` : "이미지 카드"}</span>
            </div>
            <h4 className={`mt-3 text-base font-black break-keep ${expansionTheme.titleClass}`}>{item.name}</h4>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className={`text-xs ${expansionTheme.subtleClass}`}>{currentTierId ? "배치된 카드" : "보관함 대기 카드"}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectWowDungeonTierItem(item.id);
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${isSelected ? (isLightTheme ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-indigo-400/40 bg-indigo-500/15 text-indigo-100") : (isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-600 bg-gray-900/80 text-gray-100 hover:bg-gray-800")}`}
                >
                  <CheckSquare className="w-3 h-3" />
                  {isSelected ? "선택됨" : "선택"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenWowDungeonTierDetail(item.id);
                  }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${hasVideos ? expansionTheme.buttonClass : (isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-600 bg-gray-900/80 text-gray-100 hover:bg-gray-800")}`}
                >
                  <Tv className="w-3 h-3" />
                  {hasVideos ? "재생" : "영상 없음"}
                </button>
                {currentTierId ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveWowDungeonTierItem(item.id, null);
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-600 bg-gray-900/80 text-gray-100 hover:bg-gray-800"}`}
                  >
                    <ArrowLeft className="w-3 h-3" />
                    보관함
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderDungeonStashCard = (item) => {
      const expansionMeta = getWowDungeonExpansionMeta(item.expansionType);
      const expansionTheme = getWowDungeonExpansionTheme(item.expansionType, isLightTheme);
      const isSelected = wowDungeonTierSelectedItemId === item.id;
      const isDragging = wowDungeonTierDragItemId === item.id;

      return (
        <div
          key={`stash-mini-${item.id}`}
          role="button"
          tabIndex={0}
          draggable
          title={`${item.name} · ${expansionMeta.label}`}
          onClick={() => handleSelectWowDungeonTierItem(item.id)}
          onDoubleClick={() => handleOpenWowDungeonTierDetail(item.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleSelectWowDungeonTierItem(item.id);
            }
          }}
          onDragStart={(event) => handleWowDungeonTierDragStart(event, item.id)}
          onDragEnd={handleWowDungeonTierDragEnd}
          className={`group rounded-2xl border p-2.5 cursor-grab active:cursor-grabbing transition-all ${
            isSelected
              ? (isLightTheme
                ? "border-indigo-300 bg-indigo-50/70 ring-2 ring-indigo-400/70"
                : "border-indigo-300/60 bg-indigo-500/10 ring-2 ring-indigo-300/60")
              : (isLightTheme
                ? "border-slate-200 bg-white hover:border-slate-300"
                : "border-gray-700 bg-gray-900/80 hover:border-gray-500")
          } ${isDragging ? "scale-95 opacity-60" : "hover:-translate-y-0.5"}`}
        >
          <div className={`relative aspect-square overflow-hidden rounded-xl border ${isLightTheme ? "border-slate-200 bg-slate-100" : "border-gray-700 bg-gray-800"}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-[11px] font-black ${expansionTheme.metaClass}`}>
                DUN
              </div>
            )}
            <span className={`absolute left-1.5 top-1.5 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-black backdrop-blur-sm ${expansionTheme.badgeClass}`}>
              {expansionMeta.shortLabel}
            </span>
          </div>
          <div className={`mt-2 text-[11px] leading-4 font-bold text-center break-keep ${publicTheme.heading}`}>
            {item.name}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className={publicTheme.heroTier}>
          <div className="absolute -right-6 -top-6 opacity-10 pointer-events-none">
            <Trophy className="w-28 h-28 text-amber-300" />
          </div>
          <div className="relative z-10">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${isLightTheme ? "border-amber-200 bg-white shadow-[0_12px_24px_rgba(217,119,6,0.08)]" : "border-amber-400/30 bg-amber-500/12 shadow-[0_0_18px_rgba(251,191,36,0.12)]"}`}>
                <Trophy className={`h-5 w-5 ${isLightTheme ? "text-amber-600" : "text-amber-300"}`} />
              </div>
              <div className="min-w-0">
                <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${publicTheme.heading}`}>던전 티어게임</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,8fr)_minmax(280px,2fr)] gap-5 items-start xl:items-stretch">
          <div className={`${publicTheme.surfaceCard} p-6 xl:h-[980px] flex flex-col`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className={`text-xl font-black ${publicTheme.heading}`}>던전 티어표</h3>
                <p className={`mt-2 text-sm leading-6 break-keep ${publicTheme.mutedText}`}>
                  카드는 한 번 클릭하면 선택되고, 두 번 클릭하면 첫 번째 영상부터 바로 재생됩니다. 재생 중에는 좌우 버튼으로 다음 영상까지 이어서 볼 수 있습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${isLightTheme ? "border-slate-200 bg-slate-50 text-slate-700" : "border-gray-700 bg-gray-900/70 text-gray-100"}`}>
                  <Star className={`w-3.5 h-3.5 ${isLightTheme ? "text-amber-500" : "text-amber-300"}`} />
                  브라우저 자동 저장
                </div>
                {wowDungeonTierSelectedItem ? (
                  <button
                    type="button"
                    onClick={() => handleOpenWowDungeonTierDetail(wowDungeonTierSelectedItem.id)}
                    className={`px-3 py-2 rounded-xl border text-sm font-bold transition ${isLightTheme ? "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50" : "border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/18"}`}
                  >
                    선택 카드 재생
                  </button>
                ) : null}
                {wowDungeonTierSelectedItem ? (
                  <button
                    type="button"
                    onClick={() => setWowDungeonTierSelectedItemId(null)}
                    className={`px-3 py-2 rounded-xl border text-sm font-bold transition ${isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-600 bg-gray-900/80 text-gray-100 hover:bg-gray-800"}`}
                  >
                    선택 해제
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleResetWowDungeonTierPlacements}
                  className={`px-3 py-2 rounded-xl border text-sm font-bold transition ${isLightTheme ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50" : "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/18"}`}
                >
                  내 티어표 초기화
                </button>
              </div>
            </div>

            {wowDungeonTierSelectedItem ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black ${isLightTheme ? "border-slate-200 bg-slate-50 text-slate-700" : "border-gray-700 bg-gray-900/70 text-gray-100"}`}>
                  선택 카드: {wowDungeonTierSelectedItem.name}
                </span>
                <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${isLightTheme ? "border-slate-200 bg-white text-slate-500" : "border-gray-700 bg-gray-900/80 text-gray-400"}`}>
                  현재 위치: {selectedLocationLabel}
                </span>
                {WOW_DUNGEON_TIER_LEVELS.map((tier) => {
                  const isActiveTier = wowDungeonTierSelectedTierId === tier.id;
                  return (
                    <button
                      key={`quick-move-${tier.id}`}
                      type="button"
                      onClick={() => handleMoveSelectedWowDungeonTierItem(tier.id)}
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-black transition ${
                        isActiveTier
                          ? (isLightTheme ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300/40 bg-slate-200 text-slate-950")
                          : (isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-600 bg-gray-900/80 text-gray-100 hover:bg-gray-800")
                      }`}
                    >
                      {tier.id} 티어로 이동
                    </button>
                  );
                })}
                {wowDungeonTierSelectedTierId ? (
                  <button
                    type="button"
                    onClick={() => handleMoveSelectedWowDungeonTierItem(null)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-black transition ${isLightTheme ? "border-sky-200 bg-white text-sky-700 hover:bg-sky-50" : "border-sky-400/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/18"}`}
                  >
                    보관함으로 이동
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className={`mt-6 flex-1 min-h-0 rounded-xl border overflow-hidden p-1 ${isLightTheme ? "bg-slate-100 border-slate-200 shadow-[0_18px_42px_rgba(15,23,42,0.08)]" : "bg-gray-900 border-gray-700"}`}>
              <div className="flex h-full min-h-0 flex-col gap-1">
              {WOW_DUNGEON_TIER_LEVELS.map((tier) => {
                const tierMeta = tierBoardMeta[tier.id];
                const tierCards = wowDungeonTierCardsByTier[tier.id] || [];
                const isDropActive = wowDungeonTierDropTarget === `tier:${tier.id}`;
                const sidebarClass = isLightTheme ? tierMeta.lightBoxClass : tierMeta.darkBoxClass;
                const idTextClass = isLightTheme ? tierMeta.lightIdTextClass : tierMeta.darkIdTextClass;

                return (
                  <div key={tier.id} className={`relative flex min-h-[112px] flex-1 flex-col overflow-hidden rounded-lg border md:flex-row ${isLightTheme ? "bg-white border-slate-200" : "bg-gray-800 border-gray-700"}`}>
                    <div className={`md:w-28 w-full flex-shrink-0 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r shadow-inner relative z-10 overflow-hidden ${sidebarClass}`}>
                      <span className={`text-2xl font-extrabold relative z-10 ${idTextClass}`}>{tier.id}</span>
                    </div>

                    <div
                      onDragOver={(event) => handleWowDungeonTierDropZoneDragOver(event, `tier:${tier.id}`)}
                      onDrop={(event) => handleWowDungeonTierDropZoneDrop(event, tier.id)}
                      className={`flex-1 h-full p-4 flex flex-wrap content-start gap-4 items-center transition ${isLightTheme ? "bg-white" : "bg-gray-800/80"} ${isDropActive ? (isLightTheme ? "ring-2 ring-indigo-400 ring-inset bg-indigo-50/70" : "ring-2 ring-indigo-300/60 ring-inset bg-indigo-500/10") : ""}`}
                    >
                      {tierCards.length > 0 ? tierCards.map((item) => renderDungeonCard(item, { currentTierId: tier.id, compact: true })) : (
                        <span className={`text-sm italic p-2 ${publicTheme.emptyState}`}>해당 티어에 배치된 던전 카드 없음</span>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          <div className={`${publicTheme.surfaceCard} p-5 xl:h-[980px] flex flex-col`}>
            <div className="flex flex-col gap-3">
              <div>
                <h3 className={`text-lg font-black ${publicTheme.heading}`}>던전 보관함</h3>
                <p className={`mt-2 text-xs leading-5 break-keep ${publicTheme.mutedText}`}>
                  더블클릭으로 해당 던전의 첫 번째 영상 재생
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${isLightTheme ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>
                  오리지널 {originalCount}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${isLightTheme ? "border-rose-200 bg-rose-50 text-rose-700" : "border-red-400/30 bg-red-500/10 text-red-200"}`}>
                  불성 {tbcCount}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${isLightTheme ? "border-slate-200 bg-slate-50 text-slate-700" : "border-gray-700 bg-gray-900/70 text-gray-100"}`}>
                  {wowDungeonTierStashItems.length}장
                </span>
              </div>
            </div>

            <div
              onDragOver={(event) => handleWowDungeonTierDropZoneDragOver(event, "stash")}
              onDrop={(event) => handleWowDungeonTierDropZoneDrop(event, null)}
              className={`mt-5 flex-1 min-h-0 rounded-2xl border-2 border-dashed p-3 transition ${wowDungeonTierDropTarget === "stash" ? (isLightTheme ? "border-indigo-400 bg-indigo-50/80 shadow-[0_18px_36px_rgba(79,70,229,0.12)]" : "border-indigo-300/60 bg-indigo-500/12 shadow-[0_0_26px_rgba(99,102,241,0.18)]") : (isLightTheme ? "border-slate-200 bg-slate-50" : "border-gray-700 bg-gray-900/40")}`}
            >
              {wowDungeonTierStashItems.length > 0 ? (
                <div className="h-full min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    {wowDungeonTierStashItems.map((item) => renderDungeonStashCard(item))}
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl border px-4 py-8 text-center text-sm ${isLightTheme ? "border-white/80 bg-white/80 text-slate-600" : "border-white/10 bg-black/20 text-gray-300"}`}>
                  현재 보관함이 비어 있습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {wowDungeonTierItems.length === 0 ? (
          <div className={`${publicTheme.surfaceCard} p-10 text-center`}>
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border ${isLightTheme ? "border-slate-200 bg-white" : "border-gray-700 bg-gray-900/60"}`}>
              <Layers className={`h-7 w-7 ${isLightTheme ? "text-slate-700" : "text-gray-200"}`} />
            </div>
            <h3 className={`text-xl font-black ${publicTheme.heading}`}>아직 등록된 던전이 없습니다.</h3>
            <p className={`mt-3 text-sm leading-6 break-keep ${publicTheme.mutedText}`}>
              관리자 WOW 설정에서 던전 이름, 이미지, 종류를 등록하면 이 화면에 바로 반영됩니다.
            </p>
          </div>
        ) : null}

        {wowDungeonTierDetailItem ? (() => {
          const detailExpansionMeta = getWowDungeonExpansionMeta(wowDungeonTierDetailItem.expansionType);
          const detailExpansionTheme = getWowDungeonExpansionTheme(wowDungeonTierDetailItem.expansionType, isLightTheme);
          const detailLocationLabel = wowDungeonTierDetailTierId ? `${wowDungeonTierDetailTierId} 티어` : "보관함";
          const currentVideoNumber = wowDungeonTierDetailVideoIndex + 1;
          const totalVideoCount = wowDungeonTierDetailVideoUrls.length;
          const canGoPrevVideo = wowDungeonTierDetailVideoIndex > 0;
          const canGoNextVideo = wowDungeonTierDetailVideoIndex < totalVideoCount - 1;
          const videoFallbackMessage = wowDungeonTierDetailVideoEmbedConfig.fallbackMessage
            || "임베드가 보이지 않거나 재생이 제한되면 오른쪽 위 새 창 열기를 사용해주세요.";

          return (
            <div
              className={`fixed inset-0 z-[170] flex items-center justify-center px-3 py-4 backdrop-blur-sm ${isLightTheme ? "bg-slate-950/55" : "bg-black/85"}`}
              onClick={handleCloseWowDungeonTierDetail}
            >
              <div
                className={`w-full max-w-6xl overflow-hidden rounded-[30px] border ${isLightTheme ? "bg-white border-slate-200 shadow-[0_32px_90px_rgba(15,23,42,0.22)]" : "bg-gray-950 border-gray-700 shadow-2xl"}`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`flex flex-col gap-4 border-b px-4 py-4 sm:px-6 ${isLightTheme ? "border-slate-200 bg-slate-50/95" : "border-gray-800 bg-gray-950/95"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className={`text-xs font-black uppercase tracking-[0.24em] ${detailExpansionTheme.metaClass}`}>Dungeon Player</p>
                      <h3 className={`mt-2 text-2xl font-black break-keep ${publicTheme.heading}`}>{wowDungeonTierDetailItem.name}</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${detailExpansionTheme.badgeClass}`}>
                          {detailExpansionMeta.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${isLightTheme ? "border-slate-200 bg-white text-slate-700" : "border-gray-700 bg-gray-900 text-gray-100"}`}>
                          현재 위치: {detailLocationLabel}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${isLightTheme ? "border-slate-200 bg-white text-slate-700" : "border-gray-700 bg-gray-900 text-gray-100"}`}>
                          {currentVideoNumber} / {totalVideoCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={wowDungeonTierDetailActiveVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-bold transition ${detailExpansionTheme.buttonClass}`}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        새 창 열기
                      </a>
                      <button
                        type="button"
                        onClick={() => copyTextToClipboard(wowDungeonTierDetailActiveVideoUrl, "현재 영상 링크를 복사했습니다.")}
                        className={`inline-flex items-center rounded-xl border px-3 py-2 text-sm font-bold transition ${isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800"}`}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        링크 복사
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseWowDungeonTierDetail}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${isLightTheme ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900" : "border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                        aria-label="플레이어 닫기"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-5">
                  <div className={`relative overflow-hidden rounded-[28px] border ${isLightTheme ? "border-slate-200 bg-slate-100" : "border-gray-800 bg-black"}`}>
                    <div className="aspect-[16/9] w-full bg-black">
                      {wowDungeonTierDetailVideoEmbedConfig.kind === "native" ? (
                        <video
                          key={`${wowDungeonTierDetailItem.id}-${wowDungeonTierDetailVideoIndex}`}
                          src={wowDungeonTierDetailActiveVideoUrl}
                          controls
                          autoPlay
                          playsInline
                          className="h-full w-full"
                        />
                      ) : wowDungeonTierDetailVideoEmbedConfig.canEmbed ? (
                        <iframe
                          key={`${wowDungeonTierDetailItem.id}-${wowDungeonTierDetailVideoIndex}`}
                          src={wowDungeonTierDetailVideoEmbedConfig.embedUrl}
                          title={`${wowDungeonTierDetailItem.name} 영상 ${currentVideoNumber}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          className="h-full w-full"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
                          <Tv className={`h-10 w-10 ${detailExpansionTheme.metaClass}`} />
                          <div>
                            <p className={`text-lg font-black ${publicTheme.heading}`}>이 영상은 화면 안에서 바로 재생되지 않습니다.</p>
                            <p className={`mt-2 text-sm leading-6 ${publicTheme.mutedText}`}>{videoFallbackMessage}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveWowDungeonTierDetailVideo("prev")}
                      disabled={!canGoPrevVideo}
                      className={`absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition sm:left-4 sm:h-12 sm:w-12 ${canGoPrevVideo ? (isLightTheme ? "border-slate-200 bg-white/95 text-slate-800 shadow-[0_12px_24px_rgba(15,23,42,0.14)] hover:bg-white" : "border-white/10 bg-black/65 text-white hover:bg-black/80") : (isLightTheme ? "border-slate-200 bg-white/70 text-slate-300 cursor-not-allowed" : "border-white/10 bg-black/40 text-white/30 cursor-not-allowed")}`}
                      aria-label="이전 영상"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveWowDungeonTierDetailVideo("next")}
                      disabled={!canGoNextVideo}
                      className={`absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition sm:right-4 sm:h-12 sm:w-12 ${canGoNextVideo ? (isLightTheme ? "border-slate-200 bg-white/95 text-slate-800 shadow-[0_12px_24px_rgba(15,23,42,0.14)] hover:bg-white" : "border-white/10 bg-black/65 text-white hover:bg-black/80") : (isLightTheme ? "border-slate-200 bg-white/70 text-slate-300 cursor-not-allowed" : "border-white/10 bg-black/40 text-white/30 cursor-not-allowed")}`}
                      aria-label="다음 영상"
                    >
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-xs font-black uppercase tracking-[0.22em] ${detailExpansionTheme.metaClass}`}>
                          {wowDungeonTierDetailVideoEmbedConfig.sourceLabel}
                        </p>
                        {wowDungeonTierDetailVideoEmbedConfig.openInNewTabRecommended ? (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black ${isLightTheme ? "border-amber-200 bg-amber-50 text-amber-700" : "border-amber-400/30 bg-amber-500/10 text-amber-200"}`}>
                            새 창 권장
                          </span>
                        ) : null}
                      </div>
                      <p className={`mt-2 text-sm font-bold break-all ${publicTheme.heading}`}>
                        {wowDungeonTierDetailActiveVideoUrl}
                      </p>
                      <p className={`mt-2 text-xs leading-5 ${publicTheme.mutedText}`}>
                        {videoFallbackMessage}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectWowDungeonTierItem(wowDungeonTierDetailItem.id)}
                        className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${wowDungeonTierSelectedItemId === wowDungeonTierDetailItem.id ? (isLightTheme ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-indigo-400/40 bg-indigo-500/15 text-indigo-100") : (isLightTheme ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-gray-700 bg-gray-900 text-gray-100 hover:bg-gray-800")}`}
                      >
                        {wowDungeonTierSelectedItemId === wowDungeonTierDetailItem.id ? "현재 선택된 카드" : "이 카드 선택"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })() : null}

      </div>
    );
  };

  const renderWowView = () => {
    const totalWowMembers = wowRoster.length;
    const qualifiedCount = wowRoster.filter(m => m.level >= 40).length;
    const qualifyPercent = totalWowMembers === 0 ? 0 : Math.round((qualifiedCount / totalWowMembers) * 100);
    
    const avgLevel = totalWowMembers === 0 ? 0 : (wowRoster.reduce((sum, m) => sum + m.level, 0) / totalWowMembers).toFixed(1);
    const top5Wow = [...wowRoster].sort((a, b) => b.level - a.level).slice(0, 5);
    
    const classCounts = wowRoster.reduce((acc, m) => {
      acc[m.jobClass] = (acc[m.jobClass] || 0) + 1;
      return acc;
    }, {});
    const allClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

    const WowSortIcon = ({ columnKey }) => {
      if (wowSortConfig.key !== columnKey) return <ChevronDown className="w-4 h-4 ml-1 opacity-30 group-hover:opacity-100 transition" />;
      return wowSortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 text-blue-400" /> : <ChevronDown className="w-4 h-4 ml-1 text-blue-400" />;
    };

    return (
      <div className="space-y-8">
        <div className={wowTheme.hero}>
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
            <Shield className={`w-64 h-64 ${isLightTheme ? "text-blue-500" : "text-blue-300"}`} />
          </div>
          <div className="relative z-10">
            <h2 className={wowTheme.heroTitle}>
              <Shield className={`w-8 h-8 mr-3 ${isLightTheme ? "text-blue-600" : "text-blue-400"}`} /> 월드 오브 워크래프트 x 버츄얼 종겜 리그
            </h2>
            <p className={wowTheme.heroBody}>
              왁타버스 길드에 가입하여 피나는 노력 끝에 <strong className={`font-black text-xl px-1 ${isLightTheme ? "text-amber-600" : "text-yellow-400"}`}>레벨 40</strong>을 달성한 자만이
              <br/>종겜 리그의 공식 참가권을 얻을 수 있습니다! 과연 누가 가장 먼저 합류할까요?
            </p>
          </div>
        </div>

        <div className={wowTheme.noticeCard}>
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${wowTheme.noticeBar}`}></div>
          <h3 className={`text-xl font-bold mb-4 flex items-center ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>
            <Ticket className="w-6 h-6 mr-2" /> '종겜 리그 참가권'에 대한 정확한 안내
          </h3>
          <div className={`space-y-3 text-lg leading-relaxed ${wowTheme.bodyText}`}>
            <p><strong className={wowTheme.heading}>✅ 확정 참가가 아닙니다:</strong> 40레벨 달성 시 부여되는 뱃지는 버츄얼 종겜 리그의 '확정 참가 권리'를 의미하지 않습니다.</p>
            <p><strong className={wowTheme.heading}>✅ 핀볼 추첨 자격 획득:</strong> 왁굳님의 '와우 로드맵 2.0' 내용에 따라, 추후 종겜 리그에서 <strong className={isLightTheme ? "text-blue-700 font-bold" : "text-blue-300 font-bold"}>"와튜버 한 자리 보장"</strong> 룰이 적용되어 참가자를 뽑을 때 <strong className={`${wowTheme.heading} font-bold`}>해당 핀볼(룰렛) 추첨 명단에 들어갈 수 있는 자격</strong>을 의미합니다.</p>
            <div className={`mt-5 pt-4 border-t ${isLightTheme ? "border-slate-200" : "border-gray-700"}`}>
              <p className={`text-base ${wowTheme.mutedText}`}>단어 선택으로 인해 마치 '확정 참가'인 것처럼 오해를 불러일으킨 점, 팬 여러분께 깊은 사과의 말씀을 드립니다. 앞으로 더욱 정확하게 안내하는 관리자가 되겠습니다. </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className={wowTheme.statCard}>
            <div>
              <h3 className={`text-lg font-bold mb-1 flex items-center ${wowTheme.heading}`}>
                <Ticket className={`w-5 h-5 mr-2 ${isLightTheme ? "text-amber-600" : "text-yellow-400"}`}/> 참가권 획득 진척도
              </h3>
              <p className={`text-sm mb-4 ${wowTheme.mutedText}`}>레벨 40 이상 달성자 비율</p>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className={`text-3xl font-black ${isLightTheme ? "text-amber-600" : "text-yellow-400"}`}>{qualifiedCount}<span className={`text-lg font-bold ${wowTheme.faintText}`}> / {totalWowMembers}명</span></span>
                <span className={`text-lg font-bold ${wowTheme.heading}`}>{qualifyPercent}%</span>
              </div>
              <div className={`w-full rounded-full h-4 overflow-hidden ${isLightTheme ? "bg-slate-100 border border-slate-200" : "bg-gray-900 border border-gray-700"}`}>
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-4 rounded-full transition-all duration-1000" style={{ width: `${qualifyPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className={wowTheme.statCard}>
            <div>
              <h3 className={`text-lg font-bold mb-1 flex items-center ${wowTheme.heading}`}>
                <Swords className="w-5 h-5 mr-2 text-red-400"/> 길드 전투력 요약
              </h3>
              <p className={`text-sm mb-4 ${wowTheme.mutedText}`}>평균 레벨 및 최상위 선발대</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-xs font-bold mb-1 ${wowTheme.faintText}`}>길드 평균 레벨</span>
                <span className={`text-3xl font-black ${wowTheme.heading}`}>Lv. {avgLevel}</span>
              </div>
              <div className="flex -space-x-3 overflow-hidden">
                {top5Wow.map((m, i) => (
                  <div key={i} className={`relative z-10 inline-block h-12 w-12 rounded-full ring-2 ${isLightTheme ? "ring-white" : "ring-gray-800"}`} title={`${m.streamerName} (Lv.${m.level})`}>
                    <img src={getWowAvatarSrc(m)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.streamerName}`; }} alt={m.streamerName} className={`h-full w-full rounded-full object-cover ${isLightTheme ? "bg-slate-100" : "bg-gray-900"}`} />
                    <div className={`absolute -bottom-1 -right-1 text-[10px] font-black px-1.5 rounded-full ${isLightTheme ? "bg-amber-500 text-white border border-white" : "bg-yellow-500 text-black border border-gray-800"}`}>{m.level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={wowTheme.statCard}>
            <div>
              <h3 className={`text-lg font-bold mb-1 flex items-center ${wowTheme.heading}`}>
                <PieChart className={`w-5 h-5 mr-2 ${isLightTheme ? "text-blue-600" : "text-blue-400"}`}/> 직업 분포도
              </h3>
              <p className={`text-sm mb-4 ${wowTheme.mutedText}`}>길드 내 전체 직업 비율</p>
            </div>
            <div>
              <div className={`flex h-4 rounded-full overflow-hidden mb-3 ${isLightTheme ? "border border-slate-200 bg-slate-100" : "border border-gray-700 bg-gray-900"}`}>
                {allClasses.map((cls, i) => {
                  const pct = totalWowMembers === 0 ? 0 : (cls[1] / totalWowMembers) * 100;
                  const bgColor = WOW_CLASS_COLORS[cls[0]] || fallbackColors[i % fallbackColors.length];
                  return <div key={i} style={{ width: `${pct}%`, backgroundColor: bgColor }} className="h-full" title={`${cls[0]}: ${cls[1]}명`}></div>
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                {allClasses.map((cls, i) => {
                  const bgColor = WOW_CLASS_COLORS[cls[0]] || fallbackColors[i % fallbackColors.length];
                  return (
                    <div key={i} className={`flex items-center font-medium ${wowTheme.bodyText}`}>
                      <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${isLightTheme ? "border border-white" : "border border-gray-600/50"}`} style={{ backgroundColor: bgColor }}></span>
                      {cls[0]} <span className={`ml-1 ${wowTheme.faintText}`}>({cls[1]})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={wowTheme.faqCard}>
          <button
            onClick={() => setIsWowFaqOpen(!isWowFaqOpen)}
            className={wowTheme.faqToggle}
          >
            <div className={`flex items-center font-bold text-lg ${isLightTheme ? "text-blue-700" : "text-blue-300"}`}>
              <Activity className="w-5 h-5 mr-2" />
              🕒 캐릭터 레벨은 언제 업데이트되나요?
            </div>
            {isWowFaqOpen ? (
              <ChevronUp className={`w-5 h-5 ${wowTheme.mutedText}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${wowTheme.mutedText}`} />
            )}
          </button>

          {isWowFaqOpen && (
            <div className={wowTheme.faqExpandedPanel}>
              <div className={wowTheme.faqExpandedContent}>
                <div>
                  <h4 className={`font-bold mb-2 flex items-center ${wowTheme.heading}`}>
                    💡 갱신 기준 시간
                  </h4>
                  <p className={`pl-6 ${wowTheme.mutedText}`}>
                    캐릭터들의 레벨 최신화 시점은 화면 좌측 최상단 바에 표시되는 <strong className={isLightTheme ? "text-blue-700" : "text-blue-300"}>최근 갱신 시각</strong>을 기준으로 합니다.
                  </p>
                </div>
                
                <div>
                  <h4 className={`font-bold mb-2 flex items-center ${wowTheme.heading}`}>
                    🛠️ 업데이트 방식 <span className={`text-xs px-2 py-0.5 rounded ml-2 font-medium ${isLightTheme ? "bg-slate-100 text-slate-600" : "bg-gray-700 text-gray-300"}`}>100% 수동 작업</span>
                  </h4>
                  <p className={`pl-6 mb-2 break-keep ${wowTheme.mutedText}`}>
                    현재 레벨 갱신은 게임 시스템과의 자동 연동이 어려워, 부득이하게 아래와 같은 방법으로 관리자가 직접 수동으로 업데이트하고 있습니다.
                  </p>
                  <ul className={`pl-8 list-decimal space-y-1.5 marker:font-bold ${wowTheme.mutedText} ${isLightTheme ? "marker:text-blue-500/60" : "marker:text-blue-400/50"}`}>
                    <li>관리자가 직접 '월드 오브 워크래프트' 게임 내에 접속하여 길드창 확인</li>
                    <li>왁굳님 및 참가 스트리머분들의 생방송 화면을 실시간으로 모니터링하여 확인</li>
                  </ul>
                </div>

                <div>
                  <h4 className={`font-bold mb-2 flex items-center ${wowTheme.heading}`}>
                    ⏱️ 업데이트 주기
                  </h4>
                  <p className={`pl-6 break-keep ${wowTheme.mutedText}`}>
                    평소에는 관리자가 여유가 생길 때마다 틈틈이 갱신 작업을 진행하고 있습니다. 다만, 중요한 컨텐츠나 이벤트가 시작되기 직전에는 작업의 우선순위를 가장 높여 <strong className={wowTheme.heading}>최대한 실시간에 가깝게 반영</strong>하려 노력 중입니다.
                  </p>
                </div>

                <div className={wowTheme.faqNote}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>
                  <h4 className={`font-bold mb-2 flex items-center text-lg ${isLightTheme ? "text-amber-700" : "text-yellow-400"}`}>
                    🙇‍♂️ 팬 여러분께 드리는 말씀
                  </h4>
                  <p className={`text-base break-keep ${wowTheme.bodyText}`}>
                    모든 분들의 레벨을 완벽한 실시간으로 반영하기에는 물리적인 어려움이 따르는 점, 팬 여러분들의 너른 양해를 부탁드립니다. 조금 느리더라도 확실하게, 늘 더 노력하는 관리자가 되겠습니다! 감사합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={wowTheme.panel}>
          <div className={wowTheme.panelHeader}>
            
            {/* 상단: 제목, 버튼, 검색창 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <h3 className={`text-xl font-bold flex items-center ${wowTheme.heading}`}>
                  <Users className="w-6 h-6 mr-2 text-blue-400" /> 왁타버스 길드 버튜버 명단
                </h3>
                <button
                  onClick={handleCopyWowApplicantList}
                  className={wowTheme.actionCopyButton}
                >
                  📋 버종리 신청 명단 복사하기
                </button>
                <button
                  onClick={() => navigateTo("raid")}
                  className={wowTheme.actionRaidButton}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 opacity-90 transition"></span>
                  <span className="relative flex items-center">
                    <Sparkles className="w-4 h-4 mr-1.5 text-fuchsia-300" />
                    WOW 레이드 만들기
                  </span>
                </button>
                <a
                  href="https://wowak-3edc9.web.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={wowTheme.actionExternalLink}
                >
                  <Link2 className="w-4 h-4 mr-1.5" />
                  템 세팅 보러가기
                </a>
              </div>
              
              <div className={wowTheme.searchShell}>
                <div className="flex items-center px-2.5">
                  <Search className={`w-4 h-4 ${wowTheme.mutedText}`} />
                </div>
                <input
                  type="text"
                  value={wowSearchInput}
                  onChange={(e) => { setWowSearchInput(e.target.value); setShowWowSearchDropdown(true); }}
                  onFocus={() => { if(wowSearchInput) setShowWowSearchDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowWowSearchDropdown(false), 200)}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleWowSearchNext(); }}
                  placeholder="스트리머, 직업, 특성 찾기..."
                  className={wowTheme.searchInput}
                />
                {wowSearchResults.length > 0 && wowSearchInput && (
                  <span className={`text-[10px] px-2 font-bold whitespace-nowrap select-none ${wowTheme.faintText}`}>
                    {currentWowSearchIndex + 1}/{wowSearchResults.length}
                  </span>
                )}
                <div className={`flex pl-1 ml-1 select-none ${isLightTheme ? "border-l border-slate-200" : "border-l border-gray-700"}`}>
                   <button onClick={handleWowSearchPrev} className={`p-1 rounded transition ${isLightTheme ? "text-slate-400 hover:text-blue-600 hover:bg-slate-100" : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"}`}>
                     <ChevronUp className="w-4 h-4" />
                   </button>
                   <button onClick={handleWowSearchNext} className={`p-1 rounded transition ${isLightTheme ? "text-slate-400 hover:text-blue-600 hover:bg-slate-100" : "text-gray-400 hover:text-blue-400 hover:bg-gray-800"}`}>
                     <ChevronDown className="w-4 h-4" />
                   </button>
                </div>

                {showWowSearchDropdown && wowSearchResults.length > 0 && (
                  <div className={wowTheme.dropdown}>
                    {wowSearchResults.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleWowSearchSelect(m)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-0 transition ${isLightTheme ? "hover:bg-slate-50 border-slate-200" : "hover:bg-gray-700 border-gray-700/50"}`}
                      >
                        <img src={getWowAvatarSrc(m)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.streamerName}`; }} className={`w-8 h-8 rounded-full object-cover ${isLightTheme ? "bg-slate-100 border border-slate-200" : "bg-gray-900 border border-gray-600"}`} alt="avatar"/>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold leading-tight ${wowTheme.heading}`}>{m.streamerName}</span>
                          <div className="flex items-center mt-0.5">
                            <span className="text-xs font-bold" style={getJobBadgeStyle(m.jobClass, isLightTheme)}>{m.jobClass}</span>
                            <span className={`mx-1 text-[10px] ${wowTheme.faintText}`}>|</span>
                            <span className={`text-xs ${isLightTheme ? "text-blue-600" : "text-blue-400"}`}>{m.wowNickname}</span>
                          </div>
                        </div>
                        <span className={`ml-auto text-xs font-black ${isLightTheme ? "text-amber-600" : "text-yellow-500"}`}>Lv.{m.level}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showWowSearchDropdown && wowSearchInput && wowSearchResults.length === 0 && (
                   <div className={`${wowTheme.dropdown} p-4 text-center text-sm ${wowTheme.mutedText}`}>
                     검색 결과가 없습니다.
                   </div>
                )}
              </div>
            </div>

            {/* ★ 하단: 직업 필터 뱃지 구역 (가로 스크롤) ★ */}
            <div className="flex overflow-x-auto gap-2.5 pt-2 pb-1 custom-scrollbar w-full items-center" style={{ scrollbarWidth: 'thin' }}>
              {wowJobStats.sortedJobs.map((job) => {
                const count = wowJobStats.stats[job];
                if (count === 0) return null;

                const isSelected = selectedJobFilter === job;
                const baseStyle = job === "전체"
                  ? (isLightTheme
                    ? { color: '#475569', backgroundColor: 'rgba(248, 250, 252, 1)', borderColor: 'rgba(203, 213, 225, 1)' }
                    : { color: '#e2e8f0', backgroundColor: 'rgba(51, 65, 85, 0.4)', borderColor: 'rgba(71, 85, 105, 0.6)' })
                  : getJobBadgeStyle(job, isLightTheme);

                return (
                  <button
                    key={job}
                    onClick={() => handleJobFilterClick(job)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap flex-shrink-0 active:scale-95 ${
                      isSelected
                        ? isLightTheme
                          ? 'ring-2 ring-slate-900/10 shadow-[0_16px_32px_rgba(15,23,42,0.12)] transform scale-105'
                          : 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.2)] transform scale-105'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      ...baseStyle,
                      backgroundColor: isSelected ? baseStyle.color : baseStyle.backgroundColor,
                      color: isSelected ? (isLightTheme ? '#ffffff' : '#000') : baseStyle.color,
                      borderColor: isSelected ? 'transparent' : baseStyle.borderColor,
                    }}
                  >
                    {job}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isSelected ? (isLightTheme ? 'bg-white/20 text-white' : 'bg-black/30 text-white') : (isLightTheme ? 'bg-slate-100 text-slate-600' : 'bg-gray-900 text-gray-300')
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className={`text-xs font-black ${wowTheme.mutedText}`}>특성</div>
              {selectedJobFilter === "전체" ? (
                <div className={`text-xs ${wowTheme.faintText}`}>직업을 선택하면 해당 직업의 특성 필터가 열립니다.</div>
              ) : (
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => handleWowSpecFilterToggle("전체")}
                    className={`px-3 py-1.5 rounded-md text-sm font-black border transition whitespace-nowrap ${selectedWowSpecFilters.includes("전체") ? wowSpecTagClass : wowTheme.filterInactive}`}
                  >
                    전체
                  </button>
                  {wowAvailableSpecOptions.map((spec) => {
                    const isSelected = selectedWowSpecFilters.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleWowSpecFilterToggle(spec)}
                        className={`px-3 py-1.5 rounded-md text-sm font-black border transition whitespace-nowrap ${isSelected ? wowSpecTagClass : wowTheme.filterInactive}`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className={`text-xs font-black ${wowTheme.mutedText}`}>선호 포지션</div>
              <div className="flex overflow-x-auto gap-2 custom-scrollbar w-full items-center" style={{ scrollbarWidth: 'thin' }}>
                {wowPositionStats.orderedIds.map((positionId) => {
                  const meta = getWowPositionMeta(positionId);
                  const count = wowPositionStats.stats[positionId] || 0;
                  const isSelected = selectedWowPositionFilters.includes(positionId);
                  return (
                    <button
                      key={positionId}
                      onClick={() => handleWowPositionFilterToggle(positionId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black border transition whitespace-nowrap flex-shrink-0 ${getWowPositionFilterButtonClasses(positionId, isSelected, isLightTheme)}`}
                    >
                      {meta?.label}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${getWowPositionCountClasses(positionId, isSelected, isLightTheme)}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className={`text-xs font-black ${wowTheme.mutedText}`}>신청 상태</div>
              <button
                onClick={() => setShowWowRaidApplicantsOnly((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-black border transition whitespace-nowrap ${showWowRaidApplicantsOnly ? wowTheme.filterActive : wowTheme.filterInactive}`}
              >
                <Shield className={`w-4 h-4 ${showWowRaidApplicantsOnly ? (isLightTheme ? "text-cyan-600" : "text-cyan-300") : (isLightTheme ? "text-slate-400" : "text-gray-400")}`} />
                레이드 신청자만 보기
              </button>
              {showWowRaidApplicantsOnly && (
                <span className={`text-xs font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${isLightTheme ? "text-cyan-700 bg-cyan-50 border border-cyan-200" : "text-cyan-300 bg-cyan-500/10 border border-cyan-400/30"}`}>
                  레이드 신청자만 보는 중
                </span>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-base text-left">
              <thead className={wowTheme.tableHead}>
                <tr>
                  <th scope="col" className="px-6 py-5 rounded-tl-lg text-center">번호</th>
                  <th scope="col" className="px-6 py-5">프로필</th>
                  <th scope="col" className={`px-6 py-5 ${wowTheme.tableHeadHover}`} onClick={() => requestWowSort('streamerName')}>
                    <div className="flex items-center">스트리머명 <WowSortIcon columnKey="streamerName" /></div>
                  </th>
                  <th scope="col" className={`px-6 py-5 ${wowTheme.tableHeadHover}`} onClick={() => requestWowSort('wowNickname')}>
                    <div className="flex items-center">와우 닉네임 <WowSortIcon columnKey="wowNickname" /></div>
                  </th>
                  <th scope="col" className={`px-6 py-5 ${wowTheme.tableHeadHover}`} onClick={() => requestWowSort('jobClass')}>
                    <div className="flex items-center">직업 <WowSortIcon columnKey="jobClass" /></div>
                  </th>
                  <th scope="col" className="px-6 py-5 text-center">특성</th>
                  <th scope="col" className="px-6 py-5 text-center">선호 포지션</th>
                  <th scope="col" className={`px-6 py-5 rounded-tr-lg ${wowTheme.tableHeadHover}`} onClick={() => requestWowSort('level')}>
                    <div className="flex items-center justify-end">현재 레벨 <WowSortIcon columnKey="level" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedWowRoster.length > 0 ? (
                  sortedWowRoster.map((member, idx) => {
                    const isQualified = member.level >= 40;
                    const hasWowPartnerStatus = isWowPartnerMember(member);
                    const wowPartnerLabel = getWowPartnerDisplayLabel(member);

                    return (
                      <tr 
                        id={`wow-member-${member.id}`}
                        key={member.id} 
                        className={`border-b transition-all duration-500 ${
                          highlightedWowMemberId === member.id 
                            ? wowTheme.highlightedRow
                            : isQualified 
                              ? wowTheme.qualifiedRow
                              : wowTheme.defaultRow
                        }`}
                      >
                        <td className={`px-6 py-5 text-center font-bold text-lg ${wowTheme.mutedText} ${isQualified && isLightTheme ? "border-l-4 border-amber-400" : ""}`}>
                          {idx + 1}
                        </td>
                        <td className="px-6 py-5">
                          <div className="group relative flex flex-col items-center justify-center w-fit mx-auto md:mx-0 cursor-help z-10">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              {hasWowPartnerStatus ? (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[2.5px] shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                                  <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt={member.streamerName} className={`w-full h-full rounded-full object-cover border-[1.5px] ${isLightTheme ? "border-white bg-white" : "border-gray-900 bg-gray-900"}`} />
                                </div>
                              ) : (
                                <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt={member.streamerName} className={`w-full h-full rounded-full object-cover border-2 ${isQualified ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]' : isLightTheme ? 'border-slate-200 bg-white' : 'border-gray-600'}`} />
                              )}
                              {hasWowPartnerStatus && (
                                <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-1 shadow-xl border border-yellow-500/50 z-10">
                                  <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.8)]" />
                                </div>
                              )}
                            </div>

                            {hasWowPartnerStatus && (
                              <span className="mt-1.5 text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-widest drop-shadow-md select-none whitespace-nowrap">
                                {wowPartnerLabel}
                              </span>
                            )}

                            {hasWowPartnerStatus && (
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-max max-w-[220px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] transform translate-y-2 group-hover:translate-y-0">
                                <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/40 rounded-xl p-3.5 shadow-[0_10px_30px_rgba(250,204,21,0.3)] flex flex-col items-center text-center relative overflow-hidden">
                                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent opacity-50"></div>
                                  <Crown className="w-5 h-5 text-yellow-400 mb-2 relative z-10 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                                  <p className="text-xs text-gray-300 leading-relaxed relative z-10 font-medium break-keep">
                                    와우 컨텐츠를 진행.<br/>길드장 <strong className="text-yellow-400 font-black text-sm">『왁두』</strong>에게<br/>칭호를 하사받다.
                                  </p>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-yellow-500/40"></div>
                              </div>
                            )}

                          </div>
                        </td>
                        <td className={`px-6 py-5 font-bold text-lg ${isQualified ? (isLightTheme ? 'text-slate-900' : 'text-yellow-100') : wowTheme.heading}`}>
                          <div className="flex flex-col items-start gap-1">
                            <span>{member.streamerName}</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {isQualified && member.isApplied && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center whitespace-nowrap ${isLightTheme ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-green-900/60 text-green-400 border border-green-500/30"}`}>
                                  ✅ 버종리 신청 완료
                                </span>
                              )}
                              {member.isRaidApplied && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center whitespace-nowrap ${isLightTheme ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-cyan-900/60 text-cyan-300 border border-cyan-400/30"}`}>
                                  ⚔️ 줄구룹 신청완료
                                </span>
                              )}                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-5 font-medium text-lg ${isLightTheme ? "text-blue-600" : "text-blue-300"}`}>
                          {member.wowNickname}
                        </td>
                        <td className="px-6 py-5">
                          <span 
                            style={getJobBadgeStyle(member.jobClass, isLightTheme)}
                            className="px-3 py-1.5 rounded-md text-sm font-black border whitespace-nowrap inline-block shadow-sm"
                          >
                            {member.jobClass}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {member.mainSpec ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span title={getWowSpecTagTitle(member.jobClass, member.mainSpec, member.availableSpecs)} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-black border whitespace-nowrap shadow-sm ${wowSpecTagClass}`}>{member.mainSpec}</span>
                              {normalizeAvailableSpecs(member.jobClass, member.availableSpecs).length > 1 && <span className={`inline-flex items-center px-1.5 py-1 rounded-md text-[10px] font-black border whitespace-nowrap shadow-sm ${wowSpecExtraTagClass}`}>+{normalizeAvailableSpecs(member.jobClass, member.availableSpecs).length - 1}</span>}
                            </div>
                          ) : <span className={`text-sm ${wowTheme.faintText}`}>-</span>}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {normalizePreferredPositions(member.preferredPositions).length > 0 ? normalizePreferredPositions(member.preferredPositions).map((positionId) => (
                              <span key={positionId} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[15px] font-black border whitespace-nowrap leading-none shadow-sm ${getWowPositionTagClasses(positionId, isLightTheme)}`}>
                                {getWowPositionShortLabel(positionId)}
                              </span>
                            )) : (
                              <span className={`text-sm ${wowTheme.faintText}`}>-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end">
                            <span className={`font-black text-2xl mr-3 ${isQualified ? (isLightTheme ? 'text-amber-600' : 'text-yellow-400') : (isLightTheme ? 'text-slate-600' : 'text-gray-300')}`}>
                              Lv. {member.level}
                            </span>
                            <div className="flex flex-col gap-1.5 items-end">
                              {isQualified && (
                                <span className={`text-[11px] font-bold px-2 py-1 rounded shadow-md flex items-center ${isLightTheme ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white" : "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black"}`}>
                                  <Ticket className="w-3 h-3 mr-1" /> 참가권 획득!
                                </span>
                              )}
                              {!isQualified && (
                                <span className={`text-xs px-3 py-1.5 rounded border ${isLightTheme ? "text-slate-500 bg-white border-slate-200" : "text-gray-500 bg-gray-800 border border-gray-700"}`}>
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
                    <td colSpan="8" className={`px-6 py-16 text-center flex-col items-center ${wowTheme.faintText}`}>
                      <Shield className={`w-12 h-12 mx-auto mb-3 ${isLightTheme ? "text-slate-300" : "text-gray-700"}`} />
                      선택한 필터 조건에 해당하는 길드원이 없습니다.
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
      : [...raidSelectedLevelFilters].sort((a, b) => RAID_LEVEL_FILTER_OPTIONS.findIndex((item) => item.id === a) - RAID_LEVEL_FILTER_OPTIONS.findIndex((item) => item.id === b)).join(", ");

    const raidPartyGridClass = raidType === "40"
      ? (isRaidWaitingRoomCollapsed ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-4")
      : raidType === "25"
        ? (isRaidWaitingRoomCollapsed ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3")
        : raidType === "20"
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2";

    const isDenseRaidLayout = raidType === "20" || raidType === "25" || raidType === "40";
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
      ? "w-9 h-9"
      : isDenseRaidLayout
        ? "w-10 h-10"
        : "w-11 h-11";
    const raidSlotNameClass = isUltraDenseRaidLayout
      ? "text-[11px]"
      : isDenseRaidLayout
        ? "text-[12px]"
        : "text-[13px]";
    const raidSlotInfoClass = isUltraDenseRaidLayout ? "text-[10px]" : "text-[11px]";
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
        {isLightTheme && (
          <style>{`
            .raid-light-surface h1.text-white,
            .raid-light-surface h2.text-white,
            .raid-light-surface h3.text-white,
            .raid-light-surface h4.text-white,
            .raid-light-surface div.text-white,
            .raid-light-surface span.text-white,
            .raid-light-surface p.text-white { color: #0f172a; }
            .raid-light-surface .text-gray-400 { color: #64748b; }
            .raid-light-surface .text-gray-500 { color: #94a3b8; }
            .raid-light-surface .text-gray-300 { color: #475569; }
            .raid-light-surface .border-gray-700 { border-color: #e2e8f0; }
            .raid-light-surface .border-gray-600 { border-color: #cbd5e1; }
            .raid-light-surface .bg-gray-800,
            .raid-light-surface [class*="bg-gray-800/90"],
            .raid-light-surface [class*="bg-gray-800/40"] { background-color: #ffffff; }
            .raid-light-surface .bg-gray-900,
            .raid-light-surface [class*="bg-gray-900/60"],
            .raid-light-surface [class*="bg-gray-900/70"],
            .raid-light-surface [class*="bg-gray-900/80"] { background-color: #f8fafc; }
            .raid-light-surface .hover\\:bg-gray-700:hover { background-color: #e2e8f0; }
            .raid-light-surface .hover\\:bg-gray-800:hover,
            .raid-light-surface .hover\\:bg-gray-900:hover { background-color: #f8fafc; }
          `}</style>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => navigateTo("wow")}
            className={raidTheme.backButton}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> WOW 명단으로 돌아가기
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyRaidLink}
              className={raidTheme.pinkButton}
            >
              <Link2 className="w-4 h-4 mr-2" /> #raid 링크 복사
            </button>
            <button
              onClick={handleCopyRaidSummary}
              className={raidTheme.blueButton}
            >
              <Copy className="w-4 h-4 mr-2" /> 편성표 복사
            </button>
            <button
              onClick={handleCaptureRaidScreenshot}
              disabled={isRaidCapturing}
              className={`inline-flex items-center px-3.5 py-2 rounded-xl border transition ${
                isRaidCapturing
                  ? raidTheme.screenshotBusy
                  : raidTheme.screenshotIdle
              }`}
            >
              {isRaidCapturing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />} 스크린샷 저장
            </button>
            <button
              onClick={handleResetRaid}
              className={raidTheme.resetButton}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 초기화
            </button>
          </div>
        </div>

        <div className={raidTheme.hero}>
          <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-fuchsia-500/10 blur-3xl"></div>
          <div className="absolute -bottom-12 left-16 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl pt-0.5">
              <h2 className={`text-3xl md:text-4xl font-black flex items-center leading-none ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                <span className="mr-3 text-3xl md:text-4xl">⚔️</span> 레이드 구성하기
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-full xl:min-w-[460px] self-start">
              <div className={raidTheme.heroMetricCard}>
                <div className={`text-xs mb-1 ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>현재 레이드</div>
                <div className={`text-2xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{raidConfig.label}</div>
              </div>
              <div className={raidTheme.heroMetricCard}>
                <div className={`text-xs mb-1 ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>편성 인원</div>
                <div className={`text-2xl font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{assignedCount}<span className={`text-sm ${isLightTheme ? "text-slate-400" : "text-gray-400"}`}> / {totalRaidSlots}</span></div>
              </div>
              <div className={raidTheme.heroMetricCard}>
                <div className={`text-xs mb-1 ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>남은 자리</div>
                <div className={`text-2xl font-black ${isLightTheme ? "text-fuchsia-700" : "text-fuchsia-300"}`}>{remainingCount}</div>
              </div>
              <div className={raidTheme.heroMetricCard}>
                <div className={`text-xs mb-1 ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>고정 파티원</div>
                <div className={`text-lg font-black truncate ${isLightTheme ? "text-slate-900" : "text-white"}`}>{currentFixedRaidMember.streamerName}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={raidTheme.panel}>
          <div className={raidTheme.panelHeader}>
            <div>
              <div className={`text-sm font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>레이드 종류 선택</div>
              <div className={`text-xs mt-1 ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>규모를 바꾸면 가능한 파티 수가 즉시 바뀌고, 기존 배치는 앞쪽부터 최대한 유지됩니다.</div>
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
                        ? raidTheme.optionActive
                        : raidTheme.optionInactive
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
              <div className={raidTheme.panel}>
                <div className="p-3 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRaidWaitingRoomCollapsed(false)}
                    className={raidTheme.miniPanelButton}
                  >
                    <Menu className="w-5 h-5" />
                    <span className="text-[11px] font-black leading-tight text-center">대기실 열기</span>
                  </button>
                  <div className={raidTheme.miniPanelCount}>
                    <div className={`text-[10px] ${isLightTheme ? "text-slate-500" : "text-gray-500"}`}>대기 인원</div>
                    <div className={`text-base font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>{raidAvailableMembers.length}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 xl:sticky xl:top-24">
              <div className={raidTheme.panel}>
                <div className={`p-4 flex items-start justify-between gap-3 ${raidTheme.panelHeader}`}>
                  <div>
                    <h3 className={`text-lg font-black flex items-center ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                      <Users className={`w-5 h-5 mr-2 ${isLightTheme ? "text-fuchsia-600" : "text-fuchsia-300"}`} /> 대기실 명단
                    </h3>
                    <p className={`mt-1.5 text-xs ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>참가자를 끌어다가 오른쪽 슬롯에 배치해보세요.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRaidWaitingRoomCollapsed(true)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black transition ${raidTheme.optionInactive}`}
                  >
                    <Menu className="w-4 h-4" /> 접기
                  </button>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className={raidTheme.searchShell}>
                      <div className="flex items-center px-2.5">
                        <Search className={`w-4 h-4 ${isLightTheme ? "text-slate-400" : "text-gray-400"}`} />
                      </div>
                      <input
                        type="text"
                        value={raidSearchInput}
                        onChange={(e) => setRaidSearchInput(e.target.value)}
                        placeholder="스트리머, 닉네임, 직업 검색"
                        className={raidTheme.searchInput}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRaidFilterPanelCollapsed((prev) => !prev)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-black transition ${isRaidFilterPanelCollapsed ? raidTheme.filterToggleActive : raidTheme.filterToggleInactive}`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {isRaidFilterPanelCollapsed ? '설정 펼치기' : '설정 접기'}
                    </button>
                  </div>

                  {!isRaidFilterPanelCollapsed && (
                    <>
                  <div className="flex flex-wrap gap-2">
                    {raidJobStats.sortedJobs.map((job) => {
                      const count = raidJobStats.stats[job];
                      if (count === 0) return null;
                      const isSelected = raidSelectedJobFilters.includes(job);
                      const baseStyle = job === "전체"
                        ? { color: '#e2e8f0', backgroundColor: 'rgba(51, 65, 85, 0.4)', borderColor: 'rgba(71, 85, 105, 0.6)' }
                        : getJobBadgeStyle(job, isLightTheme);

                      return (
                        <button
                          key={job}
                          onClick={() => handleRaidJobFilterToggle(job)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                            isSelected ? 'ring-2 ring-white/40 shadow-[0_0_10px_rgba(255,255,255,0.15)]' : 'opacity-75 hover:opacity-100'
                          }`}
                          style={{
                            ...baseStyle,
                            backgroundColor: isSelected ? baseStyle.color : baseStyle.backgroundColor,
                            color: isSelected ? '#020617' : baseStyle.color,
                            borderColor: isSelected ? 'transparent' : baseStyle.borderColor,
                          }}
                        >
                          {job}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isSelected ? 'bg-black/25 text-white' : 'bg-gray-900 text-gray-300'}`}>
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
                        onClick={() => setIsRaidLevelFilterOpen((prev) => !prev)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black transition ${
                          isRaidLevelFilterOpen ? raidTheme.levelFilterToggleActive : raidTheme.levelFilterToggleInactive
                        }`}
                      >
                        <Filter className="w-3.5 h-3.5" /> 레벨
                        <span className={raidTheme.levelFilterSummary}>{raidLevelSummaryLabel}</span>
                        {isRaidLevelFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isRaidLevelFilterOpen && (
                      <div className="flex flex-wrap items-center gap-2 pl-0.5">
                        {RAID_LEVEL_FILTER_OPTIONS.map((option) => {
                          const isSelected = raidSelectedLevelFilters.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleRaidLevelFilterToggle(option.id)}
                              className={`px-3 py-1 rounded-full border text-xs font-black transition whitespace-nowrap ${
                                isSelected
                                  ? raidTheme.levelFilterOptionActive
                                  : raidTheme.levelFilterOptionInactive
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-0.5">
                    <div className="text-[11px] font-black text-gray-400 pl-0.5">특성</div>
                    {raidSelectedJobFilters.includes("전체") ? (
                      <div className="text-[11px] text-gray-500 pl-0.5">직업을 선택하면 해당 직업의 특성 필터가 열립니다.</div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRaidSpecFilterToggle("전체")}
                          className={`px-3 py-1 rounded-md border text-xs font-black transition whitespace-nowrap ${raidSelectedSpecFilters.includes("전체") ? wowSpecTagClass : (isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500')}`}
                        >
                          전체
                        </button>
                        {raidAvailableSpecOptions.map((spec) => {
                          const isSelected = raidSelectedSpecFilters.includes(spec);
                          return (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => handleRaidSpecFilterToggle(spec)}
                              className={`px-3 py-1 rounded-md border text-xs font-black transition whitespace-nowrap ${isSelected ? wowSpecTagClass : (isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500')}`}
                            >
                              {spec}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-0.5">
                    <div className="text-[11px] font-black text-gray-400 pl-0.5">선호 포지션</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {raidPositionStats.orderedIds.map((positionId) => {
                        const meta = getWowPositionMeta(positionId);
                        const count = raidPositionStats.stats[positionId] || 0;
                        const isSelected = raidSelectedPositionFilters.includes(positionId);
                        return (
                          <button
                            key={positionId}
                            type="button"
                            onClick={() => handleRaidPositionFilterToggle(positionId)}
                            className={`px-3 py-1 rounded-full border text-xs font-black transition whitespace-nowrap ${
                              getWowPositionFilterButtonClasses(positionId, isSelected, isLightTheme)
                            }`}
                          >
                            {meta?.label}
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${getWowPositionCountClasses(positionId, isSelected, isLightTheme)}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                      {filteredWowRaidRosterCandidates.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-6">검색 결과가 없습니다.</div>
                      )}
                    </div>
                  </div>

                    </>
                  )}

                  <div className={`${isRaidFilterPanelCollapsed ? 'max-h-[calc(100vh-230px)]' : 'max-h-[calc(100vh-300px)]'} min-h-[420px] overflow-y-auto custom-scrollbar pr-1`}>
                    <div className="grid grid-cols-1 gap-2">
                      {raidAvailableMembers.map((member) => {
                        return (
                          <div
                            key={member.id}
                            draggable
                            onDragStart={(event) => handleRaidDragStart(event, member.id)}
                            onDragEnd={clearRaidDragState}
                            onClick={() => handleQuickAddRaidMember(member.id)}
                            className="rounded-xl border p-2.5 transition cursor-grab active:cursor-grabbing border-gray-700 bg-gray-900/60 hover:border-gray-500 hover:bg-gray-900"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={getWowAvatarSrc(member)}
                                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }}
                                alt={member.streamerName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-700 bg-gray-950 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap leading-tight">
                                  <div className="text-sm font-black text-white break-words">{member.streamerName}</div>
                                  <span className="text-[11px] font-black text-gray-300 whitespace-nowrap">Lv. {member.level}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span style={getJobBadgeStyle(member.jobClass, isLightTheme)} className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap">
                                    {member.jobClass}
                                  </span>
                                  {member.mainSpec && (
                                    <span title={getWowSpecTagTitle(member.jobClass, member.mainSpec, member.availableSpecs)} className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border whitespace-nowrap ${wowSpecTagClass}`}>
                                      {member.mainSpec}
                                    </span>
                                  )}
                                  {normalizePreferredPositions(member.preferredPositions).map((positionId) => (
                                    <span key={positionId} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border whitespace-nowrap ${getWowPositionTagClasses(positionId, isLightTheme)}`}>
                                      {getWowPositionShortLabel(positionId)}
                                    </span>
                                  ))}
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

          <div className="space-y-5" ref={raidScreenshotRef} data-raid-screenshot-root="true">
            <div className={raidTheme.panel}>
              <div className={`px-4 py-3 border-b ${isLightTheme ? "border-slate-200 bg-slate-50" : "border-gray-700 bg-gray-900/60"}`}>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-lg font-black flex items-center ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                          <Shield className={`w-5 h-5 mr-2 ${isLightTheme ? "text-blue-600" : "text-blue-300"}`} /> {raidConfig.label} 레이드 파티 구성
                        </h3>
                        <div className="relative" data-raid-floating-layer="true">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRaidRoleGuideOpen((prev) => !prev);
                              setIsRaidFixedMemberMenuOpen(false);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black transition ${
                              isRaidRoleGuideOpen ? 'border-violet-400/40 bg-violet-500/15 text-violet-100' : 'border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-500'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" /> 역할 안내
                          </button>
                          {isRaidRoleGuideOpen && (
                            <div data-raid-role-panel="true" className="absolute left-0 top-[calc(100%+10px)] z-30 w-56 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-3 shadow-2xl">
                              <div className="text-[11px] font-black text-white mb-2">레이드 역할 안내</div>
                              <div className="space-y-1.5">
                                {RAID_ROLE_OPTIONS.map((role) => (
                                  <div key={role.id} className="flex items-center gap-2 text-xs text-gray-200">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border ${role.chipClass}`}>
                                      {renderRaidRoleIcon(role.id, "w-3.5 h-3.5")}
                                    </span>
                                    <span className="font-semibold">{role.label}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="mt-2 text-[10px] text-gray-400">참가자마다 여러 역할을 함께 지정할 수 있습니다.</p>
                            </div>
                          )}
                        </div>
                        <div className="relative" data-raid-floating-layer="true">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRaidFixedMemberMenuOpen((prev) => !prev);
                              setIsRaidRoleGuideOpen(false);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black transition ${
                              isRaidFixedMemberMenuOpen ? 'border-amber-400/40 bg-amber-500/15 text-amber-100' : 'border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:border-gray-500'
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" /> 고정 길드원 바꾸기
                          </button>
                          {isRaidFixedMemberMenuOpen && (
                            <div data-raid-role-panel="true" className="absolute left-0 top-[calc(100%+10px)] z-30 w-80 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-3 shadow-2xl">
                              <div className="text-[11px] font-black text-white mb-2">고정 길드원 선택</div>
                              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelectFixedRaidMemberOption(DEFAULT_FIXED_RAID_MEMBER_OPTION_ID)}
                                  className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                                    selectedFixedRaidMemberOptionId === DEFAULT_FIXED_RAID_MEMBER_OPTION_ID
                                      ? 'border-amber-400/50 bg-amber-500/10 text-amber-100'
                                      : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-full border border-yellow-400 bg-gradient-to-br from-yellow-300/25 via-amber-300/10 to-yellow-500/25 flex items-center justify-center shrink-0 text-lg">👑</div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-black truncate">길드장 우왁굳</div>
                                    <div className="text-[11px] text-gray-400">성기사 · Lv.60</div>
                                  </div>
                                </button>
                                {sortedFixedRaidMembers.map((member) => {
                                  const isSelected = selectedFixedRaidMemberOptionId === member.id;
                                  return (
                                    <button
                                      key={member.id}
                                      type="button"
                                      onClick={() => handleSelectFixedRaidMemberOption(member.id)}
                                      className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                                        isSelected
                                          ? 'border-amber-400/50 bg-amber-500/10 text-amber-100'
                                          : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                                      }`}
                                    >
                                      <img
                                        src={getWowAvatarSrc(member)}
                                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }}
                                        alt={member.streamerName}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-700 bg-gray-950 shrink-0"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-black truncate">{member.streamerName}</div>
                                        <div className="text-[11px] text-gray-400">{member.jobClass} · Lv.{member.level}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {normalizePreferredPositions(member.preferredPositions).map((positionId) => (
                                            <span key={positionId} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border whitespace-nowrap ${getWowPositionTagClasses(positionId, isLightTheme)}`}>{getWowPositionShortLabel(positionId)}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                                {sortedFixedRaidMembers.length === 0 && (
                                  <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/60 px-3 py-4 text-xs text-gray-400 text-center">관리자 모드에서 등록한 고정 길드원이 아직 없습니다.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-start xl:justify-end xl:max-w-[45%] xl:pt-0.5">
                      {Object.entries(assignedClassStats).length > 0 ? Object.entries(assignedClassStats).sort((a, b) => b[1] - a[1]).map(([job, count]) => (
                        <span key={job} style={getJobBadgeStyle(job, isLightTheme)} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-black border">
                          {job} <span className="ml-1 opacity-80">{count}</span>
                        </span>
                      )) : (
                        <span className="text-sm text-gray-500">아직 편성된 직업이 없습니다.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">
                      참가자의 선호 포지션 말고도 다른 포지션을 지정할 수 있습니다.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
                      {WOW_POSITION_OPTIONS.filter((option) => option.id !== '전체').map((option) => {
                        const countLabel = option.id === 'heal' ? option.label : option.shortLabel;
                        return (
                          <span key={option.id} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black border ${getWowPositionTagClasses(option.id, isLightTheme)}`}>
                            {countLabel} <span className="ml-1">{raidAssignedPositionStats[option.id] || 0}</span>
                          </span>
                        );
                      })}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-900 text-gray-200 text-[11px] font-black border border-gray-700">
                        미정 <span className="ml-1">{raidAssignedPositionStats.undecided}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-3 grid gap-3 ${raidPartyGridClass}`}>
                {Array.from({ length: raidConfig.groupCount }).map((_, groupIndex) => {
                  const groupMembers = raidAssignments[groupIndex] || [];
                  const filledCount = groupMembers.filter(Boolean).length;

                  return (
                    <div key={groupIndex} className="relative rounded-2xl border border-gray-700 bg-gray-900/55 overflow-visible">
                      <div className={`px-3 ${isUltraDenseRaidLayout ? 'py-2' : 'py-2.5'} border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between`}>
                        <div className={`${isUltraDenseRaidLayout ? 'text-sm' : 'text-base'} font-black text-white`}>파티 {groupIndex + 1}</div>
                        <div className={`${raidSlotInfoClass} text-gray-400`}>{filledCount} / {RAID_SLOT_SIZE}</div>
                      </div>

                      <div className={raidGroupInnerClass}>
                        {groupMembers.map((memberId, slotIndex) => {
                          const member = memberId ? raidMemberMap[memberId] : null;
                          const isFixedRaidMember = isFixedRaidMemberId(memberId);
                          const isSelected = memberId && selectedRaidMemberId === memberId;
                          const slotKey = `${groupIndex}-${slotIndex}`;
                          const isDropTarget = raidDragOverSlot === slotKey;
                          const isTargetSlotSelected = !member && selectedRaidTargetSlotKey === slotKey;
                          const roleIds = member ? (raidRoleAssignments[member.id] || []) : [];
                          const visibleRoleIds = roleIds.slice(0, 2);
                          const hiddenRoleCount = Math.max(roleIds.length - visibleRoleIds.length, 0);
                          const isRoleMenuOpen = raidRoleMenuSlotKey === slotKey;
                          const roleTooltip = roleIds.map((roleId) => getRaidRoleMeta(roleId)?.label).filter(Boolean).join(', ');

                          return (
                            <div
                              key={slotKey}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleRaidSlotClick(groupIndex, slotIndex)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleRaidSlotClick(groupIndex, slotIndex);
                                }
                              }}
                              onDragOver={(event) => handleRaidSlotDragOver(event, groupIndex, slotIndex)}
                              onDrop={(event) => handleRaidSlotDrop(event, groupIndex, slotIndex)}
                              onDragLeave={() => setRaidDragOverSlot((prev) => prev === slotKey ? null : prev)}
                              draggable={Boolean(member)}
                              onDragStart={(event) => handleRaidDragStart(event, memberId)}
                              onDragEnd={clearRaidDragState}
                              className={`w-full rounded-xl border text-left transition overflow-visible ${
                                isDropTarget
                                  ? 'border-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_22px_rgba(168,85,247,0.18)]'
                                  : isSelected
                                    ? 'border-fuchsia-400 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
                                    : isTargetSlotSelected
                                      ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                                      : member
                                        ? 'border-gray-700 bg-gray-800/90 hover:border-blue-400/50 hover:bg-gray-800'
                                        : 'border-dashed border-gray-700 bg-gray-900/60 hover:border-fuchsia-500/40 hover:bg-gray-900'
                              } ${member ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                            >
                              <div className={`flex items-center gap-2.5 ${raidSlotPaddingClass} ${raidSlotMinHeightClass}`}>
                                {member ? (
                                  <>
                                    {member.isGuildMaster ? (
                                      <div className={`${raidSlotAvatarClass} rounded-full bg-gradient-to-br from-yellow-300/25 via-amber-300/10 to-yellow-500/25 border border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.28)] flex items-center justify-center shrink-0 ${isUltraDenseRaidLayout ? 'text-base' : 'text-lg'}`}>
                                        👑
                                      </div>
                                    ) : (
                                      <img
                                        src={getWowAvatarSrc(member)}
                                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }}
                                        alt={member.streamerName}
                                        className={`${raidSlotAvatarClass} rounded-full object-cover border ${isFixedRaidMember ? 'border-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.35)]' : 'border-gray-700'} bg-gray-950 shrink-0`}
                                      />
                                    )}

                                    <div className="min-w-0 flex-1">
                                      <div className={`${raidSlotNameClass} font-black text-white truncate`}>{member.streamerName}</div>
                                      <div className={`flex items-center gap-1.5 mt-1 flex-wrap ${raidSlotInfoClass}`}>
                                        <span style={getJobBadgeStyle(member.jobClass, isLightTheme)} className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap">
                                          {member.jobClass}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="min-w-0 flex-1">
                                    <div className={`${raidSlotNameClass} font-black text-gray-400`}>빈 슬롯</div>
                                  </div>
                                )}

                                {member && (
                                  <div className="relative shrink-0 flex items-center gap-1.5" data-raid-floating-layer="true">
                                    {(() => {
                                      const preferredPositionIds = normalizePreferredPositions(member.preferredPositions);
                                      const assignedPositionId = raidAssignedPreferredPositions[member.id];
                                      const fallbackPositionId = preferredPositionIds[0] || null;
                                      const displayPositionId = assignedPositionId && WOW_POSITION_IDS.includes(assignedPositionId)
                                        ? assignedPositionId
                                        : fallbackPositionId;
                                      const assignedPositionLabel = displayPositionId ? getWowPositionShortLabel(displayPositionId) : '미정';
                                      const isPositionMenuOpen = raidPositionMenuSlotKey === slotKey;
                                      return (
                                        <div className="relative" data-raid-floating-layer="true">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRaidPositionMenuSlotKey((prev) => prev === slotKey ? null : slotKey);
                                              setRaidRoleMenuSlotKey(null);
                                            }}
                                            title={preferredPositionIds.length > 0
                                              ? `선호 포지션: ${preferredPositionIds.map((positionId) => getWowPositionShortLabel(positionId)).join(', ')} / 현재 배정: ${assignedPositionLabel}`
                                              : `배정 포지션: ${assignedPositionLabel}`}
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 transition ${
                                              displayPositionId
                                                ? `${getWowPositionTagClasses(displayPositionId, isLightTheme)} hover:brightness-110`
                                                : 'border-gray-700 bg-gray-900 text-gray-200 hover:text-white hover:border-white/50'
                                            }`}
                                          >
                                            <span className="text-[10px] font-black">{assignedPositionLabel}</span>
                                          </button>

                                          {isPositionMenuOpen && (
                                            <div data-raid-role-panel="true" className="absolute right-0 top-[calc(100%+10px)] z-30 w-40 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-2 shadow-2xl">
                                              <div className="px-2 pb-2 text-[10px] font-black text-gray-400">배정 포지션</div>
                                              <div className="space-y-1">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectRaidAssignedPosition(member.id, null);
                                                    setRaidPositionMenuSlotKey(null);
                                                  }}
                                                  className={`w-full flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                                    !assignedPositionId && !fallbackPositionId
                                                      ? 'border-gray-500 bg-gray-800 text-white'
                                                      : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                                                  }`}
                                                >
                                                  <span>미정</span>
                                                  {!assignedPositionId && !fallbackPositionId && <CheckSquare className="w-3.5 h-3.5 shrink-0" />}
                                                </button>
                                                {WOW_POSITION_OPTIONS.filter((option) => option.id !== '전체').map((option) => {
                                                  const isActive = assignedPositionId === option.id || (!assignedPositionId && fallbackPositionId === option.id);
                                                  return (
                                                    <button
                                                      key={option.id}
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectRaidAssignedPosition(member.id, option.id);
                                                        setRaidPositionMenuSlotKey(null);
                                                      }}
                                                      className={`w-full flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                                        isActive
                                                          ? getWowPositionMenuOptionClasses(option.id, true, isLightTheme)
                                                          : getWowPositionMenuOptionClasses(option.id, false, isLightTheme)
                                                      }`}
                                                    >
                                                      <span>{option.label}</span>
                                                      {isActive && <CheckSquare className="w-3.5 h-3.5 shrink-0" />}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRaidRoleMenuSlotKey((prev) => prev === slotKey ? null : slotKey);
                                        setRaidPositionMenuSlotKey(null);
                                      }}
                                      title={roleTooltip || '역할 지정'}
                                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 transition ${
                                        roleIds.length > 0
                                          ? 'border-violet-400/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/15'
                                          : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-violet-400/30'
                                      }`}
                                    >
                                      {roleIds.length > 0 ? (
                                        <>
                                          {visibleRoleIds.map((roleId) => (
                                            <span key={roleId} className="inline-flex">{renderRaidRoleIcon(roleId, "w-3.5 h-3.5")}</span>
                                          ))}
                                          {hiddenRoleCount > 0 && <span className="text-[10px] font-black text-violet-100">+{hiddenRoleCount}</span>}
                                        </>
                                      ) : (
                                        <>
                                          <CheckSquare className="w-3.5 h-3.5" />
                                          <span className="text-[10px] font-black">역할</span>
                                        </>
                                      )}
                                    </button>

                                    {isRoleMenuOpen && (
                                      <div data-raid-role-panel="true" className="absolute right-0 top-[calc(100%+10px)] z-30 w-44 rounded-2xl border border-gray-700 bg-gray-950/95 backdrop-blur p-2 shadow-2xl">
                                        <div className="px-2 pb-2 text-[10px] font-black text-gray-400">역할 배지 설정</div>
                                        <div className="space-y-1">
                                          {RAID_ROLE_OPTIONS.map((role) => {
                                            const isActive = roleIds.includes(role.id);
                                            return (
                                              <button
                                                key={role.id}
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleToggleRaidRole(member.id, role.id);
                                                }}
                                                className={`w-full flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                                                  isActive
                                                    ? `${role.chipClass} shadow-[0_0_12px_rgba(255,255,255,0.06)]`
                                                    : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
                                                }`}
                                              >
                                                <span className="flex items-center gap-2 min-w-0">
                                                  {renderRaidRoleIcon(role.id, 'w-3.5 h-3.5')}
                                                  <span className="truncate">{role.label}</span>
                                                </span>
                                                {isActive && <CheckSquare className="w-3.5 h-3.5 shrink-0" />}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {member && !isFixedRaidMember && (
                                  <button
                                    type="button"
                                    data-no-screenshot="true"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveRaidMember(groupIndex, slotIndex);
                                    }}
                                    className={`${isUltraDenseRaidLayout ? 'w-6 h-6' : 'w-7 h-7'} rounded-full border border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:border-red-400/40 hover:bg-red-500/10 flex items-center justify-center transition shrink-0`}
                                    aria-label="슬롯에서 제거"
                                  >
                                    <X className={`${isUltraDenseRaidLayout ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
        <div className={adminTheme.loginCard}>
          <Lock className={`w-12 h-12 mx-auto mb-4 ${isLightTheme ? "text-emerald-600" : "text-green-400"}`} />
          <h2 className={adminTheme.loginTitle}>관리자 로그인</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="text"
              value={adminNicknameInput}
              onChange={(e) => setAdminNicknameInput(e.target.value)}
              placeholder="관리자 닉네임을 입력하세요 (예: 스태프A)"
              className={adminTheme.loginInput}
              required
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className={adminTheme.loginInput}
              required
            />
            <button type="submit" disabled={isAdminLoggingIn} className={adminTheme.loginButton}>
              {isAdminLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "안전하게 접속하기"}
            </button>
          </form>
        </div>
      );

    const handleCleanGhostData = async () => {
      if (!user || !window.confirm("경기 기록이 전혀 없는 '유령 선수'들을 찾아 명단에서 모두 삭제하시겠습니까?")) return;
      setIsCleaningGhosts(true);
      try {
        let deletedCount = 0;
        for (const p of players) {
          const hasMatch = matches.some((m) => m.results?.some((r) => r.playerName === p.name));
          if (!hasMatch) {
            await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", p.id));
            deletedCount++;
          }
        }
        await updateLastModifiedTime();
        if (deletedCount > 0) {
          showToast(`총 ${deletedCount}명의 유령 데이터를 성공적으로 청소했습니다!`);
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
      if (!user || !window.confirm(`정말 [${playerName}] 선수를 명단에서 강제 삭제하시겠습니까?\n\n(주의: 이 선수가 참여한 경기 기록이 남아있다면 데이터가 꼬일 수 있으니, 경기 기록이 없는 '유령 선수'만 삭제해주세요!)`)) return;
      try {
        await deleteDoc(doc(db, "artifacts", appId, "public", "data", "players", playerId));
        await updateLastModifiedTime();
        showToast(`[${playerName}] 선수가 명단에서 영구 삭제되었습니다.`);
      } catch (error) {
        showToast("선수 삭제 중 오류가 발생했습니다.", "error");
      }
    };

    const ensureDraftPlayersExistForMatchResults = async (results = []) => {
      const uniqueNames = [...new Set((results || []).map((r) => (r.playerName || "").trim()).filter(Boolean))];
      for (const playerName of uniqueNames) {
        const existingPlayer = players.find((p) => p.name === playerName);
        const existingDraft = draftPlayers.find((p) => p.name === playerName);
        if (!existingPlayer && !existingDraft) {
          await addDoc(collection(db, "artifacts", appId, "public", "data", "draft_players"), {
            name: playerName,
            imageUrl: "",
            broadcastUrl: "",
            createdAt: new Date().toISOString(),
          });
        }
      }
    };

    const ensurePlayersExistForPublishedMatchResults = async (results = []) => {
      const uniqueNames = [...new Set((results || []).map((r) => (r.playerName || "").trim()).filter(Boolean))];
      for (const playerName of uniqueNames) {
        const existing = players.find((p) => p.name === playerName);
        if (existing) continue;
        const existingDraft = draftPlayers.find((p) => p.name === playerName);
        await addDoc(collection(db, "artifacts", appId, "public", "data", "players"), {
          name: playerName,
          points: 0,
          imageUrl: existingDraft?.imageUrl || "",
          broadcastUrl: existingDraft?.broadcastUrl || "",
          createdAt: new Date().toISOString(),
        });
        if (existingDraft?.id) {
          await deleteDoc(doc(db, "artifacts", appId, "public", "data", "draft_players", existingDraft.id));
        }
      }
    };

    const applyMatchScoreDelta = async (oldResults = [], newResults = []) => {
      const tally = (results) => {
        const map = new Map();
        (results || []).forEach((r) => {
          const name = (r.playerName || "").trim();
          if (!name) return;
          map.set(name, (map.get(name) || 0) + (Number(r.scoreChange) || 0));
        });
        return map;
      };

      const oldMap = tally(oldResults);
      const newMap = tally(newResults);
      const allNames = new Set([...oldMap.keys(), ...newMap.keys()]);

      for (const playerName of allNames) {
        const delta = (newMap.get(playerName) || 0) - (oldMap.get(playerName) || 0);
        if (!delta) continue;

        let player = players.find((p) => p.name === playerName);
        if (!player) {
          const playerQuery = query(collection(db, "artifacts", appId, "public", "data", "players"), where("name", "==", playerName));
          const playerSnapshot = await getDocs(playerQuery);
          if (!playerSnapshot.empty) {
            const playerDoc = playerSnapshot.docs[0];
            player = { id: playerDoc.id, ...playerDoc.data() };
          }
        }

        if (player) {
          await updateDoc(doc(db, "artifacts", appId, "public", "data", "players", player.id), { points: increment(delta) });
        } else if (delta > 0) {
          await addDoc(collection(db, "artifacts", appId, "public", "data", "players"), { name: playerName, points: delta, createdAt: new Date().toISOString() });
        }
      }
    };

    const handleSubmitMatch = async (e, publishNow = false) => {
      e?.preventDefault?.();
      if (!gameName.trim()) return showToast("게임 이름을 입력해주세요.", "error");

      let finalResults = [];
      let nextTeamResults = [];
      if (matchMode === "individual") {
        finalResults = individualResults
          .filter((r) => r.playerName.trim() !== "")
          .map(r => ({
             playerName: r.playerName.trim(),
             rank: r.rank,
             scoreChange: r.scoreChange,
             ...(hasFunding ? { fundingRatio: Number(r.fundingRatio) || 0, fundingAmount: Number(r.fundingAmount) || 0 } : {})
          }));
      } else {
        const teamPayload = buildTeamMatchPayload(teamResults, hasFunding);
        finalResults = teamPayload.results;
        nextTeamResults = teamPayload.teamResults;
      }

      if (finalResults.length === 0) return showToast("최소 1명 이상의 유효한 참가자를 입력해주세요.", "error");

      setIsSubmitting(true);
      try {
        if (publishNow) {
          await ensurePlayersExistForPublishedMatchResults(finalResults);
        } else {
          await ensureDraftPlayersExistForMatchResults(finalResults);
        }

        await addDoc(collection(db, "artifacts", appId, "public", "data", "matches"), {
          date: matchDate, 
          gameName, 
          createdAt: new Date().toISOString(), 
          matchType: matchMode,
          hasFunding, 
          totalFunding: hasFunding ? Number(totalFunding) || 0 : 0,
          results: finalResults,
          teamResults: matchMode === "team" ? nextTeamResults : [],
          isPublished: publishNow,
          publishedAt: publishNow ? new Date().toISOString() : null,
        });

        if (publishNow) {
          await applyMatchScoreDelta([], finalResults);
        }

        setGameName("");
        setHasFunding(false);
        setTotalFunding("");
        setIndividualResults([{ playerName: "", rank: 1, scoreChange: 100, fundingRatio: "", fundingAmount: "" }, { playerName: "", rank: 2, scoreChange: 50, fundingRatio: "", fundingAmount: "" }]);
        setTeamResults(createDefaultTeamMatchResults());
        await updateLastModifiedTime(); 
        showToast(publishNow ? "경기 기록이 공개되었습니다." : "경기 기록이 임시 저장되었습니다.");
        if (publishNow) navigateTo("tier");
      } catch (error) {
        showToast("오류 발생", "error");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className={adminTheme.shell}>
        {isLightTheme && (
          <style>{`
            .admin-light-surface h1.text-white,
            .admin-light-surface h2.text-white,
            .admin-light-surface h3.text-white,
            .admin-light-surface h4.text-white,
            .admin-light-surface p.text-white,
            .admin-light-surface span.text-white,
            .admin-light-surface div.text-white,
            .admin-light-surface label.text-white,
            .admin-light-surface strong.text-white { color: #0f172a; }
            .admin-light-surface p.text-gray-200,
            .admin-light-surface span.text-gray-200,
            .admin-light-surface div.text-gray-200,
            .admin-light-surface label.text-gray-200,
            .admin-light-surface strong.text-gray-200 { color: #334155; }
            .admin-light-surface p.text-gray-400,
            .admin-light-surface span.text-gray-400,
            .admin-light-surface div.text-gray-400,
            .admin-light-surface label.text-gray-400 { color: #64748b; }
            .admin-light-surface p.text-gray-500,
            .admin-light-surface span.text-gray-500,
            .admin-light-surface div.text-gray-500,
            .admin-light-surface label.text-gray-500 { color: #94a3b8; }
            .admin-light-surface p.text-gray-300,
            .admin-light-surface span.text-gray-300,
            .admin-light-surface div.text-gray-300,
            .admin-light-surface label.text-gray-300 { color: #475569; }
            .admin-light-surface .border-gray-700 { border-color: #e2e8f0; }
            .admin-light-surface .border-gray-600 { border-color: #cbd5e1; }
            .admin-light-surface .border-gray-500 { border-color: #cbd5e1; }
            .admin-light-surface .bg-gray-900 { background-color: #f8fafc; }
            .admin-light-surface .bg-gray-800 { background-color: #ffffff; }
            .admin-light-surface .bg-gray-700 { background-color: #e2e8f0; }
            .admin-light-surface .bg-gray-700.text-white { color: #334155; }
            .admin-light-surface .bg-gray-700.text-gray-200 { color: #334155; }
            .admin-light-surface .bg-gray-700.text-gray-400 { color: #94a3b8; }
            .admin-light-surface .text-violet-200 { color: #6d28d9; }
            .admin-light-surface .text-blue-400 { color: #1d4ed8; }
            .admin-light-surface .text-red-400 { color: #be123c; }
            .admin-light-surface .text-indigo-300 { color: #4338ca; }
            .admin-light-surface .text-indigo-400 { color: #4f46e5; }
            .admin-light-surface .text-green-300 { color: #15803d; }
            .admin-light-surface .text-green-400 { color: #15803d; }
            .admin-light-surface .text-emerald-200 { color: #047857; }
            .admin-light-surface .text-amber-100 { color: #b45309; }
            .admin-light-surface .text-yellow-300 { color: #b45309; }
            .admin-light-surface [class*="bg-violet-500/10"] { background-color: #f5f3ff; }
            .admin-light-surface [class*="border-violet-400/30"] { border-color: #ddd6fe; }
            .admin-light-surface [class*="bg-blue-900/40"] { background-color: #eff6ff; }
            .admin-light-surface [class*="bg-red-900/40"] { background-color: #fff1f2; }
            .admin-light-surface [class*="bg-green-900/30"] { background-color: #ecfdf5; }
            .admin-light-surface [class*="border-green-700/50"] { border-color: #86efac; }
            .admin-light-surface [class*="bg-yellow-900/30"] { background-color: #fffbeb; }
            .admin-light-surface [class*="border-yellow-700/50"] { border-color: #fde68a; }
            .admin-light-surface [class*="bg-indigo-900/30"] { background-color: #eef2ff; }
            .admin-light-surface [class*="border-indigo-700/50"] { border-color: #c7d2fe; }
            .admin-light-surface [class*="border-indigo-800/50"] { border-color: #c7d2fe; }
            .admin-light-surface [class*="bg-emerald-500/15"] { background-color: #ecfdf5; }
            .admin-light-surface [class*="border-emerald-400/30"] { border-color: #a7f3d0; }
            .admin-light-surface [class*="bg-amber-500/15"] { background-color: #fffbeb; }
            .admin-light-surface [class*="border-amber-400/30"] { border-color: #fde68a; }
            .admin-light-surface .hover\\:bg-gray-600:hover { background-color: #cbd5e1; }
            .admin-light-surface .hover\\:bg-gray-700:hover { background-color: #e2e8f0; }
            .admin-light-surface [class*="hover:bg-violet-500/20"]:hover { background-color: #ede9fe; }
          `}</style>
        )}
        
        {/* 상단 관리자 접속 현황 */}
        <div className={adminTheme.activityCard}>
          <div>
            <h3 className={`text-sm font-bold mb-2 flex items-center ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>
              <Activity className={`w-4 h-4 mr-1.5 ${isLightTheme ? "text-emerald-600" : "text-green-400"}`} /> 현재 활동 중인 관리자 ({activeAdmins.length}명)
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeAdmins.map(admin => (
                <span key={admin.id} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${admin.name === currentAdminName ? (isLightTheme ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-green-900/50 text-green-400 border border-green-500/50') : (isLightTheme ? 'bg-slate-50 text-slate-600 border border-slate-200' : 'bg-gray-700 text-gray-300')}`}>
                  <span className={`w-2.5 h-2.5 rounded-full mr-2 animate-pulse ${isLightTheme ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]" : "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"}`}></span>
                  {admin.name} {admin.name === currentAdminName && <span className="ml-1 opacity-60 text-xs">(나)</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={handleAdminLogout} className={`text-sm font-bold flex items-center px-4 py-2 rounded-lg transition shrink-0 border ${isLightTheme ? "text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border-rose-200 shadow-sm" : "text-red-400 hover:text-white bg-red-900/30 hover:bg-red-600 border-red-800/50"}`}>
            <Unlock className="w-4 h-4 mr-1.5" /> 로그아웃
          </button>
        </div>

        {/* ★ 관리자 탭 분리 메뉴 ★ */}
        <div className={adminTheme.tabBar}>
          <button 
            onClick={() => setAdminInnerTab("league")} 
            className={`flex-1 py-3 text-sm font-bold rounded-lg flex justify-center items-center transition-all ${adminInnerTab === "league" ? adminTheme.tabActive : adminTheme.tabInactive}`}
          >
            <Swords className="w-4 h-4 mr-2" /> 버종리 설정
          </button>
          <button 
            onClick={() => setAdminInnerTab("wow")} 
            className={`flex-1 py-3 text-sm font-bold rounded-lg flex justify-center items-center transition-all ${adminInnerTab === "wow" ? adminTheme.tabActive : adminTheme.tabInactive}`}
          >
            <Shield className="w-4 h-4 mr-2" /> 와우 설정
          </button>
          <button 
            onClick={() => setAdminInnerTab("etc")} 
            className={`flex-1 py-3 text-sm font-bold rounded-lg flex justify-center items-center transition-all ${adminInnerTab === "etc" ? adminTheme.tabActive : adminTheme.tabInactive}`}
          >
            <Layers className="w-4 h-4 mr-2" /> 기타 설정 (공지 등)
          </button>
        </div>

        {/* =========================================================
            [버종리 설정] 탭 컨텐츠
            ========================================================= */}
        {adminInnerTab === "league" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <PlusCircle className="w-6 h-6 mr-2 text-green-400" /> 새 경기 결과 등록
                </h2>
              </div>

              <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
                <button type="button" onClick={() => setMatchMode("individual")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${matchMode === "individual" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
                  <User className="w-4 h-4 mr-2" /> 개인전
                </button>
                <button type="button" onClick={() => setMatchMode("team")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${matchMode === "team" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
                  <Users className="w-4 h-4 mr-2" /> 팀전
                </button>
              </div>

              <form onSubmit={(e) => handleSubmitMatch(e, false)} className="space-y-6">
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
                        <span className="text-sm text-gray-300 font-bold whitespace-nowrap">총 모인 별풍선 개수:</span>
                        <div className="flex items-center w-full sm:w-auto">
                          <input 
                            type="number" 
                            placeholder="예: 100000" 
                            value={totalFunding} 
                            onChange={(e) => setTotalFunding(e.target.value)} 
                            className="w-full sm:w-48 bg-gray-900 border border-gray-600 text-yellow-400 font-black rounded-l-lg px-4 py-2 focus:border-yellow-500 outline-none text-right" 
                          />
                          <span className="bg-gray-700 border border-l-0 border-gray-600 text-gray-300 px-4 py-2 rounded-r-lg font-bold">개</span>
                        </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="게임 이름" className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
                  <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
                </div>

                {matchMode === "individual" && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3">
                    <p className="text-xs font-bold text-gray-500 mb-2">개인별 순위와 점수를 입력합니다.</p>
                    {individualResults.map((r, idx) => (
                      <div key={idx} className="flex flex-col gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                        <div className="flex gap-2">
                          <input type="number" value={r.rank} onChange={(e) => { const n = [...individualResults]; n[idx].rank = Number(e.target.value); setIndividualResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600" />
                          <input type="text" value={r.playerName} onChange={(e) => { const n = [...individualResults]; n[idx].playerName = e.target.value; setIndividualResults(n); }} placeholder="참가자 이름" className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600" />
                          <input type="number" value={r.scoreChange} onChange={(e) => { const n = [...individualResults]; n[idx].scoreChange = Number(e.target.value); setIndividualResults(n); }} placeholder="점수" className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600" />
                          <button type="button" onClick={() => { if (individualResults.length > 1) setIndividualResults(individualResults.filter((_, i) => i !== idx)); }} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        {hasFunding && (
                          <div className="flex gap-2 items-center sm:pl-[72px]">
                            <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 상금:</span>
                            <input type="number" placeholder="비율(%)" value={r.fundingRatio || ""} onChange={(e) => {
                              const val = e.target.value;
                              const n = [...individualResults];
                              n[idx].fundingRatio = val;
                              n[idx].fundingAmount = val && totalFunding ? Math.floor((Number(totalFunding) * Number(val)) / 100) : "";
                              setIndividualResults(n);
                            }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                            <span className="text-gray-500 text-xs font-bold">% ➔</span>
                            <input type="number" placeholder="별풍선(직접수정 가능)" value={r.fundingAmount || ""} onChange={(e) => {
                              const n = [...individualResults];
                              n[idx].fundingAmount = e.target.value;
                              n[idx].fundingRatio = "";
                              setIndividualResults(n);
                            }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                            <span className="text-gray-500 text-xs font-bold mr-8">개</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setIndividualResults([...individualResults, { playerName: "", rank: individualResults.length + 1, scoreChange: 0, fundingRatio: "", fundingAmount: "" }]) } className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition">참가자 추가</button>
                  </div>
                )}

                {matchMode === "team" && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-indigo-400 mb-2">팀 단위로 순위와 점수를 한 번만 입력하고, 팀원 이름을 추가하세요.</p>
                    {teamResults.map((team, tIdx) => (
                      <div key={team.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden flex flex-col">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 mb-1">순위</span>
                            <input type="number" value={team.rank} onChange={(e) => { const n = [...teamResults]; n[tIdx].rank = Number(e.target.value); setTeamResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 mb-1">세트 승수</span>
                            <input type="number" min="0" value={team.setWins} onChange={(e) => { const n = [...teamResults]; n[tIdx].setWins = e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0); setTeamResults(n); }} placeholder="예: 7" className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600 py-1" />
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="text-[10px] text-gray-500 mb-1">팀 전체 획득/감소 점수</span>
                            <input type="number" value={team.scoreChange} onChange={(e) => { const n = [...teamResults]; n[tIdx].scoreChange = Number(e.target.value); setTeamResults(n); }} placeholder="점수" className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1" />
                          </div>
                          <div className="flex flex-col justify-end">
                            <button type="button" onClick={() => { if (teamResults.length > 2) setTeamResults(teamResults.filter((_, i) => i !== tIdx)); }} className="p-2 text-gray-500 hover:text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                        {hasFunding && (
                          <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 mb-2">
                            <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 팀상금:</span>
                            <input type="number" placeholder="비율(%)" value={team.fundingRatio || ""} onChange={(e) => {
                              const val = e.target.value;
                              const n = [...teamResults];
                              n[tIdx].fundingRatio = val;
                              n[tIdx].fundingAmount = val && totalFunding ? Math.floor((Number(totalFunding) * Number(val)) / 100) : "";
                              setTeamResults(n);
                            }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                            <span className="text-gray-500 text-xs font-bold">% ➔</span>
                            <input type="number" placeholder="팀에 분배될 별풍선(수동수정 가능)" value={team.fundingAmount || ""} onChange={(e) => {
                              const n = [...teamResults];
                              n[tIdx].fundingAmount = e.target.value;
                              n[tIdx].fundingRatio = "";
                              setTeamResults(n);
                            }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                            <span className="text-gray-500 text-xs font-bold">개</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {team.players.map((pName, pIdx) => (
                            <div key={pIdx} className="flex gap-1">
                              <input type="text" value={pName} onChange={(e) => { const n = [...teamResults]; n[tIdx].players[pIdx] = e.target.value; setTeamResults(n); }} placeholder="팀원 이름" className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600" />
                              <button type="button" onClick={() => { if (team.players.length > 1) { const n = [...teamResults]; n[tIdx].players.splice(pIdx, 1); setTeamResults(n); } }} className="text-gray-500 hover:text-red-400 px-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => { const n = [...teamResults]; n[tIdx].players.push(""); setTeamResults(n); }} className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50">+ 팀원 추가</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setTeamResults([...teamResults, createEmptyTeamMatchResult(Date.now(), teamResults.length + 1, 0)])} className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm">새로운 팀 라인 추가</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={(e) => handleSubmitMatch(e, false)} disabled={isSubmitting} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg border border-gray-600">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "임시 저장"}
                  </button>
                  <button type="button" onClick={(e) => handleSubmitMatch(e, true)} disabled={isSubmitting} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "공개하기"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            [와우 설정] 탭 컨텐츠
            ========================================================= */}
        {adminInnerTab === "wow" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-b from-amber-900/20 to-gray-800 rounded-xl p-6 border border-amber-800/40 shadow-lg">
              <h2 className="text-xl font-bold text-amber-200 mb-2 flex items-center">
                <Users className="w-5 h-5 mr-2 text-amber-300" /> 고정 파티원 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6 break-keep">
                레이드 1번 파티 1번 슬롯에 고정할 길드원을 별도로 등록합니다. 이 목록은 WOW 길드 명단과는 분리되어 관리됩니다.
              </p>

              <form onSubmit={handleSaveFixedRaidMember} className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" value={fixedRaidMemberForm.streamerName} onChange={(e) => setFixedRaidMemberForm((prev) => ({ ...prev, streamerName: e.target.value }))} placeholder="이름" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-amber-500" required />
                  <input type="text" value={fixedRaidMemberForm.jobClass} onChange={(e) => handleFixedRaidMemberJobClassChange(e.target.value)} placeholder="직업" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-amber-500" required />
                  <input type="number" value={fixedRaidMemberForm.level} onChange={(e) => setFixedRaidMemberForm((prev) => ({ ...prev, level: e.target.value }))} placeholder="레벨" min="1" max="70" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-amber-500" required />
                  <input type="text" value={fixedRaidMemberForm.imageUrl} onChange={(e) => setFixedRaidMemberForm((prev) => ({ ...prev, imageUrl: e.target.value }))} placeholder="프로필 이미지 주소" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-amber-500" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-black text-gray-400">특성</div>
                  {getWowSpecOptions(fixedRaidMemberForm.jobClass).length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {getWowSpecOptions(fixedRaidMemberForm.jobClass).map((spec) => {
                          const isSelected = fixedRaidMemberForm.availableSpecs.includes(spec);
                          return (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => handleToggleFixedRaidMemberAvailableSpec(spec)}
                              className={`px-3 py-1 rounded-full text-xs font-black border transition ${isSelected ? 'border-slate-300/40 bg-slate-700/70 text-slate-50' : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500'}`}
                            >
                              {spec}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] font-black text-gray-500">주 특성</span>
                        {fixedRaidMemberForm.availableSpecs.length > 0 ? fixedRaidMemberForm.availableSpecs.map((spec) => {
                          const isActive = fixedRaidMemberForm.mainSpec === spec;
                          return (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => handleSelectFixedRaidMemberMainSpec(spec)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-black border transition ${isActive ? wowSpecTagClass : (isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500')}`}
                            >
                              {spec}
                            </button>
                          );
                        }) : <span className="text-xs text-gray-500">가능 특성을 먼저 선택하세요.</span>}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">직업을 입력하면 해당 직업의 특성을 선택할 수 있습니다.</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 mb-2">선호 포지션</div>
                  <div className="flex flex-wrap gap-2">
                    {WOW_POSITION_OPTIONS.filter((option) => option.id !== '전체').map((option) => {
                      const isSelected = fixedRaidMemberForm.preferredPositions.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleToggleFixedRaidMemberPreferredPosition(option.id)}
                          className={`px-3 py-1 rounded-full text-xs font-black border transition ${
                            isSelected
                              ? getWowPositionFilterButtonClasses(option.id, true, isLightTheme)
                              : getWowPositionFilterButtonClasses(option.id, false, isLightTheme)
                          }`}
                        >
                          {option.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={resetFixedRaidMemberForm} className="px-4 py-2 rounded-lg font-bold text-sm transition bg-gray-700 hover:bg-gray-600 text-white border border-gray-500">초기화</button>
                  <button type="submit" disabled={isFixedRaidMemberSaving} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${isFixedRaidMemberSaving ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}>
                    {isFixedRaidMemberSaving ? '저장 중...' : '고정 길드원 등록'}
                  </button>
                </div>
              </form>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {sortedFixedRaidMembers.length > 0 ? sortedFixedRaidMembers.map((member) => (
                  <div key={member.id} className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-lg ${isLightTheme ? "bg-slate-50 border border-slate-200" : "bg-gray-900 border border-gray-700"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getWowAvatarSrc(member)}
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }}
                        alt={member.streamerName}
                        className="w-11 h-11 rounded-full bg-gray-800 object-cover border border-gray-600"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-white truncate">{member.streamerName}</p>
                          {raidPublicSettings.activeFixedRaidMemberOptionId === member.id && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-200 border border-amber-400/30">레이드 적용중</span>}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{member.jobClass} · Lv.{member.level}</p>
                        <div className="flex flex-wrap gap-1 mt-1 items-center">
                          {member.mainSpec && (
                            <span title={getWowSpecTagTitle(member.jobClass, member.mainSpec, member.availableSpecs)} className={`inline-flex items-center px-1.75 py-0.5 rounded-md text-[10px] font-black border whitespace-nowrap ${wowSpecTagClass}`}>{member.mainSpec}</span>
                          )}
                          {normalizePreferredPositions(member.preferredPositions).map((positionId) => (
                            <span key={positionId} className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border whitespace-nowrap ${getWowPositionTagClasses(positionId, isLightTheme)}`}>{getWowPositionShortLabel(positionId)}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleApplyFixedRaidMemberGlobally(member.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition border bg-amber-500/10 text-amber-200 border-amber-400/30 hover:bg-amber-500/20">레이드에 적용</button>
                      <button onClick={() => handleDeleteFixedRaidMember(member.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition border bg-gray-700 text-gray-200 border-gray-600 hover:bg-red-600 hover:border-red-500 hover:text-white">삭제</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-6">등록된 고정 길드원이 아직 없습니다.</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-b from-blue-900/20 to-gray-800 rounded-xl p-6 border border-blue-800/40 shadow-lg">
              <h2 className="text-xl font-bold text-blue-300 mb-2 flex items-center">
                <Shield className="w-5 h-5 mr-2" /> WOW 왁타버스 길드 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                와우 서버에서 플레이 중인 버튜버 캐릭터를 등록하고, 방송을 보며 실시간으로 레벨을 갱신해주세요.
              </p>

              <form onSubmit={handleAddWowMember} className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" value={wowStreamerName} onChange={e=>setWowStreamerName(e.target.value)} placeholder="스트리머명 (예: 단답벌레)" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
                  <input type="text" value={wowNickname} onChange={e=>setWowNickname(e.target.value)} placeholder="와우 닉네임" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
                  <input type="text" value={wowJobClass} onChange={e=>handleWowJobClassChange(e.target.value)} placeholder="직업 (예: 전사)" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
                  <div className="flex gap-2">
                    <input type="number" value={wowLevel} onChange={e=>setWowLevel(e.target.value)} placeholder="레벨" min="1" max="70" className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-blue-500" required />
                    <button type="submit" disabled={isWowSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded font-bold transition whitespace-nowrap">
                      {isWowSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "등록"}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-black text-gray-400">특성</div>
                  {getWowSpecOptions(wowJobClass).length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {getWowSpecOptions(wowJobClass).map((spec) => {
                          const isSelected = wowAvailableSpecsSelection.includes(spec);
                          return (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => handleToggleWowFormAvailableSpec(spec)}
                              className={`px-3 py-1 rounded-full text-xs font-black border transition ${isSelected ? 'border-slate-300/40 bg-slate-700/70 text-slate-50' : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500'}`}
                            >
                              {spec}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] font-black text-gray-500">주 특성</span>
                        {wowAvailableSpecsSelection.length > 0 ? wowAvailableSpecsSelection.map((spec) => {
                          const isActive = wowMainSpec === spec;
                          return (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => handleSelectWowMainSpecLocal(spec)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-black border transition ${isActive ? wowSpecTagClass : (isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500')}`}
                            >
                              {spec}
                            </button>
                          );
                        }) : <span className="text-xs text-gray-500">가능 특성을 먼저 선택하세요.</span>}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">직업을 입력하면 해당 직업의 특성을 선택할 수 있습니다.</div>
                  )}
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
                  .filter(member => 
                    member.streamerName.toLowerCase().includes(wowAdminSearchTerm.toLowerCase()) ||
                    member.wowNickname.toLowerCase().includes(wowAdminSearchTerm.toLowerCase()) ||
                    member.jobClass.toLowerCase().includes(wowAdminSearchTerm.toLowerCase()) ||
                    normalizeAvailableSpecs(member.jobClass, member.availableSpecs).some((spec) => spec.toLowerCase().includes(wowAdminSearchTerm.toLowerCase()))
                  )
                  .sort((a,b) => {
                    if (wowAdminSortOption === 'levelDesc') return b.level - a.level;
                    if (wowAdminSortOption === 'levelAsc') return a.level - b.level;
                    if (wowAdminSortOption === 'nameAsc') return a.streamerName.localeCompare(b.streamerName);
                    return 0;
                  })
                  .map(member => {
                    const wowPartnerGeneration = normalizeWowPartnerGeneration(member.wowPartnerGeneration);
                    const hasWowPartnerStatus = isWowPartnerMember(member);
                    const wowPartnerLabel = getWowPartnerDisplayLabel(member);
                    const wowPartnerInputValue = Object.prototype.hasOwnProperty.call(wowPartnerGenerationInputs, member.id)
                      ? wowPartnerGenerationInputs[member.id]
                      : (wowPartnerGeneration ? String(wowPartnerGeneration) : "");

                    return (
                  <div key={member.id} className="flex justify-between items-center bg-gray-800 border border-gray-700 p-3 rounded-lg hover:border-blue-500/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center gap-0.5 w-fit">
                        <div className="relative w-10 h-10 flex-shrink-0">
                          {hasWowPartnerStatus ? (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[2px] shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                              <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt="avatar" className="w-full h-full rounded-full object-cover border-[1.5px] border-gray-900 bg-gray-900" />
                            </div>
                          ) : (
                            <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt="avatar" className="w-full h-full rounded-full bg-gray-900 object-cover border border-gray-600" />
                          )}
                          {hasWowPartnerStatus && (
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-full p-0.5 shadow-lg border border-yellow-500/50 z-10">
                              <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                        </div>
                        {hasWowPartnerStatus && (
                          <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-widest select-none whitespace-nowrap">
                            {wowPartnerLabel}
                          </span>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{member.streamerName}</span>
                          <span style={getJobBadgeStyle(member.jobClass, isLightTheme)} className="text-[10px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap">
                            {member.jobClass}
                          </span>
                        </div>
                        <div className="text-xs text-blue-400">{member.wowNickname}</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {member.mainSpec ? <span title={getWowSpecTagTitle(member.jobClass, member.mainSpec, member.availableSpecs)} className={`inline-flex items-center px-1.75 py-0.5 rounded-md text-[10px] font-black border whitespace-nowrap ${wowSpecTagClass}`}>{member.mainSpec}</span> : <span className="text-[10px] text-gray-500">특성 미설정</span>}
                          {normalizeAvailableSpecs(member.jobClass, member.availableSpecs).length > (member.mainSpec ? 1 : 0) && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black border whitespace-nowrap ${wowSpecExtraTagClass}`}>+{normalizeAvailableSpecs(member.jobClass, member.availableSpecs).length - (member.mainSpec ? 1 : 0)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-2 mr-2 min-w-[320px]">
                        <div className="flex flex-wrap items-center justify-end gap-1.5 w-full">
                          <span className="text-[10px] font-black text-yellow-400 whitespace-nowrap">와트너 대수</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={wowPartnerInputValue}
                            onChange={(e) => handleWowPartnerGenerationInputChange(member.id, e.target.value)}
                            placeholder="숫자"
                            className="w-16 bg-gray-900 border border-gray-600 text-white rounded px-2 py-1 text-xs text-center font-black focus:border-yellow-400 outline-none"
                          />
                          <span className="text-[10px] font-black text-gray-500 whitespace-nowrap">대</span>
                          <button
                            onClick={() => handleSaveWowPartnerGeneration(member.id)}
                            className="px-3 py-1.5 rounded text-[11px] font-bold transition flex items-center justify-center border bg-yellow-900/50 text-yellow-400 border-yellow-500/50 hover:bg-yellow-800"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => handleClearWowPartnerGeneration(member.id)}
                            className="px-3 py-1.5 rounded text-[11px] font-bold transition flex items-center justify-center border bg-gray-700 text-gray-300 border-gray-600 hover:bg-red-600 hover:border-red-500 hover:text-white"
                          >
                            해제
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                          onClick={() => handleToggleWowApply(member.id, member.isApplied)}
                          disabled={Number(member.level) < 40}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-center border ${
                            Number(member.level) < 40
                              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                              : member.isApplied 
                                ? 'bg-green-900/50 text-green-400 border-green-500/50 hover:bg-green-800' 
                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-white'
                          }`}
                        >
                          {member.isApplied ? '✅ 버종리 신청 ON' : '📝 버종리 신청 OFF'}
                        </button>
                        <button
                          onClick={() => handleToggleRaidApply(member.id, member.isRaidApplied, member.level)}
                          disabled={Number(member.level) < 50}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-center border ${
                            Number(member.level) < 50
                              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                              : member.isRaidApplied
                                ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50 hover:bg-cyan-800'
                                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-white'
                          }`}
                        >
                          {member.isRaidApplied ? '⚔️ 레이드 신청 ON' : '⚔️ 레이드 신청 OFF'}
                        </button>
                        </div>
                        <div className="flex items-center gap-1.5 w-full justify-end">
                          {WOW_POSITION_OPTIONS.filter((option) => option.id !== '전체').map((option) => {
                            const isSelected = normalizePreferredPositions(member.preferredPositions).includes(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleToggleWowPreferredPosition(member.id, option.id, member.preferredPositions)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-black border transition ${
                                  getWowPositionFilterButtonClasses(option.id, isSelected, isLightTheme)
                                }`}
                              >
                                {option.shortLabel}
                              </button>
                            );
                          })}
                        </div>
                        <div className="w-full space-y-1.5">
                          <div className="text-[10px] font-black text-gray-500 text-right">특성 설정</div>
                          {getWowSpecOptions(member.jobClass).length > 0 ? (
                            <>
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                {getWowSpecOptions(member.jobClass).map((spec) => {
                                  const isSelected = normalizeAvailableSpecs(member.jobClass, member.availableSpecs).includes(spec);
                                  return (
                                    <button
                                      key={spec}
                                      type="button"
                                      onClick={() => handleToggleWowAvailableSpec(member.id, spec, member.jobClass, member.availableSpecs, member.mainSpec)}
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-black border transition ${isSelected ? wowSpecTagClass : (isLightTheme ? "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300" : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500')}`}
                                    >
                                      {spec}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                {normalizeAvailableSpecs(member.jobClass, member.availableSpecs).length > 0 ? normalizeAvailableSpecs(member.jobClass, member.availableSpecs).map((spec) => {
                                  const isActive = member.mainSpec === spec;
                                  return (
                                    <button
                                      key={spec}
                                      type="button"
                                      onClick={() => handleSelectWowMainSpec(member.id, spec, member.jobClass, member.availableSpecs)}
                                      className={`px-2 py-1 rounded-full text-[10px] font-black border transition ${isActive ? 'border-slate-200/60 bg-slate-100 text-slate-950' : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-500'}`}
                                    >
                                      주 특성 {spec}
                                    </button>
                                  );
                                }) : <span className="text-[10px] text-gray-500">가능 특성을 선택하세요.</span>}
                              </div>
                            </>
                          ) : (
                            <div className="text-[10px] text-gray-500 text-right">직업 입력 후 특성 선택 가능</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
                        <button onClick={() => handleUpdateWowLevel(member.id, member.level - 1)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"><Minus className="w-4 h-4"/></button>
                        <span className="w-12 text-center font-black text-yellow-400">Lv {member.level}</span>
                        <button onClick={() => handleUpdateWowLevel(member.id, member.level + 1)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"><Plus className="w-4 h-4"/></button>
                      </div>
                      <button onClick={() => handleDeleteWowMember(member.id)} className="text-gray-500 hover:text-red-400 transition p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )})}
                {wowRoster.length === 0 && <p className="text-center text-gray-500 py-6">검색된 길드원이 없습니다.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-b from-violet-900/20 to-gray-800 rounded-xl p-6 border border-violet-800/40 shadow-lg">
              <h2 className="text-xl font-bold text-violet-200 mb-2 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-violet-300" /> WOW 레이드 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6 break-keep">
                WOW레이드 탭에 공개할 레이드 기록을 생성하고, 참가자와 통계 데이터를 수동으로 입력합니다. 참가자는 WOW 길드원 명단, 고정 길드원 목록, 일반인 참가자 추가하기를 통해 구성할 수 있습니다.
              </p>

              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <input type="text" value={wowRaidForm.raidName} onChange={(e) => handleWowRaidFormFieldChange('raidName', e.target.value)} placeholder="레이드 이름" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none" />
                  <input type="date" value={wowRaidForm.raidDate} onChange={(e) => handleWowRaidFormFieldChange('raidDate', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none" />
                  <input type="text" value={wowRaidForm.clearTime} onChange={(e) => handleWowRaidFormFieldChange('clearTime', e.target.value)} placeholder="토벌시간 (예: 14분 22초)" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none" />
                  <div className="flex items-center rounded border border-gray-600 bg-gray-800 overflow-hidden">
                    <input type="number" min="1" step="1" value={wowRaidForm.raidGroupNumber} onChange={(e) => handleWowRaidFormFieldChange('raidGroupNumber', e.target.value.replace(/[^0-9]/g, ''))} placeholder="1" className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none" />
                    <span className="px-3 text-sm font-black text-violet-200 border-l border-gray-600 bg-gray-900/60">군</span>
                  </div>
                  <input type="text" value={wowRaidForm.imageUrl} onChange={(e) => handleWowRaidFormFieldChange('imageUrl', e.target.value)} placeholder="레이드 이미지 주소" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none md:col-span-2 xl:col-span-3" />
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={wowRaidForm.isCleared} onChange={(e) => handleWowRaidFormFieldChange('isCleared', e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500" />
                      클리어 완료
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={wowRaidForm.isPublished} onChange={(e) => handleWowRaidFormFieldChange('isPublished', e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500" />
                      WOW레이드 탭에 공개
                    </label>
                  </div>
                </div>
                <textarea value={wowRaidForm.note} onChange={(e) => handleWowRaidFormFieldChange('note', e.target.value)} rows={3} placeholder="레이드 메모 또는 간단한 설명" className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none resize-y" />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className={`rounded-xl border p-4 ${isLightTheme ? "bg-white border-slate-200 shadow-sm" : "bg-gray-800/70 border-gray-700"}`}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className={`text-sm font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>WOW 길드원 참가자 선택</h3>
                      <span className={`text-xs ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>{wowRaidForm.rosterParticipantIds.length}명 선택</span>
                    </div>
                    <div className="relative mb-3">
                      <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLightTheme ? "text-slate-400" : "text-gray-400"}`} />
                      <input
                        type="text"
                        value={wowRaidRosterSearchInput}
                        onChange={(e) => setWowRaidRosterSearchInput(e.target.value)}
                        placeholder="참가자 검색 (이름, 닉네임, 직업, 특성)"
                        className={`w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none ${isLightTheme ? "bg-white border border-slate-300 text-slate-900 focus:border-violet-500 shadow-sm" : "bg-gray-900/80 border border-gray-600 text-white focus:border-violet-500"}`}
                      />
                    </div>
                    <div className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      {filteredWowRaidRosterCandidates.length > 0 ? filteredWowRaidRosterCandidates
                        .map((member) => {
                          const isSelected = wowRaidForm.rosterParticipantIds.includes(member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleToggleWowRaidParticipant('wow_roster', member.id)}
                              className={`w-full text-left rounded-lg border px-3 py-2 transition ${isSelected ? (isLightTheme ? 'border-violet-200 bg-violet-50 text-slate-900' : 'border-violet-400/50 bg-violet-500/10 text-white') : (isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900' : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:border-gray-500 hover:text-white')}`}
                            >
                              <div className="flex items-center gap-3">
                                <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt={member.streamerName} className={`w-9 h-9 rounded-full object-cover flex-shrink-0 ${isLightTheme ? "bg-slate-100 border border-slate-200" : "bg-gray-900 border border-gray-600"}`} />
                                <div className="min-w-0">
                                  <div className="font-bold truncate">{member.streamerName}</div>
                                  <div className={`text-[11px] truncate ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>{member.wowNickname} · {member.jobClass}</div>
                                </div>
                              </div>
                            </button>
                          );
                        }) : <div className="text-sm text-gray-500 text-center py-8">검색 결과가 없거나 등록된 WOW 길드원이 없습니다.</div>}
                    </div>
                  </div>

                  <div className={`rounded-xl border p-4 ${isLightTheme ? "bg-white border-slate-200 shadow-sm" : "bg-gray-800/70 border-gray-700"}`}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className={`text-sm font-black ${isLightTheme ? "text-slate-900" : "text-white"}`}>고정 길드원 포함</h3>
                      <span className={`text-xs ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>{wowRaidForm.fixedParticipantIds.length}명 선택</span>
                    </div>
                    <div className="max-h-[260px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      <div className="relative mb-3">
                        <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLightTheme ? "text-slate-400" : "text-gray-400"}`} />
                        <input
                          type="text"
                          value={wowRaidFixedSearchInput}
                          onChange={(e) => setWowRaidFixedSearchInput(e.target.value)}
                          placeholder="고정 길드원 검색 (이름, 닉네임, 직업, 특성)"
                          className={`w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none ${isLightTheme ? "bg-white border border-slate-300 text-slate-900 focus:border-amber-500 shadow-sm" : "bg-gray-900/80 border border-gray-600 text-white focus:border-amber-500"}`}
                        />
                      </div>
                      {filteredWowRaidFixedCandidates.length > 0 ? filteredWowRaidFixedCandidates.map((member) => {
                        const isSelected = wowRaidForm.fixedParticipantIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => handleToggleWowRaidParticipant('fixed_member', member.id)}
                            className={`w-full text-left rounded-lg border px-3 py-2 transition ${isSelected ? (isLightTheme ? 'border-amber-200 bg-amber-50 text-slate-900' : 'border-amber-400/50 bg-amber-500/10 text-white') : (isLightTheme ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900' : 'border-gray-700 bg-gray-900/70 text-gray-300 hover:border-gray-500 hover:text-white')}`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={getWowAvatarSrc(member)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} alt={member.streamerName} className={`w-9 h-9 rounded-full object-cover flex-shrink-0 ${isLightTheme ? "bg-slate-100 border border-slate-200" : "bg-gray-900 border border-gray-600"}`} />
                              <div className="min-w-0">
                                <div className="font-bold truncate">{member.streamerName}</div>
                                <div className={`text-[11px] truncate ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>{member.wowNickname || member.streamerName} · {member.jobClass}</div>
                              </div>
                            </div>
                          </button>
                        );
                      }) : <div className="text-sm text-gray-500 text-center py-8">검색 결과가 없거나 등록된 고정 길드원이 없습니다.</div>}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl border p-4 space-y-4 ${isLightTheme ? "bg-white border-slate-200 shadow-sm" : "bg-gray-800/70 border-gray-700"}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-sm font-black text-white">일반인 참가자 추가하기</h3>
                      <p className="text-xs text-gray-400 mt-1">WOW 길드원 명단과 별개로 레이드에만 포함되는 참가자를 추가합니다.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddWowRaidGuestParticipant}
                      className="px-3 py-1.5 rounded-lg text-xs font-black border border-emerald-400/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 transition"
                    >
                      + 일반인 참가자 추가
                    </button>
                  </div>
                  <div className="relative">
                    <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLightTheme ? "text-slate-400" : "text-gray-400"}`} />
                    <input
                      type="text"
                      value={wowRaidGuestSearchInput}
                      onChange={(e) => setWowRaidGuestSearchInput(e.target.value)}
                      placeholder="일반 참가자 검색 (이름, 닉네임, 직업, 특성)"
                      className={`w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none ${isLightTheme ? "bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 shadow-sm" : "bg-gray-900/80 border border-gray-600 text-white focus:border-emerald-500"}`}
                    />
                  </div>
                  {filteredWowRaidGuestParticipants.length > 0 ? (
                    <div className="space-y-3">
                      {filteredWowRaidGuestParticipants.map((guest) => {
                        const guestSpecOptions = getWowSpecOptions(guest.jobClass);
                        return (
                          <div key={guest.id} className="rounded-xl border border-gray-700 bg-gray-900/70 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-black text-white">일반 참가자 정보</div>
                                <div className="text-xs text-gray-400">이름과 닉네임, 직업/특성을 입력하면 통계 입력 대상에도 자동 포함됩니다.</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveWowRaidGuestParticipant(guest.id)}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-black border border-red-500/35 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition"
                              >
                                삭제
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              <input type="text" value={guest.displayName} onChange={(e) => handleWowRaidGuestFieldChange(guest.id, 'displayName', e.target.value)} placeholder="이름 입력" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none" />
                              <input type="text" value={guest.wowNickname} onChange={(e) => handleWowRaidGuestFieldChange(guest.id, 'wowNickname', e.target.value)} placeholder="와우 닉네임 입력" className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none" />
                              <select value={guest.jobClass} onChange={(e) => handleWowRaidGuestFieldChange(guest.id, 'jobClass', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                                <option value="">직업 선택</option>
                                {WOW_JOB_OPTIONS.map((jobClass) => <option key={jobClass} value={jobClass}>{jobClass}</option>)}
                              </select>
                              <select value={guest.mainSpec} onChange={(e) => handleWowRaidGuestFieldChange(guest.id, 'mainSpec', e.target.value)} disabled={!guest.jobClass} className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none disabled:opacity-50">
                                <option value="">특성 선택</option>
                                {guestSpecOptions.map((specId) => <option key={specId} value={specId}>{specId}</option>)}
                              </select>
                              <select value={normalizePreferredPositions(guest.preferredPositions)[0] || ''} onChange={(e) => handleWowRaidGuestFieldChange(guest.id, 'preferredPositions', e.target.value ? [e.target.value] : [])} className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none">
                                <option value="">선호 포지션 선택</option>
                                {WOW_POSITION_OPTIONS.filter((option) => option.id !== '전체').map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                              </select>
                            </div>
                            <div className="space-y-3 rounded-xl border border-gray-700 bg-gray-950/40 p-3">
                              <div className="flex items-center gap-4 flex-wrap">
                                <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-200">
                                  <input type="radio" checked={guest.imageMode !== 'custom'} onChange={() => handleWowRaidGuestFieldChange(guest.id, 'imageMode', 'default')} className="text-emerald-500 focus:ring-emerald-500" />
                                  기본 이미지
                                </label>
                                <label className="inline-flex items-center gap-2 text-sm font-bold text-gray-200">
                                  <input type="radio" checked={guest.imageMode === 'custom'} onChange={() => handleWowRaidGuestFieldChange(guest.id, 'imageMode', 'custom')} className="text-emerald-500 focus:ring-emerald-500" />
                                  이미지 주소 입력
                                </label>
                              </div>
                              {guest.imageMode === 'custom' ? (
                                <input type="text" value={guest.imageUrl} onChange={(e) => handleWowRaidGuestFieldChange(guest.id, 'imageUrl', e.target.value)} placeholder="이미지 주소 입력" className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none" />
                              ) : null}
                              <div className="flex items-center gap-3">
                                <img src={guest.imageMode === 'custom' && guest.imageUrl ? guest.imageUrl : getDefaultWowRaidGuestAvatar(guest)} onError={(e) => { e.target.src = getDefaultWowRaidGuestAvatar(guest); }} alt={guest.displayName || '일반 참가자'} className="w-12 h-12 rounded-full object-cover border border-gray-600 bg-gray-900" />
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-white truncate">{guest.displayName || '이름 미입력'}</div>
                                  <div className="text-xs text-gray-400 truncate">{guest.wowNickname || '와우 닉네임 미입력'}{guest.jobClass ? ` · ${guest.jobClass}` : ''}{guest.mainSpec ? ` · ${guest.mainSpec}` : ''}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-6">추가된 일반 참가자가 없습니다.</div>
                  )}
                </div>

                <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <h3 className="text-sm font-black text-white">레이드 참가자 미리보기</h3>
                    <span className="text-xs text-gray-400">총 {wowRaidFormParticipants.length}명</span>
                  </div>
                  {wowRaidFormParticipants.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {wowRaidFormParticipants.map((participant) => (
                        <div key={participant.id} className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-900/70">
                          <img src={getWowAvatarSrc(participant)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${participant.displayName || participant.streamerName}`; }} alt={participant.streamerName} className="w-7 h-7 rounded-full object-cover bg-gray-900 border border-gray-600" />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate">{participant.displayName || participant.streamerName}</div>
                            <div className="text-[10px] text-gray-400 truncate">{participant.jobClass}{participant.mainSpec ? ` · ${participant.mainSpec}` : ''}{participant.sourceType === 'guest' ? ' · 일반 참가자' : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-6">참가자를 선택하면 이곳에 미리보기가 표시됩니다.</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {WOW_RAID_STAT_FIELDS.map((field) => {
                      const isActive = wowRaidAdminStatTab === field.id;
                      return (
                        <button key={field.id} type="button" onClick={() => setWowRaidAdminStatTab(field.id)} className={`px-3 py-1.5 rounded-lg text-xs font-black border transition ${isActive ? 'bg-violet-600 text-white border-violet-400' : 'bg-gray-900/70 text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
                          {field.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4">
                    <div className="text-sm font-black text-white mb-3">{WOW_RAID_STAT_FIELDS.find((field) => field.id === wowRaidAdminStatTab)?.label} 입력</div>
                    <input
                      type="text"
                      value={wowRaidStatSearchInput}
                      onChange={(e) => setWowRaidStatSearchInput(e.target.value)}
                      placeholder="통계 입력 대상 검색 (이름, 닉네임, 직업, 특성)"
                      className="w-full mb-3 bg-gray-900/80 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none"
                    />
                    {wowRaidFormParticipants.length > 0 ? (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredWowRaidStatParticipants.map((participant) => (
                          <div key={participant.id} className="grid grid-cols-[minmax(0,1fr)_140px] gap-3 items-center bg-gray-900/70 border border-gray-700 rounded-lg p-2.5">
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{participant.streamerName}</div>
                              <div className="text-[11px] text-gray-400 truncate">{participant.wowNickname} · {participant.jobClass}{participant.mainSpec ? ` · ${participant.mainSpec}` : ''}</div>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={wowRaidForm.stats?.[wowRaidAdminStatTab]?.[participant.id] ?? ''}
                              onChange={(e) => handleWowRaidStatValueChange(wowRaidAdminStatTab, participant.id, e.target.value)}
                              placeholder="0"
                              className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-violet-500 outline-none text-right"
                            />
                          </div>
                        ))}
                        {filteredWowRaidStatParticipants.length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-6">검색 결과가 없습니다.</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-6">참가자를 먼저 선택해주세요.</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={resetWowRaidForm} className={`px-4 py-2 rounded-lg font-bold text-sm transition border ${isLightTheme ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm" : "bg-gray-700 hover:bg-gray-600 text-white border-gray-500"}`}>입력 초기화</button>
                  <button type="button" onClick={handleSaveWowRaid} disabled={isWowRaidSaving} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${isWowRaidSaving ? (isLightTheme ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200" : 'bg-gray-700 text-gray-400 cursor-not-allowed') : (isLightTheme ? "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_14px_30px_rgba(126,34,206,0.18)]" : 'bg-violet-600 hover:bg-violet-500 text-white')}`}>
                    {isWowRaidSaving ? '저장 중...' : wowRaidForm.id ? '레이드 수정 저장' : '레이드 생성'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className={`text-base font-black ${adminTheme.heading}`}>등록된 WOW 레이드 기록</h3>
                  <span className={`text-xs ${adminTheme.mutedText}`}>총 {wowRaids.length}개</span>
                </div>
                {wowRaids.length > 0 ? wowRaids.map((raid) => (
                  <div key={raid.id} className={`rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${isLightTheme ? "bg-slate-50 border border-slate-200" : "bg-gray-900 border border-gray-700"}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className={`font-black text-lg break-keep ${adminTheme.heading}`}>{raid.raidName}</p>
                        {raid.raidGroupNumber ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-100 border border-amber-400/30">{raid.raidGroupNumber}군</span> : null}
                        {raid.isPublished ? <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">공개중</span> : <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${isLightTheme ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-gray-700 text-gray-200 border-gray-600"}`}>비공개</span>}
                      </div>
                      <p className="text-sm text-gray-400">{raid.raidDate || '-'} · 토벌시간 {raid.clearTime || '-'} · 참가자 {raid.participants.length}명</p>
                      {raid.note && <p className="text-xs text-gray-500 mt-1 break-keep">{raid.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => { setSelectedWowRaidId(raid.id); setWowRaidDetailTab('participants'); navigateTo('wowraid'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isLightTheme ? "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" : "bg-violet-500/10 text-violet-200 border-violet-400/30 hover:bg-violet-500/20"}`}>상세 보기</button>
                      <button type="button" onClick={() => handleEditWowRaid(raid)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isLightTheme ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm" : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600"}`}>수정</button>
                      <button type="button" onClick={() => handleDeleteWowRaid(raid.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${isLightTheme ? "bg-white text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 shadow-sm" : "bg-gray-700 text-gray-200 border-gray-600 hover:bg-red-600 hover:border-red-500 hover:text-white"}`}>삭제</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-6">등록된 WOW 레이드 기록이 없습니다.</p>
                )}
              </div>
            </div>


            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                <div>
                  <h2 className={`text-xl font-bold mb-2 flex items-center ${adminTheme.heading}`}>
                    <Trophy className={`w-5 h-5 mr-2 ${isLightTheme ? "text-amber-600" : "text-amber-300"}`} /> 던전 티어게임 관리
                  </h2>
                  <p className={`text-sm leading-6 break-keep ${adminTheme.mutedText}`}>
                    던전 티어게임 탭에서 사용할 카드를 등록합니다. 1차 작업에서는 던전 데이터 등록과 목록 관리를 먼저 완성하고, 다음 단계에서 드래그 배치형 티어 보드에 연결합니다.
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${isLightTheme ? "border-slate-200 bg-slate-100 text-slate-700" : "border-gray-600 bg-gray-900 text-gray-200"}`}>
                  총 {wowDungeonTierItems.length}개 등록
                </span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6">
                <div className={`rounded-2xl border p-4 space-y-4 ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-gray-900 border-gray-700"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-bold mb-2 ${adminTheme.heading}`}>던전 이름</label>
                      <input
                        type="text"
                        value={wowDungeonTierForm.name}
                        onChange={(e) => handleWowDungeonTierFormFieldChange("name", e.target.value)}
                        placeholder="예: 화산 심장부"
                        className={adminTheme.input}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-bold mb-2 ${adminTheme.heading}`}>종류</label>
                      <select
                        value={wowDungeonTierForm.expansionType}
                        onChange={(e) => handleWowDungeonTierFormFieldChange("expansionType", e.target.value)}
                        className={adminTheme.input}
                      >
                        {WOW_DUNGEON_EXPANSION_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className={`block text-sm font-bold ${adminTheme.heading}`}>영상 URL 목록</label>
                        <button
                          type="button"
                          onClick={handleAddWowDungeonTierVideoUrlField}
                          className={adminTheme.ghostButton}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          영상 추가
                        </button>
                      </div>
                      <p className={`mb-3 text-xs ${adminTheme.mutedText}`}>
                        입력한 순서대로 재생되고, 빈칸은 저장할 때 자동으로 제외됩니다.
                      </p>
                      <div className="space-y-2">
                        {((Array.isArray(wowDungeonTierForm.videoUrls) && wowDungeonTierForm.videoUrls.length > 0)
                          ? wowDungeonTierForm.videoUrls
                          : createWowDungeonTierFormVideoUrls()
                        ).map((videoUrl, index, videoUrls) => (
                          <div key={`wow-dungeon-video-url-${index}`} className="flex items-center gap-2">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${isLightTheme ? "border-slate-200 bg-white text-slate-500" : "border-gray-700 bg-gray-900 text-gray-300"}`}>
                              {index + 1}
                            </div>
                            <input
                              type="text"
                              value={videoUrl}
                              onChange={(e) => handleWowDungeonTierVideoUrlChange(index, e.target.value)}
                              placeholder="https://..."
                              className={`${adminTheme.input} min-w-0 flex-1`}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveWowDungeonTierVideoUrlField(index)}
                              disabled={videoUrls.length <= 1}
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
                                isLightTheme
                                  ? "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
                                  : "border-gray-700 bg-gray-900 text-gray-300 hover:border-red-500 hover:bg-red-500/10 hover:text-red-200 disabled:border-gray-800 disabled:bg-gray-900 disabled:text-gray-600"
                              }`}
                              title="영상 URL 삭제"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className={`block text-sm font-bold mb-2 ${adminTheme.heading}`}>대표 이미지 URL</label>
                      <input
                        type="text"
                        value={wowDungeonTierForm.imageUrl}
                        onChange={(e) => handleWowDungeonTierFormFieldChange("imageUrl", e.target.value)}
                        placeholder="https://..."
                        className={adminTheme.input}
                      />
                    </div>
                  </div>

                  <div className={`rounded-2xl border overflow-hidden ${getWowDungeonExpansionTheme(wowDungeonTierForm.expansionType, isLightTheme).cardClass}`}>
                    <div className={`aspect-[16/9] border-b overflow-hidden ${getWowDungeonExpansionTheme(wowDungeonTierForm.expansionType, isLightTheme).frameClass}`}>
                      {wowDungeonTierForm.imageUrl ? (
                        <img
                          src={wowDungeonTierForm.imageUrl}
                          alt={wowDungeonTierForm.name || "던전 미리보기"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-xl font-black ${getWowDungeonExpansionTheme(wowDungeonTierForm.expansionType, isLightTheme).metaClass}`}>
                          DUNGEON PREVIEW
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${getWowDungeonExpansionTheme(wowDungeonTierForm.expansionType, isLightTheme).badgeClass}`}>
                          {getWowDungeonExpansionMeta(wowDungeonTierForm.expansionType).label}
                        </span>
                        <span className={`text-xs font-semibold ${getWowDungeonExpansionTheme(wowDungeonTierForm.expansionType, isLightTheme).subtleClass}`}>
                          {wowDungeonTierFormNormalizedVideoUrls.length > 0 ? `영상 ${wowDungeonTierFormNormalizedVideoUrls.length}개` : "영상 링크 없음"}
                        </span>
                      </div>
                      <div className={`mt-3 text-lg font-black break-keep ${getWowDungeonExpansionTheme(wowDungeonTierForm.expansionType, isLightTheme).titleClass}`}>
                        {wowDungeonTierForm.name || "던전 이름 미리보기"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetWowDungeonTierForm}
                      className={adminTheme.neutralButton}
                    >
                      입력 초기화
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveWowDungeonTierItem}
                      disabled={isWowDungeonTierSaving}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                        isWowDungeonTierSaving
                          ? (isLightTheme
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed")
                          : (isLightTheme
                            ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_14px_30px_rgba(217,119,6,0.18)]"
                            : "bg-amber-500 hover:bg-amber-400 text-black")
                      }`}
                    >
                      {isWowDungeonTierSaving ? "저장 중..." : (wowDungeonTierForm.id ? "던전 카드 수정" : "던전 카드 등록")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className={`flex items-center justify-between gap-3 flex-wrap rounded-2xl border px-4 py-3 ${isLightTheme ? "border-slate-200 bg-slate-50" : "border-gray-700 bg-gray-900/40"}`}>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h3 className={`text-base font-black ${adminTheme.heading}`}>등록된 던전 카드</h3>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${isLightTheme ? "border-slate-200 bg-white text-slate-700 shadow-sm" : "border-gray-600 bg-gray-800 text-gray-100"}`}>
                        총 {wowDungeonTierItems.length}장
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${adminTheme.mutedText}`}>위아래 버튼으로 보관함 노출 순서를 조정</span>
                  </div>

                  {wowDungeonTierItems.length > 0 ? wowDungeonTierItems.map((item, index) => {
                    const expansionMeta = getWowDungeonExpansionMeta(item.expansionType);
                    const expansionTheme = getWowDungeonExpansionTheme(item.expansionType, isLightTheme);
                    const primaryVideoUrl = getWowDungeonTierPrimaryVideoUrl(item);
                    const videoCount = Array.isArray(item.videoUrls) ? item.videoUrls.length : 0;
                    const isFirstItem = index === 0;
                    const isLastItem = index === wowDungeonTierItems.length - 1;
                    const orderButtonClass = isLightTheme
                      ? "flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:bg-slate-50"
                      : "flex items-center justify-center rounded-lg border border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-500 disabled:bg-gray-900";
                    const compactActionButtonClass = isLightTheme
                      ? "h-8 rounded-lg border bg-white px-3 text-xs font-bold transition shadow-sm"
                      : "h-8 rounded-lg border px-3 text-xs font-bold transition";

                    return (
                      <div key={item.id} className={`rounded-2xl border p-2.5 grid grid-cols-[88px_minmax(0,1fr)] gap-3 items-center sm:grid-cols-[88px_minmax(0,1fr)_auto] ${expansionTheme.cardClass}`}>
                        <div className={`h-16 rounded-xl overflow-hidden border flex-shrink-0 ${expansionTheme.frameClass}`}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-[10px] font-black tracking-[0.18em] ${expansionTheme.metaClass}`}>
                              NO IMAGE
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`min-w-0 truncate font-black text-base break-keep ${expansionTheme.titleClass}`}>{item.name}</p>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${isLightTheme ? "border-slate-200 bg-white text-slate-700" : "border-gray-600 bg-gray-900 text-gray-100"}`}>
                              순서 {index + 1}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${expansionTheme.badgeClass}`}>
                              {expansionMeta.label}
                            </span>
                            {videoCount > 0 ? (
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${expansionTheme.buttonClass}`}>
                                <Tv className="w-3 h-3 mr-1" />
                                영상 {videoCount}개
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className={`text-xs ${expansionTheme.subtleClass}`}>
                              보관함 노출 순서 {index + 1}
                            </p>
                            {primaryVideoUrl ? (
                              <a
                                href={primaryVideoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 text-xs font-semibold ${expansionTheme.metaClass}`}
                              >
                                <Link2 className="w-3 h-3" />
                                첫 영상 열기
                              </a>
                            ) : (
                              <span className={`text-xs ${expansionTheme.subtleClass}`}>
                                영상 없음
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-1.5 sm:col-span-1 sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleMoveWowDungeonTierItemOrder(item.id, "up")}
                            disabled={isFirstItem}
                            className={`${orderButtonClass} h-8 w-8`}
                            title="위로 이동"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveWowDungeonTierItemOrder(item.id, "down")}
                            disabled={isLastItem}
                            className={`${orderButtonClass} h-8 w-8`}
                            title="아래로 이동"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditWowDungeonTierItem(item)}
                            className={`${compactActionButtonClass} ${isLightTheme ? "border-slate-200 text-slate-700 hover:bg-slate-50" : "border-gray-600 text-gray-200 hover:bg-gray-700"}`}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWowDungeonTierItem(item.id)}
                            className={`${compactActionButtonClass} ${isLightTheme ? "border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800" : "border-gray-600 text-gray-200 hover:bg-red-600 hover:border-red-500 hover:text-white"}`}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className={`rounded-2xl border border-dashed p-8 text-center ${isLightTheme ? "border-slate-200 bg-slate-50 text-slate-500" : "border-gray-700 bg-gray-900/50 text-gray-400"}`}>
                      아직 등록된 던전 카드가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ★ WOW 길드원 프로필 이미지 관리 ★ */}
            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-400" /> WOW 길드원 프로필 이미지 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 와우 캐릭터 혹은 버튜버 사진을 변경할 수 있습니다. <br/>(빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[...wowRoster].sort((a,b) => a.streamerName.localeCompare(b.streamerName)).map(member => (
                  <div key={member.id} className={adminTheme.rowCard}>
                    <div className="flex items-center gap-3 w-32 flex-shrink-0">
                      <img 
                        src={getWowAvatarSrc(member)} 
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.streamerName}`; }} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0" 
                      />
                      <span className={`font-bold w-16 truncate ${adminTheme.heading}`} title={member.streamerName}>{member.streamerName}</span>
                    </div>
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={wowImageInputs[member.id] !== undefined ? wowImageInputs[member.id] : (member.imageUrl || "")}
                        onChange={(e) => setWowImageInputs({...wowImageInputs, [member.id]: e.target.value})}
                        className={`flex-1 text-sm px-3 py-1.5 rounded border outline-none ${isLightTheme ? "bg-white text-slate-900 border-slate-300 focus:border-blue-500 shadow-sm" : "bg-gray-800 text-white border-gray-600 focus:border-blue-500"}`}
                      />
                      <button
                        onClick={() => handleUpdateWowImage(member.id, wowImageInputs[member.id])}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminInnerTab === "league" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-400" /> 종겜 리그 참가자 이미지 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                인터넷에 올라와 있는 이미지 주소(URL)를 복사하여 종겜 리그 참가자의 사진을 변경할 수 있습니다. <br/>(빈칸으로 저장하면 다시 기본 아바타로 돌아갑니다.)
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[...combinedLeaguePlayers].sort((a,b) => a.name.localeCompare(b.name)).map(player => (
                  <div key={player.id} className={adminTheme.rowCard}>
                    <div className="flex items-center gap-3 w-32 flex-shrink-0 relative group/player">
                      <img 
                        src={(imageInputs[player.id] !== undefined ? imageInputs[player.id] : (player.imageUrl || "")) || getAvatarSrc(player.name)} 
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${player.name}`; }} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full bg-gray-800 object-cover border border-gray-600 flex-shrink-0" 
                      />
                      <div className="flex flex-col">
                        <span className={`font-bold truncate w-16 ${adminTheme.heading}`} title={player.name}>{player.name}</span>
                        {player._source === "draft_players" && <span className="text-[10px] text-yellow-300 mt-0.5">임시 저장</span>}
                        {/* ★ 관리자 강제 삭제 버튼 추가 ★ */}
  {player._source !== "draft_players" && (
                        <button type="button" onClick={() => handleDeletePlayer(player.id, player.name)} className="text-[10px] text-red-400 hover:text-red-300 flex items-center mt-0.5 opacity-60 hover:opacity-100 transition w-max">
                          <Trash2 className="w-3 h-3 mr-0.5" /> 삭제
                        </button>
                      )}
                      </div>
                    </div>
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={imageInputs[player.id] !== undefined ? imageInputs[player.id] : (player.imageUrl || "")}
                        onChange={(e) => setImageInputs({...imageInputs, [player.id]: e.target.value})}
                        className={`flex-1 text-sm px-3 py-1.5 rounded border outline-none ${isLightTheme ? "bg-white text-slate-900 border-slate-300 focus:border-green-500 shadow-sm" : "bg-gray-800 text-white border-gray-600 focus:border-green-500"}`}
                      />
                      <button
                        onClick={() => handleUpdateLeagueParticipantImage(player, imageInputs[player.id])}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ))}
                {combinedLeaguePlayers.length === 0 && <p className="text-center text-gray-500 py-4">등록된 참가자가 없습니다.</p>}
              </div>
            </div>

            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Tv className="w-5 h-5 mr-2 text-indigo-400" /> 종겜 리그 참가자 방송국 주소 관리
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                스트리머의 실제 방송국 주소(유튜브, 치지직, SOOP 등)를 입력해주세요. <br/>(빈칸으로 두시면 선수의 이름으로 자동 검색하여 SOOP으로 연결됩니다.)
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[...combinedLeaguePlayers].sort((a,b) => a.name.localeCompare(b.name)).map(player => (
                  <div key={player.id} className={adminTheme.rowCard}>
                    <div className="flex flex-col justify-center w-28 flex-shrink-0">
                      <span className={`font-bold truncate ${adminTheme.heading}`} title={player.name}>{player.name}</span>
                      {player._source === "draft_players" && <span className="text-[10px] text-yellow-300 mt-0.5">임시 저장</span>}
                      {/* ★ 관리자 강제 삭제 버튼 추가 ★ */}
{player._source !== "draft_players" && (
                      <button type="button" onClick={() => handleDeletePlayer(player.id, player.name)} className="text-[10px] text-red-400 hover:text-red-300 flex items-center mt-0.5 opacity-60 hover:opacity-100 transition w-max">
                        <Trash2 className="w-3 h-3 mr-0.5" /> 삭제
                      </button>
                    )}
                    </div>
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={broadcastUrlInputs[player.id] !== undefined ? broadcastUrlInputs[player.id] : (player.broadcastUrl || "")}
                        onChange={(e) => setBroadcastUrlInputs({...broadcastUrlInputs, [player.id]: e.target.value})}
                        className={`flex-1 text-sm px-3 py-1.5 rounded border outline-none ${isLightTheme ? "bg-white text-slate-900 border-slate-300 focus:border-indigo-500 shadow-sm" : "bg-gray-800 text-white border-gray-600 focus:border-indigo-500"}`}
                      />
                      <button
                        onClick={() => handleUpdateLeagueParticipantBroadcastUrl(player, broadcastUrlInputs[player.id])}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ))}
                {combinedLeaguePlayers.length === 0 && <p className="text-center text-gray-500 py-4">등록된 참가자가 없습니다.</p>}
              </div>
            </div>

            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Swords className="w-5 h-5 mr-2 text-red-400" /> 등록된 경기 관리 (수정 및 삭제)
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                경기를 수정하거나 삭제하면 해당 경기로 증감된 참가자들의 점수가 자동으로 재계산/복구됩니다.
              </p>

              <div className="space-y-3">
                {matches.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">등록된 경기가 없습니다.</p>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className={`flex justify-between items-center p-3 rounded-lg ${isLightTheme ? "bg-slate-50 border border-slate-200" : "bg-gray-900 border border-gray-700"}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold ${adminTheme.heading}`}>{match.gameName}</span>
                        <span className={`text-xs ${adminTheme.mutedText}`}>{match.date}</span>
                        <span className={`text-[11px] font-black px-2 py-1 rounded border ${match.isPublished !== false ? (isLightTheme ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-green-900/30 text-green-300 border-green-700/50") : (isLightTheme ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-yellow-900/30 text-yellow-300 border-yellow-700/50")}`}>
                          {match.isPublished !== false ? "공개" : "임시 저장"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEditMatch(match)} className={`flex items-center text-sm px-3 py-1.5 rounded transition border ${isLightTheme ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white border-transparent"}`}>
                          <Edit className="w-4 h-4 mr-1" /> 수정
                        </button>
                        <button onClick={() => setMatchToDelete(match)} className={`flex items-center text-sm px-3 py-1.5 rounded transition border ${isLightTheme ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" : "bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white border-transparent"}`}>
                          <Trash2 className="w-4 h-4 mr-1" /> 삭제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ★ 유령 데이터 자동 청소기 구역 ★ */}
            <div className={adminTheme.warningPanel}>
              <h3 className={`text-lg font-bold mb-2 flex items-center ${isLightTheme ? "text-amber-700" : "text-purple-300"}`}>
                <Search className="w-5 h-5 mr-2" /> 👻 유령 데이터(빈 껍데기) 자동 청소
              </h3>
              <p className={`text-sm mb-4 ${isLightTheme ? "text-slate-600" : "text-gray-400"}`}>
                과거의 오류나 수정으로 인해 경기 기록은 없는데 티어표나 선수 명단에 이름만 남아있는 <strong className={isLightTheme ? "text-slate-900" : "text-white"}>유령 선수들을 한 번에 찾아내어 완전 삭제</strong>합니다.
              </p>
              <button type="button" onClick={handleCleanGhostData} disabled={isCleaningGhosts} className={isLightTheme ? "w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg flex justify-center items-center shadow-[0_16px_32px_rgba(124,58,237,0.18)] transition" : "w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"}>
                {isCleaningGhosts ? <Loader2 className="w-5 h-5 animate-spin" /> : "🔍 유령 데이터 찾아서 영구 삭제하기"}
              </button>
            </div>

            <div className={adminTheme.dangerPanel}>
              <h3 className={`text-lg font-bold mb-2 ${isLightTheme ? "text-rose-700" : "text-red-300"}`}>🚨 데이터베이스 완벽 초기화</h3>
              <p className={`text-sm mb-4 ${isLightTheme ? "text-slate-600" : "text-gray-400"}`}>
                기존에 쌓인 테스트용 데이터를 싹 지우고, 참가자가 <strong className={isLightTheme ? "text-slate-900" : "text-white"}>0명인 완전 초기 상태</strong>로 리셋합니다. (실전 오픈용)
              </p>
              <button onClick={() => setShowResetModal(true)} className={isLightTheme ? "w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex justify-center items-center shadow-[0_16px_32px_rgba(220,38,38,0.18)] transition" : "w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"}>
                <RefreshCw className="w-4 h-4 mr-2" /> 모든 데이터 지우고 백지상태로 시작하기
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            [기타 설정] 탭 컨텐츠 (팝업 관리)
            ========================================================= */}
        {adminInnerTab === "etc" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div data-admin-surface="true" className={`${adminTheme.sectionCard} ${isLightTheme ? "admin-light-surface" : ""}`}>
              <h2 className={`text-2xl font-bold mb-2 flex items-center ${adminTheme.heading}`}>
                <Megaphone className="w-6 h-6 mr-2 text-indigo-400" /> 사이트 팝업(공지사항) 띄우기
              </h2>
              <p className={`text-sm mb-6 break-keep ${adminTheme.mutedText}`}>
                사이트 방문자들이 접속했을 때 가운데에 나타나는 팝업창을 작성합니다.<br/>
                유저가 <strong className="text-white">[오늘 하루 보지 않기]</strong>를 누르더라도, 여기서 내용을 새로 수정하여 저장하면 다시 유저들에게 나타납니다!
              </p>

              <form onSubmit={handleSavePopup} className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-sm font-bold ml-1 ${adminTheme.bodyText}`}>팝업 제목</label>
                  <input
                    type="text"
                    value={popupTitleInput}
                    onChange={(e) => setPopupTitleInput(e.target.value)}
                    placeholder="예: 📢 왁타버스 새로운 내전 이벤트 안내!"
                    className={adminTheme.input}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-bold ml-1 ${adminTheme.bodyText}`}>팝업 상세 내용</label>
                  <textarea
                    value={popupContentInput}
                    onChange={(e) => setPopupContentInput(e.target.value)}
                    placeholder="공지하실 내용을 입력해주세요. (엔터키를 치면 줄바꿈이 그대로 적용됩니다.)"
                    className={adminTheme.textarea}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className={isLightTheme ? "flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex justify-center items-center shadow-[0_16px_32px_rgba(79,70,229,0.18)] transition" : "flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex justify-center items-center shadow-lg transition"}>
                    <Megaphone className="w-5 h-5 mr-2" /> 새 내용으로 팝업 띄우기
                  </button>
                  <button type="button" onClick={handleDeletePopup} className={`flex-1 py-3 font-bold rounded-lg flex justify-center items-center border transition ${isLightTheme ? "bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800 border-rose-200" : "bg-red-900/40 hover:bg-red-600 text-red-400 hover:text-white border-red-800/50"}`}>
                    <Trash2 className="w-5 h-5 mr-2" /> 팝업 내리기
                  </button>
                </div>
              </form>

              {/* 팝업 미리보기 상태창 */}
              <div className={`mt-8 pt-6 border-t ${adminTheme.sectionDivider}`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center ${adminTheme.heading}`}>
                  <Activity className="w-5 h-5 mr-2 text-gray-400" /> 현재 팝업 송출 상태
                </h3>
                {sitePopup && sitePopup.isActive ? (
                  <div className={`p-5 rounded-lg border ${isLightTheme ? "bg-gradient-to-b from-white to-slate-50 border-indigo-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : "bg-gradient-to-b from-gray-900 to-gray-800 border-indigo-500/30 shadow-inner"}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-black tracking-wider">송출 중 (ON)</span>
                      <span className="text-xs text-gray-500">최종 수정: {new Date(sitePopup.updatedAt).toLocaleString()}</span>
                    </div>
                    <h4 className={`text-xl font-bold mb-3 ${adminTheme.heading}`}>{sitePopup.title}</h4>
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${adminTheme.bodyText}`}>{sitePopup.content}</p>
                  </div>
                ) : (
                  <div className={`p-5 rounded-lg border flex flex-col items-center justify-center py-10 ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-gray-900 border border-gray-700"}`}>
                    <CheckSquare className={`w-10 h-10 mb-3 ${adminTheme.mutedText}`} />
                    <p className="text-gray-400 font-medium">현재 유저들에게 노출 중인 팝업이 없습니다.</p>
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
      <div
        data-theme={theme}
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          theme === "light" ? "bg-slate-50 text-slate-900" : "bg-[#0f172a] text-white"
        }`}
      >
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> 데이터 로딩 중...
      </div>
    );

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-sans pb-20 transition-colors duration-300 ${
        theme === "light" ? "bg-slate-50" : "bg-[#0f172a]"
      }`}
    >
      <style>{globalThemeStyles}</style>

      {/* =========================================================
          ★ 유저 친화적인 사이트 공지사항(팝업) 모달 ★
          ========================================================= */}
      {showSitePopup && sitePopup && sitePopup.isActive && (
        <div className={shellTheme.popupOverlay}>
          <div className={shellTheme.popupPanel}>
            {/* 팝업 헤더 */}
            <div className={shellTheme.popupHeader}>
              <h3 className={shellTheme.popupHeaderTitle}>
                <Megaphone className="w-5 h-5 mr-2 text-indigo-400" /> 공지사항
              </h3>
              <button 
                onClick={() => setShowSitePopup(false)} 
                className={shellTheme.popupCloseButton}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* 팝업 내용 */}
            <div className={shellTheme.popupBody}>
              <h2 className={shellTheme.popupBodyTitle}>{sitePopup.title}</h2>
              <p className={shellTheme.popupBodyText}>
                {sitePopup.content}
              </p>
            </div>
            
            {/* 팝업 하단 (오늘 하루 보지 않기 + 닫기) */}
            <div className={shellTheme.popupFooter}>
              <label className="flex items-center gap-2 cursor-pointer group px-2">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      const todayStr = new Date().toISOString().split('T')[0];
                      localStorage.setItem('wak_popup_hidden_today', `${todayStr}_${sitePopup.updatedAt}`);
                      setShowSitePopup(false);
                    }
                  }}
                  className={shellTheme.popupCheckbox}
                />
                <span className={shellTheme.popupFooterLabel}>
                  오늘 하루 보지 않기
                </span>
              </label>
              <button 
                onClick={() => setShowSitePopup(false)} 
                className={shellTheme.popupFooterButton}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`${shellTheme.toastBase} ${toast.type === "error" ? shellTheme.toastError : shellTheme.toastSuccess}`}>
          {toast.message}
        </div>
      )}

      {isLightTheme && (matchToEdit || matchToDelete || showResetModal) && (
        <style>{`
          .admin-modal-surface h1.text-white,
          .admin-modal-surface h2.text-white,
          .admin-modal-surface h3.text-white,
          .admin-modal-surface h4.text-white,
          .admin-modal-surface p.text-white,
          .admin-modal-surface span.text-white,
          .admin-modal-surface input.text-white,
          .admin-modal-surface textarea.text-white { color: #0f172a; }
          .admin-modal-surface .bg-gray-700.text-white { color: #334155; }
          .admin-modal-surface .bg-gray-700.text-gray-400 { color: #94a3b8; }
          .admin-modal-surface .text-gray-200 { color: #334155; }
          .admin-modal-surface .text-gray-500 { color: #94a3b8; }
          .admin-modal-surface .text-gray-400 { color: #64748b; }
          .admin-modal-surface .text-gray-300 { color: #475569; }
          .admin-modal-surface .text-blue-300 { color: #1d4ed8; }
          .admin-modal-surface .text-red-400 { color: #be123c; }
          .admin-modal-surface .text-indigo-300 { color: #4338ca; }
          .admin-modal-surface .text-indigo-400 { color: #4f46e5; }
          .admin-modal-surface .text-yellow-400 { color: #b45309; }
          .admin-modal-surface .border-gray-700 { border-color: #e2e8f0; }
          .admin-modal-surface .border-gray-600 { border-color: #cbd5e1; }
          .admin-modal-surface [class*="border-blue-700/40"] { border-color: #bfdbfe; }
          .admin-modal-surface [class*="border-yellow-700/50"] { border-color: #fde68a; }
          .admin-modal-surface [class*="border-indigo-700/50"] { border-color: #c7d2fe; }
          .admin-modal-surface [class*="border-indigo-800/50"] { border-color: #c7d2fe; }
          .admin-modal-surface .bg-gray-900,
          .admin-modal-surface [class*="bg-gray-900"] { background-color: #f8fafc; }
          .admin-modal-surface .bg-gray-800,
          .admin-modal-surface [class*="bg-gray-800/40"],
          .admin-modal-surface [class*="bg-gray-800/50"] { background-color: #ffffff; }
          .admin-modal-surface .bg-gray-700 { background-color: #e2e8f0; }
          .admin-modal-surface [class*="bg-blue-900/40"] { background-color: #eff6ff; }
          .admin-modal-surface [class*="bg-red-900/40"] { background-color: #fff1f2; }
          .admin-modal-surface [class*="bg-indigo-900/30"] { background-color: #eef2ff; }
          .admin-modal-surface .hover\\:bg-gray-600:hover { background-color: #cbd5e1; }
          .admin-modal-surface [class*="hover:bg-indigo-600"]:hover { background-color: #4f46e5; }
          .admin-modal-surface .hover\\:text-gray-200:hover { color: #0f172a; }
        `}</style>
      )}

      {matchToEdit && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center px-4 py-10 backdrop-blur-sm overflow-y-auto ${isLightTheme ? "bg-slate-950/45" : "bg-black/80"}`}>
          <div className={`admin-modal-surface rounded-xl p-6 max-w-3xl w-full relative my-auto ${isLightTheme ? "bg-white border border-slate-200 shadow-[0_28px_70px_rgba(15,23,42,0.18)]" : "bg-gray-800 border border-blue-500/50 shadow-2xl"}`}>
            <button onClick={() => setMatchToEdit(null)} className={`absolute top-4 right-4 transition ${isLightTheme ? "text-slate-400 hover:text-slate-900" : "text-gray-500 hover:text-white"}`}><X className="w-6 h-6" /></button>
            <div className="flex items-center mb-6">
              <Edit className="w-6 h-6 mr-2 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">경기 기록 수정</h3>
            </div>
            
            <form onSubmit={handleSaveEditedMatch} className="space-y-6">
              <div className="flex bg-gray-900 p-1 rounded-lg mb-6 border border-gray-700">
                <button type="button" onClick={() => setEditMatchMode("individual")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${editMatchMode === "individual" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
                  <User className="w-4 h-4 mr-2" /> 개인전
                </button>
                <button type="button" onClick={() => setEditMatchMode("team")} className={`flex-1 py-2 text-sm font-bold rounded-md flex justify-center items-center transition ${editMatchMode === "team" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}`}>
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
                      <span className="text-sm text-gray-300 font-bold whitespace-nowrap">총 모인 별풍선 개수:</span>
                      <div className="flex items-center w-full sm:w-auto">
                        <input 
                          type="number" 
                          placeholder="예: 100000" 
                          value={editTotalFunding} 
                          onChange={(e) => setEditTotalFunding(e.target.value)} 
                          className="w-full sm:w-48 bg-gray-900 border border-gray-600 text-yellow-400 font-black rounded-l-lg px-4 py-2 focus:border-yellow-500 outline-none text-right" 
                        />
                        <span className="bg-gray-700 border border-l-0 border-gray-600 text-gray-300 px-4 py-2 rounded-r-lg font-bold">개</span>
                      </div>
                   </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={editGameName} onChange={(e) => setEditGameName(e.target.value)} placeholder="게임 이름" className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
                <input type="date" value={editMatchDate} onChange={(e) => setEditMatchDate(e.target.value)} className="bg-gray-900 border border-gray-600 text-white rounded-lg px-4 py-2" required />
              </div>

              <div className="bg-gray-900 border border-blue-700/40 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <input type="checkbox" checked={editIsPublished} onChange={(e) => setEditIsPublished(e.target.checked)} className="w-5 h-5 accent-blue-500 rounded bg-gray-800 border-gray-600 cursor-pointer" />
                  <span className="text-blue-300 font-bold flex items-center text-base select-none">
                    <Globe className="w-5 h-5 mr-2" /> 일반 사용자에게 공개하기
                  </span>
                </label>
                <p className="text-xs text-gray-400 mt-2">체크를 끄면 임시 저장 상태로 유지되며, 홈/경기 기록/티어표에는 반영되지 않습니다.</p>
              </div>

              {editMatchMode === "individual" && (
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 mt-4">
                  <p className="text-xs font-bold text-gray-500 mb-2">개인별 순위와 점수를 수정합니다.</p>
                  {editIndividualResults.map((r, idx) => (
                    <div key={idx} className="flex flex-col gap-2 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                      <div className="flex gap-2">
                        <input type="number" value={r.rank} onChange={(e) => { const n = [...editIndividualResults]; n[idx].rank = Number(e.target.value); setEditIndividualResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600" />
                        <input type="text" value={r.playerName} onChange={(e) => { const n = [...editIndividualResults]; n[idx].playerName = e.target.value; setEditIndividualResults(n); }} placeholder="참가자 이름" className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-600" />
                        <input type="number" value={r.scoreChange} onChange={(e) => { const n = [...editIndividualResults]; n[idx].scoreChange = Number(e.target.value); setEditIndividualResults(n); }} placeholder="점수" className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600" />
                        <button type="button" onClick={() => { if (editIndividualResults.length > 1) setEditIndividualResults(editIndividualResults.filter((_, i) => i !== idx)); }} className="p-2 text-gray-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      {editHasFunding && (
                        <div className="flex gap-2 items-center sm:pl-[72px]">
                          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 상금:</span>
                          <input type="number" placeholder="비율(%)" value={r.fundingRatio || ""} onChange={(e) => {
                            const val = e.target.value;
                            const n = [...editIndividualResults];
                            n[idx].fundingRatio = val;
                            n[idx].fundingAmount = val && editTotalFunding ? Math.floor((Number(editTotalFunding) * Number(val)) / 100) : "";
                            setEditIndividualResults(n);
                          }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold">% ➔</span>
                          <input type="number" placeholder="별풍선(직접수정 가능)" value={r.fundingAmount || ""} onChange={(e) => {
                            const n = [...editIndividualResults];
                            n[idx].fundingAmount = e.target.value;
                            n[idx].fundingRatio = "";
                            setEditIndividualResults(n);
                          }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold mr-8">개</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditIndividualResults([...editIndividualResults, { playerName: "", rank: editIndividualResults.length + 1, scoreChange: 0, fundingRatio: "", fundingAmount: "" }]) } className="w-full py-2 text-gray-400 border border-dashed border-gray-600 rounded hover:text-white hover:border-gray-400 transition">참가자 추가</button>
                </div>
              )}

              {editMatchMode === "team" && (
                <div className="space-y-4 mt-4">
                  <p className="text-xs font-bold text-indigo-400 mb-2">팀 기록을 수정합니다.</p>
                  {editTeamResults.map((team, tIdx) => (
                    <div key={team.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-3 relative overflow-hidden flex flex-col">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                      <div className="flex gap-2 mb-3 pb-3 border-b border-gray-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 mb-1">순위</span>
                          <input type="number" value={team.rank} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].rank = Number(e.target.value); setEditTeamResults(n); }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 mb-1">세트 승수</span>
                          <input type="number" min="0" value={team.setWins} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].setWins = e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0); setEditTeamResults(n); }} placeholder="예: 7" className="w-24 bg-gray-800 text-white text-center rounded border border-gray-600 py-1" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] text-gray-500 mb-1">팀 전체 획득/감소 점수</span>
                          <input type="number" value={team.scoreChange} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].scoreChange = Number(e.target.value); setEditTeamResults(n); }} placeholder="점수" className="w-full bg-gray-800 text-white px-3 rounded border border-gray-600 py-1" />
                        </div>
                        <div className="flex flex-col justify-end">
                          <button type="button" onClick={() => { if (editTeamResults.length > 2) setEditTeamResults(editTeamResults.filter((_, i) => i !== tIdx)); }} className="p-2 text-gray-500 hover:text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      {editHasFunding && (
                        <div className="flex gap-2 items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700/50 mb-2">
                          <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">💰 팀상금:</span>
                          <input type="number" placeholder="비율(%)" value={team.fundingRatio || ""} onChange={(e) => {
                            const val = e.target.value;
                            const n = [...editTeamResults];
                            n[tIdx].fundingRatio = val;
                            n[tIdx].fundingAmount = val && editTotalFunding ? Math.floor((Number(editTotalFunding) * Number(val)) / 100) : "";
                            setEditTeamResults(n);
                          }} className="w-16 bg-gray-800 text-white text-center rounded border border-gray-600 py-1.5 text-xs focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold">% ➔</span>
                          <input type="number" placeholder="팀에 분배될 별풍선(수동수정 가능)" value={team.fundingAmount || ""} onChange={(e) => {
                            const n = [...editTeamResults];
                            n[tIdx].fundingAmount = e.target.value;
                            n[tIdx].fundingRatio = "";
                            setEditTeamResults(n);
                          }} className="flex-1 bg-gray-800 text-yellow-400 px-3 rounded border border-gray-600 py-1.5 text-xs font-bold focus:border-yellow-500 outline-none" />
                          <span className="text-gray-500 text-xs font-bold">개</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {team.players.map((pName, pIdx) => (
                          <div key={pIdx} className="flex gap-1">
                            <input type="text" value={pName} onChange={(e) => { const n = [...editTeamResults]; n[tIdx].players[pIdx] = e.target.value; setEditTeamResults(n); }} placeholder="팀원 이름" className="flex-1 bg-gray-800 text-sm text-white px-2 py-1 rounded border border-gray-600" />
                            <button type="button" onClick={() => { if (team.players.length > 1) { const n = [...editTeamResults]; n[tIdx].players.splice(pIdx, 1); setEditTeamResults(n); } }} className="text-gray-500 hover:text-red-400 px-1"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => { const n = [...editTeamResults]; n[tIdx].players.push(""); setEditTeamResults(n); }} className="text-xs text-indigo-400 bg-indigo-900/30 px-3 py-1.5 rounded hover:bg-indigo-600 hover:text-white transition w-full mt-2 border border-indigo-800/50">+ 팀원 추가</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditTeamResults([...editTeamResults, createEmptyTeamMatchResult(Date.now(), editTeamResults.length + 1, 0)])} className="w-full py-2.5 text-indigo-300 border-2 border-dashed border-indigo-700/50 rounded-lg hover:bg-indigo-900/30 transition font-medium text-sm">새로운 팀 라인 추가</button>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setMatchToEdit(null)} className={`flex-1 py-3 rounded-lg transition font-medium ${isLightTheme ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
                  취소
                </button>
                <button type="submit" disabled={isEditingSubmit} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex justify-center items-center transition shadow-lg">
                  {isEditingSubmit ? <Loader2 className="w-5 h-5 animate-spin" /> : "수정 내용 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {matchToDelete && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-sm ${isLightTheme ? "bg-slate-950/45" : "bg-black/80"}`}>
          <div className={`admin-modal-surface rounded-xl p-6 max-w-sm w-full ${isLightTheme ? "bg-white border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]" : "bg-gray-800 border border-gray-700 shadow-2xl"}`}>
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">정말 삭제하시겠습니까?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              <span className="font-bold text-yellow-400">[{matchToDelete.gameName}]</span> 경기를 삭제합니다.<br />
              이 경기로 얻거나 잃은 참가자들의 점수가 <br />모두 이전으로 되돌아갑니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button onClick={() => setMatchToDelete(null)} disabled={isDeleting} className={`flex-1 py-2.5 rounded-lg transition font-medium ${isLightTheme ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>취소</button>
              <button onClick={confirmDeleteMatch} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "삭제 및 복구"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-sm ${isLightTheme ? "bg-slate-950/45" : "bg-black/80"}`}>
          <div className={`admin-modal-surface rounded-xl p-6 max-w-sm w-full ${isLightTheme ? "bg-white border border-slate-200 shadow-[0_24px_60px_rgba(15,23,42,0.18)]" : "bg-gray-800 border border-gray-700 shadow-2xl"}`}>
            <div className="flex items-center text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8 mr-2" />
              <h3 className="text-xl font-bold text-white">정말 초기화하시겠습니까?</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              지금까지의 <span className="font-bold text-red-400">모든 경기 기록과 참가자가 삭제</span>됩니다.<br /><br />
              삭제 후 참가자가 아무도 없는 완전한<br />'백지 상태'로 즉시 전환됩니다. (복구 불가)
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} disabled={isResetting} className={`flex-1 py-2.5 rounded-lg transition font-medium ${isLightTheme ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>취소</button>
              <button onClick={handleResetDatabase} disabled={isResetting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition flex justify-center items-center">
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : "초기화 및 실전 시작"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ★ 실수로 누락되었던 개인 프로필 팝업창 코드 완벽 복구 ★ */}
      {selectedPlayer && (() => {
        const stats = getPlayerStats(selectedPlayer);
        const playerInfo = players.find(p => p.name === selectedPlayer);
        if (!playerInfo) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        const storageData = JSON.parse(localStorage.getItem('wak_vleague_hearts_v1') || '{"date": "", "votes": []}');
        const hasVotedToday = storageData.date === todayStr && storageData.votes.includes(selectedPlayer);
        
        const broadcastLink = playerInfo.broadcastUrl?.trim() 
          ? playerInfo.broadcastUrl 
          : `https://www.sooplive.co.kr/search/station?keyword=${encodeURIComponent(selectedPlayer)}`;

        return (
          <div className={`fixed inset-0 z-[150] flex items-center justify-center px-4 py-4 backdrop-blur-sm ${isLightTheme ? "bg-slate-950/45" : "bg-black/80"}`} onClick={() => setSelectedPlayer(null)}>
            <div className={`rounded-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col ${isLightTheme ? "bg-white border border-slate-200 shadow-[0_28px_70px_rgba(15,23,42,0.18)]" : "bg-gray-800 border border-gray-700 shadow-2xl"}`} onClick={e => e.stopPropagation()}>
              <div className={`p-6 flex flex-col items-center relative border-b ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-gray-900 border-gray-700"}`}>
                <button onClick={() => setSelectedPlayer(null)} className={`absolute top-4 right-4 transition ${isLightTheme ? "text-slate-400 hover:text-slate-900" : "text-gray-500 hover:text-white"}`}><X className="w-6 h-6" /></button>
                <div className={`w-24 h-24 rounded-2xl overflow-hidden mb-4 ${isLightTheme ? "bg-white border-2 border-slate-200 shadow-md" : "border-4 shadow-lg bg-gray-700 border-green-500/50"}`}>
                  <img src={getAvatarSrc(selectedPlayer)} onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedPlayer}`; }} alt={selectedPlayer} className="w-full h-full object-cover" />
                </div>
                <h3 className={`text-2xl font-black ${publicTheme.heading}`}>{selectedPlayer}</h3>
                <span className={`mt-2 inline-flex items-center justify-center px-3 py-1 rounded-full text-sm ${isLightTheme ? "bg-emerald-100 text-emerald-700 font-black shadow-sm" : "font-bold text-green-400 text-lg"}`}>{playerInfo.points} pt</span>

                <div className="flex flex-col items-center mt-5 w-full gap-2">
                  <button
                    onClick={() => handleCheerPlayer(playerInfo.id, selectedPlayer)}
                    disabled={cheeringPlayerId === playerInfo.id}
                    className={`flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-base transition-all duration-300 transform hover:scale-105 active:scale-95 w-full ${
                      cheeringPlayerId === playerInfo.id
                        ? (isLightTheme ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed hover:scale-100 active:scale-100" : "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed hover:scale-100 active:scale-100")
                        : hasVotedToday
                          ? (isLightTheme ? "bg-pink-50 border border-pink-200 text-pink-700 shadow-[0_12px_28px_rgba(219,39,119,0.10)] hover:bg-pink-100" : "bg-pink-500/10 border border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.1)] hover:bg-pink-500/20")
                          : (isLightTheme ? "bg-pink-600 hover:bg-pink-500 text-white shadow-[0_16px_32px_rgba(219,39,119,0.20)]" : "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]")
                    }`}
                  >
                    {cheeringPlayerId === playerInfo.id ? (
                      <><Loader2 className={`w-5 h-5 mr-2 animate-spin ${isLightTheme ? "text-slate-400" : "text-gray-400"}`} /> 처리 중...</>
                    ) : (
                      <>
                        <Heart className={`w-3.5 h-3.5 mr-1.5 ${hasVotedToday ? (isLightTheme ? "fill-pink-600 text-pink-600" : "fill-pink-400 text-pink-400") : "fill-transparent text-white"}`} />
                        {hasVotedToday ? "응원 완료!" : "응원하기"} {(playerInfo.hearts || 0).toLocaleString()}
                      </>
                    )}
                  </button>
                  
                  <a
                    href={broadcastLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={isLightTheme ? "flex items-center justify-center px-6 py-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 font-bold text-base transition-all duration-300 transform hover:scale-105 w-full" : "flex items-center justify-center px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all duration-300 transform hover:scale-105 w-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"}
                  >
                    <Tv className="w-5 h-5 mr-2" /> 방송국 가기
                  </a>

                  <p className={`text-xs mt-2 px-3 py-1.5 rounded-lg border text-center break-keep w-full ${isLightTheme ? "text-slate-500 bg-slate-50 border-slate-200" : "text-gray-500 bg-gray-800 border-gray-700"}`}>
                    💡 스트리머 1명당 <strong className={isLightTheme ? "text-slate-700" : "text-gray-300"}>하루에 1번만</strong> 응원할 수 있습니다.<br/>(다시 누르면 취소됩니다)
                  </p>
                </div>
              </div>
              <div className={`mx-6 mt-5 mb-1 grid grid-cols-3 divide-x rounded-xl border overflow-hidden ${isLightTheme ? "divide-slate-200 bg-slate-50 border-slate-200" : "divide-gray-700 bg-gray-800/50 border-gray-700"}`}>
                <div className="flex flex-col items-center py-4">
                  <span className={`text-xs font-medium mb-1 ${publicTheme.mutedText}`}>총 참가</span>
                  <span className={`text-xl font-bold ${publicTheme.heading}`}>{stats.totalMatches}전</span>
                </div>
                <div className="flex flex-col items-center py-4">
                  <span className={`text-xs font-medium mb-1 ${publicTheme.mutedText}`}>우승 확률(1위)</span>
                  <span className={`text-xl font-bold ${isLightTheme ? "text-blue-600" : "text-yellow-400"}`}>{stats.winRate}%</span>
                </div>
                <div className="flex flex-col items-center py-4 px-2 text-center">
                  <span className={`text-xs font-medium mb-1 ${publicTheme.mutedText}`}>주력 종목</span>
                  <span className={`text-sm font-bold leading-tight break-keep ${isLightTheme ? "text-slate-900" : "text-indigo-300"}`}>{stats.mostPlayedGame}</span>
                </div>
              </div>
              <div className="p-6 flex-1 min-h-0 flex flex-col">
                <h4 className={`text-sm font-bold mb-3 flex items-center ${publicTheme.mutedText}`}><Activity className="w-4 h-4 mr-1.5" /> 최근 전적 ({stats.recentMatches.length}경기)</h4>
                {stats.recentMatches.length === 0 ? (
                  <p className={`text-center py-6 text-sm ${publicTheme.emptyState}`}>경기 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                    {stats.recentMatches.map((m) => (
                      <div key={m.id} className={`flex justify-between items-center p-3 rounded-lg border ${isLightTheme ? "bg-slate-50 border-slate-200" : "bg-gray-900/50 border-gray-700/50"}`}>
                        <div className="flex-1 truncate pr-2">
                          <p className={`text-sm font-bold truncate ${publicTheme.heading}`}>{m.gameName}</p>
                          <p className={`text-[10px] ${publicTheme.faintText}`}>{m.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${m.rank === 1 ? (isLightTheme ? "text-amber-700" : 'text-yellow-400') : (isLightTheme ? "text-slate-500" : 'text-gray-400')}`}>{m.rank}위</span>
                          <span className={`text-xs px-2 py-0.5 rounded w-14 text-center ${m.scoreChange >= 0 ? (isLightTheme ? "bg-emerald-100 text-emerald-700 font-black" : "bg-green-500/20 text-green-400 font-bold") : (isLightTheme ? "bg-rose-100 text-rose-700 font-black" : "bg-red-500/20 text-red-400 font-bold")}`}>
                            {m.scoreChange > 0 ? "+" : ""}{m.scoreChange}
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

      <nav className={`py-4 px-1.5 md:px-2 flex justify-between sticky top-0 z-50 transition-colors duration-300 ${shellTheme.nav}`}>
        <div className="max-w-[1296px] mx-auto w-full flex justify-between items-center overflow-x-auto md:overflow-visible [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <h1 className={`text-lg md:text-xl font-bold cursor-pointer flex items-center whitespace-nowrap transition-colors ${shellTheme.navTitle}`} onClick={() => navigateTo("home")}>
              <Gamepad2 className={`w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2 transition-colors ${shellTheme.navTitleIcon}`} /> 버츄얼 종겜 리그
            </h1>
            <a href="https://www.sooplive.co.kr/station/ecvhao" target="_blank" rel="noopener noreferrer" title="우왁굳 방송국" className={shellTheme.brandBadge}>
              WAK
            </a>
            {lastUpdated && (
              <span className={`ml-2 md:ml-3 ${shellTheme.metaChip}`}>
                <RefreshCw className="w-3 h-3 mr-1 opacity-70" /> 최근 갱신: {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <span className={`ml-1 md:ml-2 ${shellTheme.metaChip}`}>
              <Users className="w-3 h-3 mr-1 opacity-70" /> 오늘 방문자: {todayVisits}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5 ml-3 md:ml-4 flex-shrink-0">
            <button onClick={() => navigateTo("home")} className={getDesktopNavButtonClasses("home")}>홈</button>
            <button onClick={() => navigateTo("players")} className={getDesktopNavButtonClasses("players")}>선수</button>
            <button onClick={() => navigateTo("matches")} className={getDesktopNavButtonClasses("matches")}>경기</button>
            <button onClick={() => navigateTo("stats")} className={getDesktopNavButtonClasses("stats")}>통계</button>
            <button onClick={() => navigateTo("tier")} className={getDesktopNavButtonClasses("tier")}>티어</button>
            <div className="relative flex items-center gap-1" data-wow-nav-layer="true">
              <button
                type="button"
                onClick={() => handleWowSectionNavigation("wow")}
                className={getDesktopNavButtonClasses("wow", "wow", { isActive: isWowSectionActive })}
              >
                <Shield className="w-4 h-4 mr-1" /> WOW
              </button>
              <button
                type="button"
                onClick={() => setIsWowNavMenuOpen((prev) => !prev)}
                className={getDesktopNavButtonClasses("wow", "wow", { isActive: isWowSectionActive || isWowNavMenuOpen })}
                aria-haspopup="menu"
                aria-expanded={isWowNavMenuOpen}
                aria-label="WOW 하위 메뉴 열기"
              >
                {isWowNavMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isWowNavMenuOpen && (
                <div className={`absolute left-0 top-[calc(100%+10px)] z-[80] w-72 rounded-2xl border p-2 shadow-2xl ${isLightTheme ? "border-slate-200 bg-white" : "border-gray-700 bg-gray-950/95 backdrop-blur"}`}>
                  <div className={`px-2 pb-2 pt-1 text-[11px] font-black tracking-[0.12em] ${isLightTheme ? "text-slate-400" : "text-gray-500"}`}>
                    WOW 메뉴
                  </div>
                  <div className="space-y-1">
                    {WOW_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleWowSectionNavigation(item.id)}
                          className={getWowNavMenuItemClasses(item.id)}
                        >
                          <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${activeTab === item.id ? (isLightTheme ? "border-blue-200 bg-white text-blue-700" : "border-blue-400/35 bg-blue-500/10 text-blue-200") : (isLightTheme ? "border-slate-200 bg-white text-slate-500" : "border-gray-700 bg-gray-900 text-gray-300")}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black">{item.label}</span>
                            <span className={`mt-0.5 block text-[11px] ${isLightTheme ? (activeTab === item.id ? "text-blue-500" : "text-slate-500") : (activeTab === item.id ? "text-blue-200/80" : "text-gray-400")}`}>
                              {item.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigateTo("admin")} className={getDesktopNavButtonClasses("admin", "admin")}>
              {isAdminAuth ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />} 관리
            </button>
            <button
              onClick={handleToggleTheme}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center text-sm font-medium whitespace-nowrap transition-colors ${
                isLightTheme
                  ? "bg-white text-slate-900 border-slate-200 hover:border-amber-200 hover:bg-amber-50"
                  : "bg-gray-800 text-yellow-300 border-gray-600 hover:text-white hover:border-yellow-400/60"
              }`}
            >
              {isLightTheme ? <Sun className="w-4 h-4 mr-1.5" /> : <Moon className="w-4 h-4 mr-1.5" />}
              {isLightTheme ? "라이트 모드" : "다크 모드"}
            </button>
          </div>
        </div>
      </nav>

      <main className={`mx-auto py-8 relative w-full transition-colors duration-300 ${activeTab === "raid" ? "max-w-[1800px] px-3 md:px-5 lg:px-6" : activeTab === "wow" ? "max-w-[1320px] px-4 md:px-4 lg:px-5" : activeTab === "dungeontier" ? "max-w-[1800px] px-3 md:px-4 lg:px-5" : activeTab === "wowraid" ? "max-w-6xl px-4" : "max-w-6xl px-4"}`}>

        {activeTab === "home" && renderHomeView()}
        {activeTab === "players" && renderPlayersView()}
        {activeTab === "matches" && renderMatchesView()}
        {activeTab === "stats" && renderStatsView()}
        {activeTab === "tier" && renderTierListView()}
        {activeTab === "wow" && renderWowView()}
        {activeTab === "wowraid" && renderWowRaidView()}
        {activeTab === "dungeontier" && renderDungeonTierGameView()}
        {activeTab === "raid" && renderRaidView()}
        {activeTab === "admin" && renderAdminView()}
      </main>

      {/* =========================================================
          ★ 모바일 전용 퀵 메뉴 플로팅 버튼 (FAB) ★
          ========================================================= */}
      {/* 바탕 어두워지는 레이어 (메뉴 밖을 클릭하면 닫히게 함) */}
      {isMobileMenuOpen && (
        <div
          className={shellTheme.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* 플로팅 메뉴 컨테이너 */}
      <div className="fixed bottom-6 left-6 z-[400] md:hidden flex flex-col items-start">
        
        {/* 촤라락 펼쳐지는 세로 탭 리스트 */}
        <div
          className={`flex flex-col gap-2 mb-4 origin-bottom-left transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isMobileMenuOpen ? "scale-100 opacity-100 translate-y-0" : "scale-0 opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          {[
            { id: "home", label: "홈", icon: Gamepad2 },
            { id: "players", label: "선수", icon: User },
            { id: "matches", label: "경기", icon: Swords },
            { id: "stats", label: "통계", icon: BarChart3 },
            { id: "tier", label: "티어", icon: Trophy },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigateTo(item.id);
                setIsMobileMenuOpen(false); // 탭 이동 후 메뉴 자동 닫기
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${activeTab === item.id ? shellTheme.mobileMenuActive : shellTheme.mobileMenuInactive}`}
            >
              {item.icon ? <item.icon className="w-5 h-5" /> : null}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
          <div className="flex flex-col gap-2" data-wow-nav-layer="true">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleWowSectionNavigation("wow", { closeMobileMenu: true })}
                className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${(isWowSectionActive || isMobileWowMenuOpen) ? shellTheme.mobileMenuActive : shellTheme.mobileMenuInactive}`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm flex-1 text-left">WOW</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMobileWowMenuOpen((prev) => !prev)}
                className={`flex items-center justify-center px-3.5 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${(isWowSectionActive || isMobileWowMenuOpen) ? shellTheme.mobileMenuActive : shellTheme.mobileMenuInactive}`}
                aria-expanded={isMobileWowMenuOpen}
                aria-label="WOW 하위 메뉴 열기"
              >
                {isMobileWowMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className={`flex flex-col gap-2 pl-4 transition-all duration-200 ${isMobileWowMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden pointer-events-none"}`}>
              {WOW_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleWowSectionNavigation(item.id, { closeMobileMenu: true })}
                    className={getMobileWowMenuItemClasses(item.id)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-sm">{item.label}</span>
                      <span className={`mt-0.5 block text-[11px] ${isLightTheme ? "text-slate-500" : "text-gray-400"}`}>{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => {
              navigateTo("admin");
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${activeTab === "admin" ? shellTheme.mobileMenuActive : shellTheme.mobileMenuInactive}`}
          >
            {isAdminAuth ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            <span className="text-sm">관리</span>
          </button>
          <button
            onClick={handleToggleTheme}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${shellTheme.mobileThemeButton}`}
          >
            {isLightTheme ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="text-sm">{isLightTheme ? "라이트 모드" : "다크 모드"}</span>
          </button>
        </div>

        {/* 동그란 메인 토글 버튼 */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 ${isMobileMenuOpen ? shellTheme.mobileFabOpen : shellTheme.mobileFabClosed}`}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

    </div>
  );
}
