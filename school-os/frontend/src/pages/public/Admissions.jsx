import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, UploadCloud, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";

export default function Admissions() {
  const [formData, setFormData] = useState({
    applicantName: "",
    dob: "",
    classAppliedFor: "",
    parentName: "",
    phone: "",
    email: "",
    address: ""
  });
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Simulate file upload delay
      await new Promise(r => setTimeout(r, 1500));
      const res = await api.post("/admissions/apply", formData);
      setApplication(res.data.application);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50/50 flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block mb-4">
          <img src="/logo.png" alt="School Logo" className="w-16 h-16 mx-auto animate-bounce-in" />
        </Link>
        <h1 className="text-3xl font-display font-bold text-indigo-900">Online Admissions</h1>
        <p className="text-indigo-600 mt-2">Academic Session 2026-27</p>
      </div>

      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden border border-indigo-100">
        {/* Progress Bar */}
        <div className="flex">
          <div className={`h-2 flex-1 ${step >= 1 ? "bg-indigo-600" : "bg-gray-100"} transition-colors duration-500`} />
          <div className={`h-2 flex-1 ${step >= 2 ? "bg-indigo-600" : "bg-gray-100"} transition-colors duration-500`} />
          <div className={`h-2 flex-1 ${step === 3 ? "bg-green-500" : "bg-gray-100"} transition-colors duration-500`} />
        </div>

        <div className="p-8 sm:p-12">
          {step === 1 && (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={nextStep}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="text-indigo-600" /> Student Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Full Name *</label>
                  <input required type="text" name="applicantName" value={formData.applicantName} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Applied For *</label>
                    <select required name="classAppliedFor" value={formData.classAppliedFor} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white">
                      <option value="">Select Class</option>
                      <option value="Nursery">Nursery</option>
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      <option value="Class 1">Class 1</option>
                      <option value="Class 5">Class 5</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 11 (Science)">Class 11 (Science)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name *</label>
                  <input required type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2">
                  Continue to Documents <ArrowRight size={18} />
                </button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={submitApplication}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UploadCloud className="text-indigo-600" /> Contact & Documents
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="+91" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address *</label>
                  <textarea required name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
                
                <div className="mt-6 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-6 text-center">
                  <UploadCloud className="mx-auto text-indigo-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-indigo-900">Upload Birth Certificate & Photo</p>
                  <p className="text-xs text-indigo-500 mt-1">Simulated for Phase 2. Cloud storage integration pending.</p>
                  <button type="button" className="mt-3 bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">Browse Files</button>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

              <div className="mt-8 flex justify-between items-center">
                <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 font-medium px-4 py-2">
                  Back
                </button>
                <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-70">
                  {loading ? "Submitting..." : "Submit Application"} <CheckCircle size={18} />
                </button>
              </div>
            </motion.form>
          )}

          {step === 3 && application && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-500 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-600 mb-6">Thank you, {formData.parentName}. We have received the application for {formData.applicantName}.</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 inline-block text-left">
                <p className="text-sm text-gray-500 mb-1">Your Application ID</p>
                <p className="text-2xl font-mono font-bold text-indigo-700">{application.id.split("-")[0].toUpperCase()}</p>
                <p className="text-xs text-gray-400 mt-2">Please save this ID to track your application status.</p>
              </div>

              <div>
                <Link to="/" className="text-indigo-600 font-medium hover:underline">Return to Homepage</Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
