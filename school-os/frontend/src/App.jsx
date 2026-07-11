import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ShopShell from "./components/ShopShell.jsx";
import { ShopAuthProvider } from "./context/ShopAuthContext.jsx";

// Public pages
import Home               from "./pages/public/Home.jsx";
import About              from "./pages/public/About.jsx";
import Admissions         from "./pages/public/Admissions.jsx";
import Contact            from "./pages/public/Contact.jsx";
import Gallery            from "./pages/public/Gallery.jsx";
import VerifyCertificate  from "./pages/public/VerifyCertificate.jsx";
import Login              from "./pages/auth/Login.jsx";

// Dashboards
const SuperAdminDashboard = lazy(() => import("./pages/dashboards/superadmin/SuperAdminDashboard.jsx"));
const PrincipalDashboard = lazy(() => import("./pages/dashboards/principal/PrincipalDashboard.jsx"));
const Attendance = lazy(() => import("./pages/dashboards/teacher/Attendance.jsx"));
const AIReportCard = lazy(() => import("./pages/dashboards/teacher/AIReportCard.jsx"));
const Gradebook = lazy(() => import("./pages/dashboards/teacher/Gradebook.jsx"));
const LessonPlanner = lazy(() => import("./pages/dashboards/teacher/LessonPlanner.jsx"));
const QuestionPaper = lazy(() => import("./pages/dashboards/teacher/QuestionPaper.jsx"));
const SmartBoard = lazy(() => import("./pages/dashboards/teacher/SmartBoard.jsx"));
const StudentDashboard = lazy(() => import("./pages/dashboards/student/StudentDashboard.jsx"));
const ParentDashboard = lazy(() => import("./pages/dashboards/parent/ParentDashboard.jsx"));
const OfficeDashboard = lazy(() => import("./pages/dashboards/office/OfficeDashboard.jsx"));
const AdminSettings = lazy(() => import("./pages/dashboards/office/AdminSettings.jsx"));
const VisitorLog = lazy(() => import("./pages/dashboards/office/VisitorLog.jsx"));
const ExamScheduler = lazy(() => import("./pages/dashboards/office/ExamScheduler.jsx"));
const DigitalID = lazy(() => import("./pages/dashboards/student/DigitalID.jsx"));

// Shared modules
const Timetable = lazy(() => import("./pages/dashboards/shared/Timetable.jsx"));
const Homework = lazy(() => import("./pages/dashboards/shared/Homework.jsx"));
const Notices = lazy(() => import("./pages/dashboards/shared/Notices.jsx"));
const Library = lazy(() => import("./pages/dashboards/shared/Library.jsx"));
const Transport = lazy(() => import("./pages/dashboards/shared/Transport.jsx"));
const MyBus = lazy(() => import("./pages/dashboards/shared/MyBus.jsx"));
const Hostel = lazy(() => import("./pages/dashboards/shared/Hostel.jsx"));
const Inventory = lazy(() => import("./pages/dashboards/shared/Inventory.jsx"));
const HRPayroll = lazy(() => import("./pages/dashboards/shared/HRPayroll.jsx"));
const Certificates = lazy(() => import("./pages/dashboards/shared/Certificates.jsx"));
const Events = lazy(() => import("./pages/dashboards/shared/Events.jsx"));
const Messages = lazy(() => import("./pages/dashboards/shared/Messages.jsx"));
const DeviceSessions = lazy(() => import("./pages/auth/DeviceSessions.jsx"));
// ── Mega Upgrade modules ──────────────────────────────────────────────────────
const FeeReceipt = lazy(() => import("./pages/dashboards/shared/FeeReceipt.jsx"));
const FeesAnalytics = lazy(() => import("./pages/dashboards/shared/FeesAnalytics.jsx"));
const ReportsHub = lazy(() => import("./pages/dashboards/shared/ReportsHub.jsx"));
// ──────────────────────────────────────────────────────────────────────────────

// ── Dress Shop module ─────────────────────────────────────────────────────────
const ShopDashboard = lazy(() => import("./pages/shop/ShopDashboard.jsx"));
const ShopStock = lazy(() => import("./pages/shop/ShopStock.jsx"));
const ShopBilling = lazy(() => import("./pages/shop/ShopBilling.jsx"));
const ShopReturns = lazy(() => import("./pages/shop/ShopReturns.jsx"));
const ShopReports = lazy(() => import("./pages/shop/ShopReports.jsx"));
const ShopCustomers = lazy(() => import("./pages/shop/ShopCustomers.jsx"));
const ShopSuppliers = lazy(() => import("./pages/shop/ShopSuppliers.jsx"));
const ShopSearch = lazy(() => import("./pages/shop/ShopSearch.jsx"));
const ShopAdmin = lazy(() => import("./pages/shop/ShopAdmin.jsx"));
// ─────────────────────────────────────────────────────────────────────────────

const ALL = ["principal","teacher","student","parent","office","admin","hr","transport","librarian"];
const STAFF = ["principal","teacher","office","admin"];

// Wrapper that nests a shop page inside ShopShell + ShopAuthProvider
function ShopRoute({ children, adminOnly }) {
  return (
    <ProtectedRoute shopRoute allowedRoles={adminOnly ? ["admin"] : STAFF}>
      <ShopAuthProvider>
        <ShopShell>
          {children}
        </ShopShell>
      </ShopAuthProvider>
    </ProtectedRoute>
  );
}

import { usePushNotifications } from "./hooks/usePushNotifications.js";

