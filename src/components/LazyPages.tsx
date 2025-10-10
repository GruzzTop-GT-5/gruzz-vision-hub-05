import { lazy } from 'react';

// Lazy loading всех страниц для оптимизации bundle size
export const Index = lazy(() => import('@/pages/Index'));
export const Auth = lazy(() => import('@/pages/Auth'));
export const AvailableOrders = lazy(() => import('@/pages/AvailableOrders'));
export const CreateOrder = lazy(() => import('@/pages/CreateOrder'));
export const Orders = lazy(() => import('@/pages/Orders'));
export const Profile = lazy(() => import('@/pages/Profile'));
export const UserProfile = lazy(() => import('@/pages/UserProfile'));
export const Balance = lazy(() => import('@/pages/Balance'));
export const History = lazy(() => import('@/pages/History'));
export const ChatSystem = lazy(() => import('@/pages/ChatSystem'));
export const AdminPanel = lazy(() => import('@/pages/AdminPanel'));
export const AdminPanelNew = lazy(() => import('@/pages/AdminPanelNew'));
export const Rules = lazy(() => import('@/pages/Rules'));
export const Ads = lazy(() => import('@/pages/Ads'));
export const MyAds = lazy(() => import('@/pages/MyAds'));
export const CreateAd = lazy(() => import('@/pages/CreateAd'));
export const AdDetails = lazy(() => import('@/pages/AdDetails'));
export const SpecialEquipment = lazy(() => import('@/pages/SpecialEquipment'));
export const NotFound = lazy(() => import('@/pages/NotFound'));