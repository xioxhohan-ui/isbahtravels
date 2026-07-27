"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { apiService } from "@/lib/services/api";
import { Visa } from "@/lib/types/database";
import { formatBDT, detectCountryFlagUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Plus, Edit3, Trash2, Clock, X } from "lucide-react";

export default function AdminVisasPage() {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisa, setEditingVisa] = useState<Visa | null>(null);

  // Form State
  const [country, setCountry] = useState("Malaysia");
  const [visaType, setVisaType] = useState("E-Visa (30 Days)");
  const [processingTime, setProcessingTime] = useState("3 - 5 Days");
  const [fee, setFee] = useState(7500);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    async function loadVisas() {
      setLoading(true);
      const data = await apiService.getVisas();
      setVisas(data);
      setLoading(false);
    }
    loadVisas();
  }, []);

  const handleOpenAddModal = () => {
    setEditingVisa(null);
    setCountry("Malaysia");
    setVisaType("30 Days Tourist E-Visa");
    setProcessingTime("3 - 5 Working Days");
    setFee(7500);
    setPostingDate(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (visa: Visa) => {
    setEditingVisa(visa);
    setCountry(visa.country);
    setVisaType(visa.visa_type);
    setProcessingTime(visa.processing_time);
    setFee(visa.fee);
    setPostingDate((visa as any).created_at ? (visa as any).created_at.split("T")[0] : new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this visa service entry?")) {
      await apiService.deleteVisa(id);
      setVisas(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const computedFlagUrl = detectCountryFlagUrl(country);

    const visaObj: Visa = {
      id: editingVisa ? editingVisa.id : `vs-${Date.now()}`,
      country,
      visa_type: visaType,
      processing_time: processingTime,
      fee: Number(fee),
      currency: "BDT",
      flag_url: computedFlagUrl,
      add_on_services: editingVisa?.add_on_services || ["Express File Check"],
      important_notes: editingVisa?.important_notes || "Valid passport required.",
      documents_required: editingVisa?.documents_required || {
        job_holders: ["Passport copy", "NOC"],
        business_owners: ["Passport copy", "Trade License"],
        students: ["Passport copy", "Student ID"],
        others: ["Passport copy", "Bank statement"],
      },
      contact_info: editingVisa?.contact_info || { address_line1: "Isbah Visa Desk", hotline: "+880 1700-123456" },
    };

    await apiService.saveVisa(visaObj);

    if (editingVisa) {
      setVisas(prev => prev.map(v => v.id === visaObj.id ? visaObj : v));
    } else {
      setVisas(prev => [visaObj, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-outfit text-2xl font-black text-slate-900">Manage Visa Services</h1>
          <p className="text-xs text-slate-500 font-semibold">Define visa types, document requirements, and processing fees.</p>
        </div>
        <Button onClick={handleOpenAddModal} size="sm" className="font-bold text-xs gap-1.5 rounded-xl">
          <Plus className="h-4 w-4" />
          <span>Add New Visa Type</span>
        </Button>
      </div>

      {/* Visa Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-bold">Loading visa services...</div>
        ) : (
          visas.map((visa) => (
            <div key={visa.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{visa.country}</h3>
                  <Image src={visa.flag_url || detectCountryFlagUrl(visa.country)} alt={visa.country} width={28} height={18} className="h-4 w-6 object-cover rounded shadow-xs border border-slate-200" />
                </div>

                <Badge variant="outline" className="text-[10px] font-bold">{visa.visa_type}</Badge>

                <p className="text-xs text-slate-500 flex items-center gap-1 font-semibold pt-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-700" />
                  Time: {visa.processing_time}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm">{formatBDT(visa.fee)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEditModal(visa)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(visa.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingVisa ? "Edit Visa Service" : "Add New Visa Service"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Country Name</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Visa Type</label>
                <input
                  type="text"
                  required
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Processing Time</label>
                  <input
                    type="text"
                    required
                    value={processingTime}
                    onChange={(e) => setProcessingTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Fee (BDT)</label>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase text-[10px] mb-1">Posting / Validity Date *</label>
                  <input
                    type="date"
                    required
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
                {editingVisa ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleDelete(editingVisa.id);
                      setIsModalOpen(false);
                    }}
                    size="sm"
                    className="font-bold text-xs text-rose-700 border-rose-200 hover:bg-rose-50 gap-1 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Visa</span>
                  </Button>
                ) : <div />}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="font-bold px-6">
                    Save Entry
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