export default function App() {
  usePushNotifications();
  
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-paper"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div></div>}>
      <Routes>
      {/* ── Public ── */}
      <Route path="/"                         element={<Home />} />
      <Route path="/about"                    element={<About />} />
      <Route path="/admissions"               element={<Admissions />} />
      <Route path="/contact"                  element={<Contact />} />
      <Route path="/gallery"                  element={<Gallery />} />
      <Route path="/verify-certificate/:id"   element={<VerifyCertificate />} />
      <Route path="/login"                    element={<Login />} />

      {/* ── Role dashboards ── */}
      <Route path="/dashboard/superadmin" element={
        <ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/principal" element={
        <ProtectedRoute allowedRoles={["principal","admin"]}><PrincipalDashboard /></ProtectedRoute>} />

      <Route path="/dashboard/teacher/attendance" element={
        <ProtectedRoute allowedRoles={["teacher","admin"]}><Attendance /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/report-card" element={
        <ProtectedRoute allowedRoles={["teacher","admin"]}><AIReportCard /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/gradebook" element={
        <ProtectedRoute allowedRoles={["teacher","principal","admin"]}><Gradebook /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/lesson-planner" element={
        <ProtectedRoute allowedRoles={["teacher","principal","admin"]}><LessonPlanner /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/question-paper" element={
        <ProtectedRoute allowedRoles={["teacher","principal","admin"]}><QuestionPaper /></ProtectedRoute>} />
      <Route path="/dashboard/teacher/smart-board" element={
        <ProtectedRoute allowedRoles={["teacher","principal","admin"]}><SmartBoard /></ProtectedRoute>} />

      <Route path="/dashboard/student" element={
        <ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/student/id-card" element={
        <ProtectedRoute allowedRoles={["student"]}><DigitalID /></ProtectedRoute>} />
      <Route path="/dashboard/parent" element={
        <ProtectedRoute allowedRoles={["parent"]}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/office" element={
        <ProtectedRoute allowedRoles={["office","principal","admin"]}><OfficeDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/office/visitors" element={
        <ProtectedRoute allowedRoles={["office","principal","admin"]}><VisitorLog /></ProtectedRoute>} />
      <Route path="/dashboard/office/exam-scheduler" element={
        <ProtectedRoute allowedRoles={["office","principal","admin"]}><ExamScheduler /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={["office","principal","admin"]}><AdminSettings /></ProtectedRoute>} />

      {/* ── Shared modules ── */}
      <Route path="/dashboard/timetable" element={
        <ProtectedRoute allowedRoles={ALL}><Timetable /></ProtectedRoute>} />
      <Route path="/dashboard/homework" element={
        <ProtectedRoute allowedRoles={ALL}><Homework /></ProtectedRoute>} />
      <Route path="/dashboard/notices" element={
        <ProtectedRoute allowedRoles={ALL}><Notices /></ProtectedRoute>} />
      <Route path="/dashboard/library" element={
        <ProtectedRoute allowedRoles={ALL}><Library /></ProtectedRoute>} />
      <Route path="/dashboard/transport" element={
        <ProtectedRoute allowedRoles={ALL}><Transport /></ProtectedRoute>} />
      <Route path="/dashboard/my-bus" element={
        <ProtectedRoute allowedRoles={["student","parent"]}><MyBus /></ProtectedRoute>} />
      <Route path="/dashboard/hostel" element={
        <ProtectedRoute allowedRoles={STAFF}><Hostel /></ProtectedRoute>} />
      <Route path="/dashboard/inventory" element={
        <ProtectedRoute allowedRoles={STAFF}><Inventory /></ProtectedRoute>} />
      <Route path="/dashboard/hr" element={
        <ProtectedRoute allowedRoles={["principal","hr","admin"]}><HRPayroll /></ProtectedRoute>} />
      <Route path="/dashboard/certificates" element={
        <ProtectedRoute allowedRoles={STAFF}><Certificates /></ProtectedRoute>} />
      <Route path="/dashboard/events" element={
        <ProtectedRoute allowedRoles={ALL}><Events /></ProtectedRoute>} />
      <Route path="/dashboard/messages" element={
        <ProtectedRoute allowedRoles={ALL}><Messages /></ProtectedRoute>} />

      {/* ── Mega Upgrade routes ── */}
      <Route path="/dashboard/fees/receipt/:id" element={
        <ProtectedRoute allowedRoles={STAFF}><FeeReceipt /></ProtectedRoute>} />
      <Route path="/dashboard/fees/analytics" element={
        <ProtectedRoute allowedRoles={["principal","office","admin"]}><FeesAnalytics /></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={
        <ProtectedRoute allowedRoles={STAFF}><ReportsHub /></ProtectedRoute>} />
      <Route path="/dashboard/settings/sessions" element={
        <ProtectedRoute allowedRoles={ALL}><DeviceSessions /></ProtectedRoute>} />

      {/* ── Dress Shop module (/shop/*) ── */}
      <Route path="/shop"           element={<ShopRoute><ShopDashboard /></ShopRoute>} />
      <Route path="/shop/stock"     element={<ShopRoute><ShopStock /></ShopRoute>} />
      <Route path="/shop/billing"   element={<ShopRoute><ShopBilling /></ShopRoute>} />
      <Route path="/shop/returns"   element={<ShopRoute><ShopReturns /></ShopRoute>} />
      <Route path="/shop/reports"   element={<ShopRoute><ShopReports /></ShopRoute>} />
      <Route path="/shop/customers" element={<ShopRoute><ShopCustomers /></ShopRoute>} />
      <Route path="/shop/suppliers" element={<ShopRoute><ShopSuppliers /></ShopRoute>} />
      <Route path="/shop/search"    element={<ShopRoute><ShopSearch /></ShopRoute>} />
      <Route path="/shop/admin"     element={<ShopRoute adminOnly><ShopAdmin /></ShopRoute>} />

      <Route path="*" element={<Home />} />
    </Routes>
    </Suspense>
  );
}
