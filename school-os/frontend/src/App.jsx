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
import PrincipalDashboard from "./pages/dashboards/principal/PrincipalDashboard.jsx";
import Attendance         from "./pages/dashboards/teacher/Attendance.jsx";
import QuickAttendance    from "./pages/dashboards/teacher/QuickAttendance.jsx";
import AIReportCard       from "./pages/dashboards/teacher/AIReportCard.jsx";
import Gradebook          from "./pages/dashboards/teacher/Gradebook.jsx";
import LessonPlanner      from "./pages/dashboards/teacher/LessonPlanner.jsx";
import QuestionPaper      from "./pages/dashboards/teacher/QuestionPaper.jsx";
import StudentDashboard   from "./pages/dashboards/student/StudentDashboard.jsx";
import ParentDashboard    from "./pages/dashboards/parent/ParentDashboard.jsx";
import OfficeDashboard    from "./pages/dashboards/office/OfficeDashboard.jsx";
import AdminSettings      from "./pages/dashboards/office/AdminSettings.jsx";

// Shared modules
import Timetable   from "./pages/dashboards/shared/Timetable.jsx";
import Homework    from "./pages/dashboards/shared/Homework.jsx";
import Notices     from "./pages/dashboards/shared/Notices.jsx";
import Library     from "./pages/dashboards/shared/Library.jsx";
import Transport   from "./pages/dashboards/shared/Transport.jsx";
import Hostel      from "./pages/dashboards/shared/Hostel.jsx";
import Inventory   from "./pages/dashboards/shared/Inventory.jsx";
import HRPayroll   from "./pages/dashboards/shared/HRPayroll.jsx";
import Certificates from "./pages/dashboards/shared/Certificates.jsx";
import Events      from "./pages/dashboards/shared/Events.jsx";
import Messages    from "./pages/dashboards/shared/Messages.jsx";

// ── Dress Shop module ─────────────────────────────────────────────────────────
import ShopDashboard  from "./pages/shop/ShopDashboard.jsx";
import ShopStock      from "./pages/shop/ShopStock.jsx";
import ShopBilling    from "./pages/shop/ShopBilling.jsx";
import ShopReturns    from "./pages/shop/ShopReturns.jsx";
import ShopReports    from "./pages/shop/ShopReports.jsx";
import ShopCustomers  from "./pages/shop/ShopCustomers.jsx";
import ShopSuppliers  from "./pages/shop/ShopSuppliers.jsx";
import ShopSearch     from "./pages/shop/ShopSearch.jsx";
import ShopAdmin      from "./pages/shop/ShopAdmin.jsx";
// ─────────────────────────────────────────────────────────────────────────────

const ALL = ["principal","teacher","student","parent","office","admin","hr","transport","librarian"];
const STAFF = ["principal","teacher","office","admin"];

// Wrapper that nests a shop page inside ShopShell + ShopAuthProvider
function ShopRoute({ children, adminOnly }) {
  return (
    <ProtectedRoute shopRoute allowedRoles={adminOnly ? ["admin"] : ["admin", "staff"]}>
      <ShopAuthProvider>
        <ShopShell>
          {children}
        </ShopShell>
      </ShopAuthProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
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
      <Route path="/dashboard/principal" element={
        <ProtectedRoute allowedRoles={["principal","admin"]}><PrincipalDashboard /></ProtectedRoute>} />

      <Route path="/dashboard/teacher/quick-attendance" element={
        <ProtectedRoute allowedRoles={["teacher","admin"]}><QuickAttendance /></ProtectedRoute>} />
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

      <Route path="/dashboard/student" element={
        <ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/parent" element={
        <ProtectedRoute allowedRoles={["parent"]}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/office" element={
        <ProtectedRoute allowedRoles={["office","principal","admin"]}><OfficeDashboard /></ProtectedRoute>} />
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
  );
}
