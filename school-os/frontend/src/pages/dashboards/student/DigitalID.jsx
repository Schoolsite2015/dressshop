import { motion } from "framer-motion";
import { useAuthStore } from "../../../store/authStore.js";
import { QRCodeSVG } from "qrcode.react";
import DashboardShell from "../../../components/DashboardShell.jsx";
import { Download, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default function DigitalID() {
  const { user } = useAuthStore();

  // Handle taking a screenshot/downloading (simulated for now)
  const handleDownload = () => {
    alert("Downloading Digital ID card (Simulated)");
  };

  return (
    <DashboardShell>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-indigo-900">Digital ID Card</h1>
          <p className="text-sm text-indigo-600 mt-1">Your official smart campus identity</p>
        </div>
        <button onClick={handleDownload} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition">
          <Download size={18} /> Download PDF
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ID Card Display */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[340px] flex-shrink-0"
        >
          <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-indigo-100 relative">
            {/* Header Pattern */}
            <div className="h-32 bg-indigo-700 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2C3670 0%, #1C2340 100%)" }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-marigold-500 rounded-full opacity-20 blur-2xl transform translate-x-10 -translate-y-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full opacity-10 blur-xl transform -translate-x-5 translate-y-5"></div>
              
              <div className="absolute inset-0 p-5 flex justify-between items-start">
                <img src="/logo.png" alt="School Logo" className="h-10 w-10 object-contain drop-shadow-md" />
                <div className="text-right text-white">
                  <p className="font-display font-bold text-[10px] leading-tight opacity-90 tracking-widest">ST. S.N.</p>
                  <p className="font-display font-bold text-[10px] leading-tight opacity-90 tracking-widest">PUBLIC SCHOOL</p>
                </div>
              </div>
            </div>

            {/* Profile Picture */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
              <div className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-lg rotate-3 transition-transform hover:rotate-0">
                <div className="w-full h-full rounded-xl bg-indigo-100 overflow-hidden flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🧑‍🎓</span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-16 pb-6 px-6 text-center">
              <h2 className="text-xl font-display font-bold text-gray-900 mt-2">{user?.name}</h2>
              <p className="text-sm font-semibold text-marigold-500 tracking-wide uppercase mt-1">Student</p>
              
              <div className="mt-6 mb-6 space-y-2 text-sm">
                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                  <span className="text-gray-500">Admission No</span>
                  <span className="font-mono font-medium text-gray-900">ADM-2023-089</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                  <span className="text-gray-500">Class & Section</span>
                  <span className="font-medium text-gray-900">Class 10 - A</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                  <span className="text-gray-500">DOB</span>
                  <span className="font-medium text-gray-900">14 Aug 2008</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500">Blood Group</span>
                  <span className="font-medium text-red-600 font-bold">O+</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="p-2 bg-white rounded-xl shadow-inner border border-gray-100">
                  <QRCodeSVG 
                    value={`https://snpublicschool.edu.in/verify/id/ADM-2023-089`}
                    size={80}
                    level="Q"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wider">Scan to Verify Identity</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
              <p className="text-[9px] text-gray-500">If found, please return to St. S.N. Public School, Pindra, Varanasi</p>
            </div>
          </div>
        </motion.div>

        {/* Info & Benefits Panel */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-50">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="text-green-500" /> Digital ID Benefits
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">1</div>
                <div>
                  <p className="font-medium text-gray-900">Always with you</p>
                  <p className="text-sm text-gray-600">Access your ID card anytime from your mobile device. Never worry about losing the physical card.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">2</div>
                <div>
                  <p className="font-medium text-gray-900">Instant Verification</p>
                  <p className="text-sm text-gray-600">The QR code is cryptographically signed. Staff and security can scan it for instant verification.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">3</div>
                <div>
                  <p className="font-medium text-gray-900">Library & Transport Access</p>
                  <p className="text-sm text-gray-600">Use this digital ID to check out books from the library or board the school bus.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 shadow-md text-white">
            <h3 className="text-lg font-bold mb-2">Need to update details?</h3>
            <p className="text-indigo-100 text-sm mb-4">If your blood group, photo, or address is incorrect, please contact the front office to have it updated in the system.</p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-indigo-100"><Phone size={14} /> +91 98765 43210</p>
              <p className="flex items-center gap-2 text-indigo-100"><Mail size={14} /> office@snpublicschool.edu.in</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
