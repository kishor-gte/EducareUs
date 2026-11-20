import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Award, ArrowUpRight, Heart, Phone, Mail, MapPin, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer id="footer" className="bg-[#07166F] text-slate-300 text-sm border-t border-[#040e48] w-full relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB52E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-fluid px-3 px-sm-4 px-md-5 px-xl-5 py-16 w-100 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFB52E] text-[#172033] flex items-center justify-center font-bold shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight font-heading">
                Edu<span className="text-[#FFB52E]">careUs</span>
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Direct, transparent crowdfunding for India’s high-achieving medical, engineering, and professional college students. Verified identities, zero platform fee, and 100% direct fee transfers to accredited institutions.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-[#FFB52E] font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Registered Section 80G Non-Profit Education Platform</span>
            </div>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase font-heading flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFB52E]" /> Programs
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link to="/userdashboard?tab=enquiry" className="hover:text-[#FFB52E] transition-colors">
                  Medical (MBBS / BDS)
                </Link>
              </li>
              <li>
                <Link to="/userdashboard?tab=enquiry" className="hover:text-[#FFB52E] transition-colors">
                  Engineering (B.Tech / AI)
                </Link>
              </li>
              <li>
                <Link to="/userdashboard?tab=enquiry" className="hover:text-[#FFB52E] transition-colors">
                  Management (BBA / MBA)
                </Link>
              </li>
              <li>
                <Link to="/userdashboard?tab=enquiry" className="hover:text-[#FFB52E] transition-colors">
                  Pharmacy & Life Sciences
                </Link>
              </li>
              <li>
                <Link to="/userdashboard?tab=enquiry" className="hover:text-[#FFB52E] transition-colors">
                  Direct College Counseling
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Trust */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase font-heading flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFB52E]" /> Trust &amp; Safety
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-1">
                <span>100% Verified Scholars</span>
                <Award className="w-3.5 h-3.5 text-[#FFB52E]" />
              </li>
              <li>
                <span>Zero Commission Platform</span>
              </li>
              <li>
                <Link to="/blogs" className="hover:text-[#FFB52E] transition-colors">
                  Educational Blogs
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#FFB52E] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase font-heading flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FFB52E]" /> Office & Support
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FFB52E] shrink-0 mt-0.5" />
                <span>
                  EducareUs Foundation<br />
                  Central Wing, Connaught Place<br />
                  New Delhi - 110001, India
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FFB52E] shrink-0" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FFB52E] shrink-0" />
                <span>help@educarrus.org</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFB52E] shrink-0" />
                <span>Mon - Sat (9:30 AM - 7:00 PM)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} EducareUs / Educarrus Education Foundation. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQs</Link>
            <Link to="/blogs" className="hover:text-white transition-colors">Blogs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
