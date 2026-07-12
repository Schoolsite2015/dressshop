import { useState } from "react";
import PublicNavbar from "../../components/PublicNavbar.jsx";
import { api } from "../../lib/api.js";

const CLASSES = [
  "Nursery","LKG","UKG","Class 1","Class 2","Class 3","Class 4","Class 5",
  "Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12",
];

export default function Admissions() {
  const [form, setForm] = useState({
    applicantName: "", dob: "", classAppliedFor: "", parentName: "", motherName: "", aadharNo: "", phone: "", email: "", address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post("/admissions/apply", form);
      setResult(data.application);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PublicNavbar />
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink font-semibold mb-2">Admissions</h1>
        <p className="text-indigo-500 mb-10">
          Apply online for the 2026–27 academic year. Our office will contact you to schedule
          a document check and interview slot.
        </p>

        {result ? (
          <div className="bg-white border border-indigo-100 rounded-xl p-8">
            <p className="font-display text-2xl text-marigold-500 mb-2">Application received</p>
            <p className="text-indigo-600 mb-4">
              Thank you, {result.applicant_name}. Your application status is
              <strong> {result.status}</strong>.
            </p>
            <p className="text-sm text-indigo-500">
              Save your application ID to track its status: <code className="bg-indigo-50 px-2 py-1 rounded">{result.id}</code>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-indigo-100 rounded-xl p-8 grid sm:grid-cols-2 gap-5">
            <Field label="Student's full name" required>
              <input required value={form.applicantName} onChange={update("applicantName")} className="input" />
            </Field>
            <Field label="Date of birth">
              <input type="date" value={form.dob} onChange={update("dob")} className="input" />
            </Field>
            <Field label="Class applying for" required>
              <select required value={form.classAppliedFor} onChange={update("classAppliedFor")} className="input">
                <option value="">Select class</option>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Father / Guardian name" required>
              <input required value={form.parentName} onChange={update("parentName")} className="input" />
            </Field>
            <Field label="Mother's name">
              <input value={form.motherName} onChange={update("motherName")} className="input" />
            </Field>
            <Field label="Aadhar Card No. (12 digits)">
              <input type="text" maxLength={12} placeholder="Optional" value={form.aadharNo} onChange={update("aadharNo")} className="input" />
            </Field>
            <Field label="Phone number" required>
              <input required value={form.phone} onChange={update("phone")} className="input" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={update("email")} className="input" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <textarea value={form.address} onChange={update("address")} className="input" rows={3} />
              </Field>
            </div>

            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 bg-marigold-500 text-ink font-semibold py-3 rounded-lg hover:bg-marigold-400 transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </section>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #D6DAF0;
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.9rem;
          background: #FAF8F3;
        }
        .input:focus { outline: 2px solid #F5A623; outline-offset: 1px; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block text-sm">
      <span className="text-indigo-700 font-medium">
        {label} {required && <span className="text-marigold-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
