import { Link } from "react-router-dom";
import logoUrl from "../assets/logo.png";

export default function PublicNavbar() {
  return (
    <nav className="bg-white border-b border-indigo-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3">
        <img src={logoUrl} alt="logo" className="w-10 h-10 object-contain"/>
        <div>
          <p className="font-display text-sm font-semibold text-indigo-700 leading-tight">St. S.N. Public School</p>
          <p className="text-indigo-400 text-xs">Pindra, Varanasi</p>
        </div>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm">
        {[["Home","/"],["About","/about"],["Admissions","/admissions"]].map(([l,p])=>(
          <Link key={l} to={p} className="text-indigo-500 hover:text-indigo-700 font-medium transition">{l}</Link>
        ))}
        <Link to="/login" className="btn-primary text-sm px-4 py-2">Staff / Student Login</Link>
      </div>
    </nav>
  );
}
