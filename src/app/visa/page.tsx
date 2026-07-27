"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { apiService } from "@/lib/services/api";
import { Visa } from "@/lib/types/database";
import { formatBDT, detectCountryFlagUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Clock, CheckCircle2, Briefcase, Building, GraduationCap, User, PhoneCall, Sparkles, Send } from "lucide-react";

function VisaContent() {
  const searchParams = useSearchParams();
  const initialCountry = searchParams.get("country") || "Saudi Arabia (Umrah / Tourist)";

  const [visas, setVisas] = useState<Visa[]>([]);
  const [selectedVisa, setSelectedVisa] = useState<Visa | null>(null);
  const [loading, setLoading] = useState(true);
  const [docCategory, setDocCategory] = useState<"job_holders" | "business_owners" | "students" | "others">("job_holders");

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadVisas() {
      setLoading(true);
      const data = await apiService.getVisas();
      setVisas(data);
      const matched = data.find(v => v.country.toLowerCase().includes(initialCountry.toLowerCase())) || data[0];
      setSelectedVisa(matched);
      setLoading(false);
    }
    loadVisas();

    window.addEventListener("isbah_data_updated", loadVisas);
    window.addEventListener("storage", loadVisas);
    return () => {
      window.removeEventListener("isbah_data_updated", loadVisas);
      window.removeEventListener("storage", loadVisas);
    };
  }, [initialCountry]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiService.submitVisaInquiry({
      name: fullName,
      phone,
      email,
      preferred_date: preferredDate,
      additional_requirements: `${selectedVisa?.country} Visa Assistance - ${notes}`,
    });
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-white text-slate-900">
      
      {/* Header Banner - CLEAN WHITE & SLATE */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <Badge variant="outline" className="font-bold text-xs">Visa Processing Hub</Badge>
          <h1 className="font-outfit text-3xl font-black text-slate-900">
            Tourist & Umrah Visa Document Guide
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Select destination country to view required documents and submit application.
          </p>
        </div>
      </div>

      {/* Country Selector Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        {visas.map((visa) => (
          <button
            key={visa.id}
            onClick={() => setSelectedVisa(visa)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shrink-0 border ${
              selectedVisa?.id === visa.id
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Image src={visa.flag_url || detectCountryFlagUrl(visa.country)} alt={visa.country} width={20} height={14} className="h-3.5 w-5 object-cover rounded shadow-xs border border-slate-200" />
            <span>{visa.country}</span>
          </button>
        ))}
      </div>

      {selectedVisa && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Requirements & Notes */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visa Overview Box */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase">{selectedVisa.visa_type}</span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedVisa.country}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Processing Fee</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatBDT(selectedVisa.fee)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  Processing Time: <strong className="text-slate-900">{selectedVisa.processing_time}</strong>
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200 font-medium">
                💡 <strong>Important Note:</strong> {selectedVisa.important_notes}
              </p>
            </div>

            {/* Document Checklist Tabs */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-xs">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-700" />
                  Required Document Checklist
                </h3>
              </div>

              {/* Profession Category Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setDocCategory("job_holders")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    docCategory === "job_holders"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Job Holder</span>
                </button>

                <button
                  onClick={() => setDocCategory("business_owners")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    docCategory === "business_owners"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <Building className="h-4 w-4" />
                  <span>Business</span>
                </button>

                <button
                  onClick={() => setDocCategory("students")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    docCategory === "students"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Student</span>
                </button>

                <button
                  onClick={() => setDocCategory("others")}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    docCategory === "others"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Others</span>
                </button>
              </div>

              {/* Documents List */}
              <div className="space-y-2 pt-2">
                {selectedVisa.documents_required[docCategory]?.map((docItem, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{docItem}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Right Column: Request Visa Assistance Form */}
          <div className="space-y-6">
            
            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-md space-y-4 sticky top-24">
              
              <div>
                <Badge variant="outline" className="mb-1 font-bold text-xs">Instant File Submission</Badge>
                <h3 className="font-black text-slate-900 text-lg">
                  Request Visa Assistance
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Provide your details and our visa consultant will contact you within 2 hours.
                </p>
              </div>

              {submitted ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1 text-center">
                  <h4 className="font-extrabold text-sm">Inquiry Received!</h4>
                  <p className="text-xs font-medium">Our visa desk will call you shortly on {phone}.</p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mohammad Rahman"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 01700000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahman@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Preferred Travel Date</label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-slate-400"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full font-bold text-xs gap-2 rounded-2xl mt-2">
                    <Send className="h-4 w-4" />
                    <span>Submit Visa Request</span>
                  </Button>
                </form>
              )}

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold space-y-1">
                <p className="flex items-center gap-1.5 font-bold text-slate-900">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
                  Visa Desk Hotline: +880 1700-123456
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default function VisaPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold">Loading Visa Services...</div>}>
      <VisaContent />
    </Suspense>
  );
}
