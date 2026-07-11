import PublicNavbar from "../../components/PublicNavbar.jsx";

export default function Contact() {
  return (
    <div>
      <PublicNavbar />
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink font-semibold mb-6">Contact</h1>
        <div className="grid sm:grid-cols-2 gap-8 text-indigo-600">
          <div>
            <p className="font-semibold text-ink mb-1">Address</p>
            <p>S.N Public School, Pindra, Varanasi, Uttar Pradesh</p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Office hours</p>
            <p>Monday – Saturday, 8:00 AM – 2:30 PM</p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">Admissions office</p>
            <p>admissions@snpublicschool.edu.in</p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-1">General enquiries</p>
            <p>info@snpublicschool.edu.in</p>
          </div>
        </div>
        <p className="text-xs text-indigo-400 mt-10">
          Replace the placeholder phone number, email, and map embed here with the school's real details before launch.
        </p>
      </section>
    </div>
  );
}
